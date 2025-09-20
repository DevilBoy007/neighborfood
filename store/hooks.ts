import { useAppDispatch, useAppSelector } from './index';
import { 
  loadUserData, 
  saveUserData, 
  updateUserData as updateUserDataThunk, 
  clearUserData as clearUserDataThunk,
  UserData 
} from './slices/userSlice';
import {
  fetchCurrentLocation,
  updateLocation,
  formatDistance
} from './slices/locationSlice';
import {
  setSelectedShop,
  clearSelectedShop,
  setShops,
  setIsLoadingShop,
  ShopData
} from './slices/shopSlice';
import {
  setSelectedItem,
  clearSelectedItem,
  setIsLoadingItem,
  ItemData
} from './slices/itemSlice';
import {
  initializeOrders,
  refreshOrders,
  setPlacedOrders,
  setReceivedOrders,
  setSelectedOrder,
  setOrderHistory,
  addToOrderHistory,
  addToPlacedOrders,
  addToReceivedOrders,
  updateOrderStatus,
  resetOrderContext,
  OrderData,
  OrderStatus
} from './slices/orderSlice';
import {
  loadCart,
  addToCart as addToCartAction,
  removeFromCart,
  updateItemQuantity,
  clearCart,
  clearShopCart,
  selectTotalSubtotal,
  selectItemCount,
  selectShopCount,
  CartItem,
  ShopCart
} from './slices/cartSlice';
import { useEffect } from 'react';
import * as Location from 'expo-location';

// User hook (replaces useUser)
export const useUser = () => {
  const dispatch = useAppDispatch();
  const { userData, isLoading } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(loadUserData());
  }, [dispatch]);

  const setUserData = (data: UserData | null) => {
    dispatch(saveUserData(data));
  };

  const updateUserData = (data: Partial<UserData>) => {
    dispatch(updateUserDataThunk(data));
  };

  const clearUserData = () => {
    dispatch(clearUserDataThunk());
  };

  return {
    userData,
    isLoading,
    setUserData,
    updateUserData,
    clearUserData,
  };
};

// Location hook (replaces useLocation)
export const useLocation = () => {
  const dispatch = useAppDispatch();
  const locationData = useAppSelector((state) => state.location);

  useEffect(() => {
    dispatch(fetchCurrentLocation());
  }, [dispatch]);

  const updateLocationCoords = (location: Location.LocationObjectCoords) => {
    dispatch(updateLocation(location));
  };

  const fetchCurrentLocationAsync = () => {
    return dispatch(fetchCurrentLocation());
  };

  const formatDistanceFunc = (distanceInKm: number): string => {
    return formatDistance(distanceInKm, locationData.usesImperialSystem);
  };

  return {
    locationData,
    updateLocation: updateLocationCoords,
    fetchCurrentLocation: fetchCurrentLocationAsync,
    formatDistance: formatDistanceFunc,
  };
};

// Shop hook (replaces useShop)
export const useShop = () => {
  const dispatch = useAppDispatch();
  const { selectedShop, shops, isLoadingShop } = useAppSelector((state) => state.shop);

  const setSelectedShopFunc = (shop: ShopData | null) => {
    dispatch(setSelectedShop(shop));
  };

  const clearSelectedShopFunc = () => {
    dispatch(clearSelectedShop());
  };

  const setShopsFunc = (shops: ShopData[]) => {
    dispatch(setShops(shops));
  };

  const setIsLoadingShopFunc = (isLoading: boolean) => {
    dispatch(setIsLoadingShop(isLoading));
  };

  return {
    selectedShop,
    shops,
    isLoadingShop,
    setSelectedShop: setSelectedShopFunc,
    clearSelectedShop: clearSelectedShopFunc,
    setShops: setShopsFunc,
    setIsLoadingShop: setIsLoadingShopFunc,
  };
};

// Item hook (replaces useItem)
export const useItem = () => {
  const dispatch = useAppDispatch();
  const { selectedItem, isLoadingItem } = useAppSelector((state) => state.item);

  const setSelectedItemFunc = (item: ItemData | null) => {
    dispatch(setSelectedItem(item));
  };

  const clearSelectedItemFunc = () => {
    dispatch(clearSelectedItem());
  };

  const setIsLoadingItemFunc = (isLoading: boolean) => {
    dispatch(setIsLoadingItem(isLoading));
  };

  return {
    selectedItem,
    isLoadingItem,
    setSelectedItem: setSelectedItemFunc,
    clearSelectedItem: clearSelectedItemFunc,
    setIsLoadingItem: setIsLoadingItemFunc,
  };
};

// Order hook (replaces useOrder)
export const useOrder = () => {
  const dispatch = useAppDispatch();
  const { 
    placedOrders, 
    receivedOrders, 
    orderHistory, 
    selectedOrder, 
    isLoadingOrders, 
    isInitialized 
  } = useAppSelector((state) => state.order);

  const setPlacedOrdersFunc = (orders: OrderData[]) => {
    dispatch(setPlacedOrders(orders));
  };

  const setReceivedOrdersFunc = (orders: OrderData[]) => {
    dispatch(setReceivedOrders(orders));
  };

  const setSelectedOrderFunc = (order: OrderData | null) => {
    dispatch(setSelectedOrder(order));
  };

  const setOrderHistoryFunc = (orders: OrderData[]) => {
    dispatch(setOrderHistory(orders));
  };

  const addToOrderHistoryFunc = (order: OrderData) => {
    dispatch(addToOrderHistory(order));
  };

  const addToPlacedOrdersFunc = (order: OrderData) => {
    dispatch(addToPlacedOrders(order));
  };

  const addToReceivedOrdersFunc = (order: OrderData) => {
    dispatch(addToReceivedOrders(order));
  };

  const updateOrderStatusFunc = (orderId: string, status: OrderStatus) => {
    dispatch(updateOrderStatus({ orderId, status }));
  };

  const initializeOrdersFunc = (userId: string) => {
    return dispatch(initializeOrders(userId));
  };

  const refreshOrdersFunc = (userId: string) => {
    return dispatch(refreshOrders(userId));
  };

  const resetOrderContextFunc = () => {
    dispatch(resetOrderContext());
  };

  return {
    placedOrders,
    receivedOrders,
    orderHistory,
    selectedOrder,
    isLoadingOrders,
    isInitialized,
    setPlacedOrders: setPlacedOrdersFunc,
    setReceivedOrders: setReceivedOrdersFunc,
    setSelectedOrder: setSelectedOrderFunc,
    setOrderHistory: setOrderHistoryFunc,
    addToOrderHistory: addToOrderHistoryFunc,
    addToPlacedOrders: addToPlacedOrdersFunc,
    addToReceivedOrders: addToReceivedOrdersFunc,
    updateOrderStatus: updateOrderStatusFunc,
    initializeOrders: initializeOrdersFunc,
    refreshOrders: refreshOrdersFunc,
    resetOrderContext: resetOrderContextFunc,
  };
};

// Cart hook (replaces useCart)
export const useCart = () => {
  const dispatch = useAppDispatch();
  const { shopCarts, isLoadingCart } = useAppSelector((state) => state.cart);
  const totalSubtotal = useAppSelector(selectTotalSubtotal);
  const itemCount = useAppSelector(selectItemCount);
  const shopCount = useAppSelector(selectShopCount);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  const addToCartFunc = (item: Omit<CartItem, 'id'> & { 
    shopId: string; 
    shopName: string; 
    shopPhotoURL?: string; 
    allowPickup: boolean; 
    localDelivery: boolean 
  }) => {
    const { shopId, shopName, shopPhotoURL, allowPickup, localDelivery, ...itemData } = item;
    dispatch(addToCartAction({
      item: itemData,
      shopId,
      shopName,
      shopPhotoURL,
      allowPickup,
      localDelivery
    }));
  };

  const removeFromCartFunc = (shopId: string, itemId: string) => {
    dispatch(removeFromCart({ shopId, itemId }));
  };

  const updateItemQuantityFunc = (shopId: string, itemId: string, quantity: number) => {
    dispatch(updateItemQuantity({ shopId, itemId, quantity }));
  };

  const clearCartFunc = () => {
    dispatch(clearCart());
  };

  const clearShopCartFunc = (shopId: string) => {
    dispatch(clearShopCart(shopId));
  };

  const calculateTotalSubtotal = () => {
    return totalSubtotal;
  };

  const getItemCount = () => {
    return itemCount;
  };

  const getShopCount = () => {
    return shopCount;
  };

  return {
    shopCarts,
    isLoadingCart,
    addToCart: addToCartFunc,
    removeFromCart: removeFromCartFunc,
    updateItemQuantity: updateItemQuantityFunc,
    clearCart: clearCartFunc,
    clearShopCart: clearShopCartFunc,
    calculateTotalSubtotal,
    getItemCount,
    getShopCount,
  };
};

// Export types for convenience
export type { UserData, ShopData, ItemData, OrderData, OrderStatus, CartItem, ShopCart };