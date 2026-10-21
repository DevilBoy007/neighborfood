import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'expo-router';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { useShop, useLocation, ShopData } from '@/store/reduxHooks';
import { getShopCoordinates } from '@/types';

interface MarkerData {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description: string;
  image?: string;
}

interface WebMapScreenProps {
  shops?: ShopData[];
}

const toValidNumber = (value: unknown): number | null => {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const getValidMapPosition = (
  latitude: unknown,
  longitude: unknown
): { lat: number; lng: number } | null => {
  const lat = toValidNumber(latitude);
  const lng = toValidNumber(longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
};

const MapScreenWeb = ({ shops = [] }: WebMapScreenProps) => {
  const router = useRouter();
  const { locationData, fetchCurrentLocation } = useLocation();
  const { setSelectedShop } = useShop();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [mapKey, setMapKey] = useState(Date.now()); // Add key to force re-render

  useEffect(() => {
    fetchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (locationData.coords) {
      const userPosition = getValidMapPosition(
        locationData.coords.latitude,
        locationData.coords.longitude
      );

      // Create user location marker
      const baseMarkers = userPosition
        ? [
            {
              id: 'user-location',
              position: userPosition,
              title: 'You are here',
              description: 'This is your current location',
              image: '',
            },
          ]
        : [];

      // Create shop markers
      const shopMarkers = shops.reduce<MarkerData[]>((accumulator, shop) => {
        const shopCoordinates = getShopCoordinates(shop.location);
        const shopPosition = shopCoordinates
          ? getValidMapPosition(shopCoordinates.latitude, shopCoordinates.longitude)
          : null;

        if (!shopPosition) {
          return accumulator;
        }

        accumulator.push({
          id: shop.id,
          position: shopPosition,
          title: shop.name,
          description: shop.description,
          image: shop.backgroundImageUrl,
        });

        return accumulator;
      }, []);

      setMarkers([...baseMarkers, ...shopMarkers]);

      // Force map to re-render when coordinates are available
      setMapKey(Date.now());
    }
  }, [locationData.coords, shops]);

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarkerId(markerId === selectedMarkerId ? null : markerId);
  };

  const handleCalloutPress = (markerId: string) => {
    const shop = shops.find((shop) => shop.id === markerId);
    if (shop) {
      setSelectedShop(shop);
      router.navigate('/ShopDetails');
    }
  };

  if (locationData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00bfff" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (locationData.error) {
    return <Text style={styles.errorText}>{locationData.error}</Text>;
  }

  if (!locationData.coords) {
    return <Text style={styles.loadingText}>Waiting for location data...</Text>;
  }

  const defaultCenter = getValidMapPosition(
    locationData.coords.latitude,
    locationData.coords.longitude
  );

  if (!defaultCenter) {
    return <Text style={styles.errorText}>Could not load valid map coordinates.</Text>;
  }

  return (
    <APIProvider
      apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      key={mapKey} // Use key to force re-render
    >
      <Map
        style={styles.map}
        defaultCenter={defaultCenter}
        defaultZoom={12}
        mapId={'market'}
        reuseMaps={true}
      >
        {markers.map((marker) => (
          <Fragment key={marker.id}>
            <AdvancedMarker
              position={marker.position}
              title={marker.title}
              onClick={() => handleMarkerClick(marker.id)}
            >
              <Pin
                background={marker.id === 'user-location' ? '#00bfff' : '#b7ffb0'}
                borderColor={'#006425'}
                glyphColor={'#ffffff'}
                glyph={marker.id === 'user-location' ? '📍' : '🐰'}
              />
            </AdvancedMarker>
            {selectedMarkerId === marker.id && (
              <InfoWindow
                headerContent={
                  <img
                    src={marker.image}
                    style={{ height: 75, width: 150, cursor: 'pointer' }}
                    onClick={() => {
                      handleCalloutPress(marker.id);
                    }}
                  />
                }
                position={marker.position}
                onCloseClick={() => setSelectedMarkerId(null)}
              >
                <div onClick={() => handleCalloutPress(marker.id)} style={{ cursor: 'pointer' }}>
                  <h3>{marker.title}</h3>
                  <p>
                    <i>{marker.description}</i>
                  </p>
                </div>
              </InfoWindow>
            )}
          </Fragment>
        ))}
      </Map>
    </APIProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
    color: '#333',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginVertical: 2,
    marginHorizontal: 2,
    fontFamily: 'TextMeOne',
    fontSize: 21,
  },
});

export default MapScreenWeb;
