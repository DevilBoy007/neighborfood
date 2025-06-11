import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { useGoogleMaps } from './GoogleMapsLoader';

interface PlaceData {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface WebGooglePlacesAutocompleteProps {
  placeholder?: string;
  textInputProps?: any;
  onPress: (data: PlaceData, details: PlaceDetails) => void;
  query: {
    key: string;
    language?: string;
  };
  styles?: {
    textInput?: any;
    container?: any;
  };
  fetchDetails?: boolean;
  minLength?: number;
}

const WebGooglePlacesAutocomplete: React.FC<WebGooglePlacesAutocompleteProps> = ({
  placeholder = 'Enter location',
  textInputProps = {},
  onPress,
  query,
  styles = {},
  fetchDetails = true,
  minLength = 4
}) => {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const { isLoaded, hasError } = useGoogleMaps();
  const timeoutRef = useRef<number | undefined>(undefined);
  const sessionToken = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize services when Google Maps API is loaded
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      // Create a PlacesService instance for place details
      placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      createNewSessionToken();
    }
  }, [isLoaded]);

  // Create a new session token for grouping related Place API calls
  const createNewSessionToken = () => {
    if (window.google?.maps?.places) {
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  };

  const fetchPredictions = (input: string) => {
    if (input.length < minLength || !isLoaded || !window.google?.maps?.places) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setLoading(true);
    
    // Use the AutocompleteService
    const autocompleteService = new window.google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions(
      {
        input,
        sessionToken: sessionToken.current
      },
      (predictions, status) => {
        setLoading(false);
        
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          console.error('Error fetching predictions:', status);
          setPredictions([]);
          setShowPredictions(false);
          return;
        }

        setPredictions(predictions as PlaceData[]);
        setShowPredictions(true);
      }
    );
  };

  const fetchPlaceDetails = (placeId: string): Promise<PlaceDetails | null> => {
    return new Promise((resolve) => {
      if (!placesServiceRef.current) {
        resolve(null);
        return;
      }

      // Use PlacesService for getting place details
      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['address_components', 'formatted_address', 'geometry'],
          sessionToken: sessionToken.current
        },
        (details: any, status: string) => {
          // Create a new session token for future searches
          // As recommended by Google, create a new token after a getDetails call
          createNewSessionToken();
          
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !details) {
            console.error('Error fetching place details:', status);
            resolve(null);
            return;
          }

          resolve(details);
        }
      );
    });
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchPredictions(text);
    }, 300);
  };

  const handlePredictionPress = async (prediction: PlaceData) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    if (fetchDetails) {
      const details = await fetchPlaceDetails(prediction.place_id);
      if (details) {
        onPress(prediction, details);
      }
    } else {
      onPress(prediction, {} as PlaceDetails);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[defaultStyles.container, styles.container]}>
      <TextInput
        ref={inputRef}
        style={[defaultStyles.textInput, styles.textInput]}
        placeholder={placeholder}
        value={inputValue}
        onChangeText={handleInputChange}
        {...textInputProps}
      />
      
      {hasError && (
        <View style={defaultStyles.errorContainer}>
          <Text style={defaultStyles.errorText}>Google Maps could not be loaded</Text>
        </View>
      )}
      
      {!isLoaded && (
        <View style={defaultStyles.loadingContainer}>
          <Text style={defaultStyles.loadingText}>Loading Google Maps...</Text>
        </View>
      )}
      
      {showPredictions && predictions.length > 0 ? (
        <View style={defaultStyles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={defaultStyles.predictionItem}
                onPress={() => handlePredictionPress(item)}
              >
                <Text style={defaultStyles.predictionText}>
                  {item.structured_formatting?.main_text || item.description}
                </Text>
                {item.structured_formatting?.secondary_text ? (
                  <Text style={defaultStyles.predictionSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
            style={defaultStyles.predictionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : null}
      
      {loading ? (
        <View style={defaultStyles.loadingContainer}>
          <Text style={defaultStyles.loadingText}>Loading...</Text>
        </View>
      ) : null}
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    height: 50,
  },
  predictionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    zIndex: 10000,
    maxHeight: 200,
    overflow: 'visible'
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  predictionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#ffeeee',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
  },
});

export default WebGooglePlacesAutocomplete;
