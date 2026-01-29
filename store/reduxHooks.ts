/**
 * Redux-based hooks that provide the same API as the original context hooks.
 * This allows for a smooth migration from React Context to Redux.
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  setUserData as setUserDataAction,
  updateUserData as updateUserDataAction,
  clearUserData as clearUserDataAction,
  saveUserData,
  loadUserData,
  UserData,
} from './slices/userSlice';
import { fetchCurrentLocation, updateLocationCoords, formatDistance } from './slices/locationSlice';
import {
  setSelectedShop as setSelectedShopAction,
  clearSelectedShop as clearSelectedShopAction,
  setShops as setShopsAction,
  setIsLoadingShop as setIsLoadingShopAction,
  ShopData,
} from './slices/shopSlice';
import {
  setSelectedItem as setSelectedItemAction,
  clearSelectedItem as clearSelectedItemAction,
  setIsLoadingItem as setIsLoadingItemAction,
  ItemData,
} from './slices/itemSlice';
import {
  setPlacedOrders,
  setReceivedOrders,
  setSelectedOrder as setSelectedOrderAction,
  setOrderHistory,
  addToOrderHistory as addToOrderHistoryAction,
  addToPlacedOrders as addToPlacedOrdersAction,
  addToReceivedOrders as addToReceivedOrdersAction,
  updateOrderStatusAsync,
  initializeOrders,
  refreshOrders,
  resetOrderState,
  selectAllOrders,
  OrderData,
  OrderStatus,
} from './slices/orderSlice';
import {
  fetchThreads,
  fetchMessages,
  sendMessage as sendMessageAction,
  createOrGetThread as createOrGetThreadAction,
  deleteThread as deleteThreadAction,
  markThreadAsRead as markThreadAsReadAction,
  setSelectedThread as setSelectedThreadAction,
  clearSelectedThread as clearSelectedThreadAction,
  clearMessages,
  addMessageLocally,
  resetMessageState,
  ThreadData,
  MessageData,
  MessageType,
} from './slices/messageSlice';
import {
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateItemQuantity as updateItemQuantityAction,
  clearCart as clearCartAction,
  clearShopCart as clearShopCartAction,
  loadCart,
  saveCart,
  selectTotalSubtotal,
  selectItemCount,
  selectShopCount,
} from './slices/cartSlice';
import * as Location from 'expo-location';

/**
 * Hook that provides the same API as the original useUser context hook
 */
export const useUser = () => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.user.userData);
  const isLoading = useAppSelector((state) => state.user.isLoading);

  const setUserData = useCallback(
    async (data: UserData | null) => {
      dispatch(setUserDataAction(data));
      await dispatch(saveUserData(data));
    },
    [dispatch]
  );

  const updateUserData = useCallback(
    async (newData: Partial<UserData>) => {
      dispatch(updateUserDataAction(newData));
      // The userData update is handled by the reducer
      // Save is handled separately when needed
    },
    [dispatch]
  );

  const clearUserData = useCallback(async () => {
    await dispatch(clearUserDataAction());
  }, [dispatch]);

  return {
    userData,
    isLoading,
    setUserData,
    updateUserData,
    clearUserData,
  };
};

/**
 * Hook that provides the same API as the original useLocation context hook
 */
export const useLocation = () => {
  const dispatch = useAppDispatch();
  const locationData = useAppSelector((state) => state.location);

  const updateLocation = useCallback(
    async (coords: Location.LocationObjectCoords) => {
      await dispatch(updateLocationCoords(coords));
    },
    [dispatch]
  );

  const fetchLocation = useCallback(async () => {
    await dispatch(fetchCurrentLocation());
  }, [dispatch]);

  const formatDistanceHelper = useCallback(
    (distanceInKm: number): string => {
      return formatDistance(distanceInKm, locationData.usesImperialSystem);
    },
    [locationData.usesImperialSystem]
  );

  return {
    locationData,
    updateLocation,
    fetchCurrentLocation: fetchLocation,
    formatDistance: formatDistanceHelper,
  };
};

/**
 * Hook that provides the same API as the original useShop context hook
 */
export const useShop = () => {
  const dispatch = useAppDispatch();
  const selectedShop = useAppSelector((state) => state.shop.selectedShop);
  const shops = useAppSelector((state) => state.shop.shops);
  const isLoadingShop = useAppSelector((state) => state.shop.isLoadingShop);

  const setSelectedShop = useCallback(
    (shop: ShopData | null) => {
      dispatch(setSelectedShopAction(shop));
    },
    [dispatch]
  );

  const clearSelectedShop = useCallback(() => {
    dispatch(clearSelectedShopAction());
  }, [dispatch]);

  const setShops = useCallback(
    (newShops: ShopData[]) => {
      dispatch(setShopsAction(newShops));
    },
    [dispatch]
  );

  const setIsLoadingShop = useCallback(
    (isLoading: boolean) => {
      dispatch(setIsLoadingShopAction(isLoading));
    },
    [dispatch]
  );

  return {
    selectedShop,
    shops,
    isLoadingShop,
    setSelectedShop,
    clearSelectedShop,
    setShops,
    setIsLoadingShop,
  };
};

/**
 * Hook that provides the same API as the original useItem context hook
 */
export const useItem = () => {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector((state) => state.item.selectedItem);
  const isLoadingItem = useAppSelector((state) => state.item.isLoadingItem);

  const setSelectedItem = useCallback(
    (item: ItemData | null) => {
      dispatch(setSelectedItemAction(item));
    },
    [dispatch]
  );

  const clearSelectedItem = useCallback(() => {
    dispatch(clearSelectedItemAction());
  }, [dispatch]);

  const setIsLoadingItem = useCallback(
    (isLoading: boolean) => {
      dispatch(setIsLoadingItemAction(isLoading));
    },
    [dispatch]
  );

  return {
    selectedItem,
    isLoadingItem,
    setSelectedItem,
    clearSelectedItem,
    setIsLoadingItem,
  };
};

/**
 * Hook that provides the same API as the original useOrder context hook
 */
export const useOrder = () => {
  const dispatch = useAppDispatch();
  const placedOrders = useAppSelector((state) => state.order?.placedOrders ?? []);
  const receivedOrders = useAppSelector((state) => state.order?.receivedOrders ?? []);
  const orderHistory = useAppSelector((state) => state.order?.orderHistory ?? []);
  const allOrders = useAppSelector(selectAllOrders);
  const selectedOrder = useAppSelector((state) => state.order?.selectedOrder ?? null);
  const isLoadingOrders = useAppSelector((state) => state.order?.isLoadingOrders ?? false);
  const isInitialized = useAppSelector((state) => state.order?.isInitialized ?? false);

  const setPlacedOrdersHandler = useCallback(
    (orders: OrderData[]) => {
      dispatch(setPlacedOrders(orders));
    },
    [dispatch]
  );

  const setReceivedOrdersHandler = useCallback(
    (orders: OrderData[]) => {
      dispatch(setReceivedOrders(orders));
    },
    [dispatch]
  );

  const setSelectedOrder = useCallback(
    (order: OrderData | null) => {
      dispatch(setSelectedOrderAction(order));
    },
    [dispatch]
  );

  const setOrderHistoryHandler = useCallback(
    (orders: OrderData[]) => {
      dispatch(setOrderHistory(orders));
    },
    [dispatch]
  );

  const addToOrderHistory = useCallback(
    (order: OrderData) => {
      dispatch(addToOrderHistoryAction(order));
    },
    [dispatch]
  );

  const addToPlacedOrders = useCallback(
    (order: OrderData) => {
      dispatch(addToPlacedOrdersAction(order));
    },
    [dispatch]
  );

  const addToReceivedOrders = useCallback(
    (order: OrderData) => {
      dispatch(addToReceivedOrdersAction(order));
    },
    [dispatch]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, shopId: string, status: OrderStatus) => {
      await dispatch(updateOrderStatusAsync({ orderId, shopId, status }));
    },
    [dispatch]
  );

  const initializeOrdersHandler = useCallback(
    async (userId: string) => {
      await dispatch(initializeOrders(userId));
    },
    [dispatch]
  );

  const refreshOrdersHandler = useCallback(
    async (userId: string) => {
      await dispatch(refreshOrders(userId));
    },
    [dispatch]
  );

  const resetOrderContext = useCallback(() => {
    dispatch(resetOrderState());
  }, [dispatch]);

  return {
    placedOrders,
    receivedOrders,
    orderHistory,
    allOrders,
    selectedOrder,
    isLoadingOrders,
    isInitialized,
    setPlacedOrders: setPlacedOrdersHandler,
    setReceivedOrders: setReceivedOrdersHandler,
    setSelectedOrder,
    setOrderHistory: setOrderHistoryHandler,
    addToOrderHistory,
    addToPlacedOrders,
    addToReceivedOrders,
    updateOrderStatus,
    initializeOrders: initializeOrdersHandler,
    refreshOrders: refreshOrdersHandler,
    resetOrderContext,
  };
};

/**
 * Hook that provides the same API as the original useCart context hook
 */
export const useCart = () => {
  const dispatch = useAppDispatch();
  const shopCarts = useAppSelector((state) => state.cart.shopCarts);
  const isLoadingCart = useAppSelector((state) => state.cart.isLoadingCart);
  const totalSubtotal = useAppSelector(selectTotalSubtotal);
  const itemCount = useAppSelector(selectItemCount);
  const shopCount = useAppSelector(selectShopCount);

  const addToCart = useCallback(
    (
      item: Omit<
        {
          itemId: string;
          name: string;
          price: number;
          quantity: number;
          photoURL?: string;
          negotiable?: boolean;
        },
        'id'
      > & {
        shopId: string;
        shopName: string;
        shopPhotoURL?: string;
        allowPickup: boolean;
        localDelivery: boolean;
      }
    ) => {
      dispatch(addToCartAction(item));
    },
    [dispatch]
  );

  const removeFromCart = useCallback(
    (shopId: string, itemId: string) => {
      dispatch(removeFromCartAction({ shopId, itemId }));
    },
    [dispatch]
  );

  const updateItemQuantity = useCallback(
    (shopId: string, itemId: string, quantity: number) => {
      dispatch(updateItemQuantityAction({ shopId, itemId, quantity }));
    },
    [dispatch]
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  const clearShopCart = useCallback(
    (shopId: string) => {
      dispatch(clearShopCartAction(shopId));
    },
    [dispatch]
  );

  const calculateTotalSubtotal = useCallback((): number => {
    return totalSubtotal;
  }, [totalSubtotal]);

  const getItemCount = useCallback((): number => {
    return itemCount;
  }, [itemCount]);

  const getShopCount = useCallback((): number => {
    return shopCount;
  }, [shopCount]);

  return {
    shopCarts,
    isLoadingCart,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    clearShopCart,
    calculateTotalSubtotal,
    getItemCount,
    getShopCount,
  };
};

// Re-export types for convenience
export type { UserData } from './slices/userSlice';
export type { ShopData } from './slices/shopSlice';
export type { ItemData } from './slices/itemSlice';
export type { OrderData, OrderStatus } from './slices/orderSlice';
export type { ThreadData, MessageData, MessageType } from './slices/messageSlice';

/**
 * Hook that provides messaging functionality
 */
export const useMessage = () => {
  const dispatch = useAppDispatch();
  const threads = useAppSelector((state) => state.message?.threads ?? []);
  const selectedThread = useAppSelector((state) => state.message?.selectedThread ?? null);
  const messages = useAppSelector((state) => state.message?.messages ?? []);
  const isLoadingThreads = useAppSelector((state) => state.message?.isLoadingThreads ?? false);
  const isLoadingMessages = useAppSelector((state) => state.message?.isLoadingMessages ?? false);
  const isSendingMessage = useAppSelector((state) => state.message?.isSendingMessage ?? false);
  const isInitialized = useAppSelector((state) => state.message?.isInitialized ?? false);

  const loadThreads = useCallback(
    async (userId: string) => {
      await dispatch(fetchThreads(userId));
    },
    [dispatch]
  );

  const loadMessages = useCallback(
    async (threadId: string) => {
      await dispatch(fetchMessages(threadId));
    },
    [dispatch]
  );

  const sendMessage = useCallback(
    async (
      threadId: string,
      message: {
        type: MessageType;
        content?: string;
        orderId?: string;
        orderData?: object;
      }
    ) => {
      await dispatch(sendMessageAction({ threadId, message }));
    },
    [dispatch]
  );

  const createOrGetThread = useCallback(
    async (
      participantIds: string[],
      initialMessage?: {
        type: MessageType;
        content?: string;
        orderId?: string;
        orderData?: object;
      }
    ) => {
      const result = await dispatch(createOrGetThreadAction({ participantIds, initialMessage }));
      return result.payload as ThreadData & { isNew: boolean };
    },
    [dispatch]
  );

  const removeThread = useCallback(
    async (threadId: string) => {
      await dispatch(deleteThreadAction(threadId));
    },
    [dispatch]
  );

  const markAsRead = useCallback(
    async (threadId: string) => {
      await dispatch(markThreadAsReadAction(threadId));
    },
    [dispatch]
  );

  const setSelectedThread = useCallback(
    (thread: ThreadData | null) => {
      dispatch(setSelectedThreadAction(thread));
    },
    [dispatch]
  );

  const clearSelectedThread = useCallback(() => {
    dispatch(clearSelectedThreadAction());
  }, [dispatch]);

  const addLocalMessage = useCallback(
    (message: MessageData) => {
      dispatch(addMessageLocally(message));
    },
    [dispatch]
  );

  const resetMessages = useCallback(() => {
    dispatch(resetMessageState());
  }, [dispatch]);

  return {
    threads,
    selectedThread,
    messages,
    isLoadingThreads,
    isLoadingMessages,
    isSendingMessage,
    isInitialized,
    loadThreads,
    loadMessages,
    sendMessage,
    createOrGetThread,
    removeThread,
    markAsRead,
    setSelectedThread,
    clearSelectedThread,
    addLocalMessage,
    resetMessages,
  };
};
