import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import firebaseService from '../../handlers/firebaseService';

type OrderItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  photoURL?: string;
};

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'in-delivery'
  | 'completed'
  | 'cancelled';

export type OrderData = {
  id: string;
  userId: string;
  shopId: string;
  shopName: string;
  shopPhotoURL?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: { seconds: number; nanoseconds: number };
  estimatedDeliveryTime?: { seconds: number; nanoseconds: number };
  deliveredAt?: { seconds: number; nanoseconds: number };
  paymentMethod: string;
  deliveryAddress: string;
  contactPhone: string;
  deliveryOption: 'pickup' | 'delivery';
};

type OrderState = {
  placedOrders: OrderData[];
  receivedOrders: OrderData[];
  orderHistory: OrderData[];
  allOrders: OrderData[];
  selectedOrder: OrderData | null;
  isLoadingOrders: boolean;
  isInitialized: boolean;
};

const initialState: OrderState = {
  placedOrders: [],
  receivedOrders: [],
  orderHistory: [],
  allOrders: [],
  selectedOrder: null,
  isLoadingOrders: false,
  isInitialized: false,
};

export const initializeOrders = createAsyncThunk(
  'order/initializeOrders',
  async (userId: string, { getState, rejectWithValue }) => {
    const state = getState() as { order: OrderState };
    if (state.order.isInitialized) {
      console.log('Orders already initialized, skipping...');
      return null;
    }

    try {
      console.log('Initializing comprehensive orders for user:', userId);
      const { placedOrders, receivedOrders, allOrders } =
        await firebaseService.getOrdersForUser(userId);

      const orderHistoryData = allOrders.filter(
        (order) => order.status === 'completed' || order.status === 'cancelled'
      );

      console.log(
        `Initialized: ${placedOrders.length} placed orders, ${receivedOrders.length} received orders, ${orderHistoryData.length} historical orders`
      );

      return {
        placedOrders: placedOrders as OrderData[],
        receivedOrders: receivedOrders as OrderData[],
        orderHistory: orderHistoryData as OrderData[],
      };
    } catch (error) {
      console.error('Error initializing orders:', error);
      return rejectWithValue('Failed to initialize orders');
    }
  }
);

export const refreshOrders = createAsyncThunk(
  'order/refreshOrders',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('Refreshing comprehensive orders for user:', userId);
      const { placedOrders, receivedOrders, allOrders } =
        await firebaseService.getOrdersForUser(userId);

      const orderHistoryData = allOrders.filter(
        (order) => order.status === 'completed' || order.status === 'cancelled'
      );

      console.log(
        `Refreshed: ${placedOrders.length} placed orders, ${receivedOrders.length} received orders, ${orderHistoryData.length} historical orders`
      );

      return {
        placedOrders: placedOrders as OrderData[],
        receivedOrders: receivedOrders as OrderData[],
        orderHistory: orderHistoryData as OrderData[],
      };
    } catch (error) {
      console.error('Error refreshing orders:', error);
      return rejectWithValue('Failed to refresh orders');
    }
  }
);

export const updateOrderStatusAsync = createAsyncThunk(
  'order/updateOrderStatus',
  async (
    { orderId, shopId, status }: { orderId: string; shopId: string; status: OrderStatus },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { order: OrderState };
      const order = state.order.allOrders.find((o) => o.id === orderId && o.shopId === shopId);

      if (!order) {
        console.error('Order not found:', orderId);
        return rejectWithValue('Order not found');
      }

      // Handle item quantity updates when accepting an order
      if (order.status === 'pending' && status === 'preparing') {
        console.log('Updating item quantities for accepted order:', orderId);
        for (const orderItem of order.items) {
          try {
            await firebaseService.updateItemQuantity(orderItem.itemId, -orderItem.quantity);
            console.log(`Decreased quantity for item ${orderItem.name} by ${orderItem.quantity}`);
          } catch (itemError) {
            console.error(`Error updating quantity for item ${orderItem.itemId}:`, itemError);
          }
        }
      }

      await firebaseService.updateOrderStatus(orderId, shopId, status);
      console.log('Order status updated successfully:', orderId, status);

      return { orderId, shopId, status };
    } catch (error) {
      console.error('Error updating order status:', error);
      return rejectWithValue('Failed to update order status');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setPlacedOrders: (state, action: PayloadAction<OrderData[]>) => {
      state.placedOrders = action.payload;
      state.allOrders = [...action.payload, ...state.receivedOrders, ...state.orderHistory];
    },
    setReceivedOrders: (state, action: PayloadAction<OrderData[]>) => {
      state.receivedOrders = action.payload;
      state.allOrders = [...state.placedOrders, ...action.payload, ...state.orderHistory];
    },
    setSelectedOrder: (state, action: PayloadAction<OrderData | null>) => {
      state.selectedOrder = action.payload;
    },
    setOrderHistory: (state, action: PayloadAction<OrderData[]>) => {
      state.orderHistory = action.payload;
      state.allOrders = [...state.placedOrders, ...state.receivedOrders, ...action.payload];
    },
    addToOrderHistory: (state, action: PayloadAction<OrderData>) => {
      state.orderHistory = [action.payload, ...state.orderHistory];
      state.allOrders = [...state.placedOrders, ...state.receivedOrders, ...state.orderHistory];
    },
    addToPlacedOrders: (state, action: PayloadAction<OrderData>) => {
      state.placedOrders = [action.payload, ...state.placedOrders];
      state.allOrders = [...state.placedOrders, ...state.receivedOrders, ...state.orderHistory];
    },
    addToReceivedOrders: (state, action: PayloadAction<OrderData>) => {
      state.receivedOrders = [action.payload, ...state.receivedOrders];
      state.allOrders = [...state.placedOrders, ...state.receivedOrders, ...state.orderHistory];
    },
    resetOrderState: (state) => {
      state.placedOrders = [];
      state.receivedOrders = [];
      state.orderHistory = [];
      state.allOrders = [];
      state.selectedOrder = null;
      state.isLoadingOrders = false;
      state.isInitialized = false;
      console.log('Order state reset');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeOrders.pending, (state) => {
        state.isLoadingOrders = true;
      })
      .addCase(initializeOrders.fulfilled, (state, action) => {
        if (action.payload) {
          state.placedOrders = action.payload.placedOrders;
          state.receivedOrders = action.payload.receivedOrders;
          state.orderHistory = action.payload.orderHistory;
          state.allOrders = [
            ...action.payload.placedOrders,
            ...action.payload.receivedOrders,
            ...action.payload.orderHistory,
          ];
          state.isInitialized = true;
        }
        state.isLoadingOrders = false;
      })
      .addCase(initializeOrders.rejected, (state) => {
        state.isLoadingOrders = false;
      })
      .addCase(refreshOrders.pending, (state) => {
        state.isLoadingOrders = true;
      })
      .addCase(refreshOrders.fulfilled, (state, action) => {
        state.placedOrders = action.payload.placedOrders;
        state.receivedOrders = action.payload.receivedOrders;
        state.orderHistory = action.payload.orderHistory;
        state.allOrders = [
          ...action.payload.placedOrders,
          ...action.payload.receivedOrders,
          ...action.payload.orderHistory,
        ];
        state.isLoadingOrders = false;
      })
      .addCase(refreshOrders.rejected, (state) => {
        state.isLoadingOrders = false;
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        const { orderId, shopId, status } = action.payload;

        const updateOrder = (order: OrderData) =>
          order.id === orderId && order.shopId === shopId ? { ...order, status } : order;

        state.placedOrders = state.placedOrders.map(updateOrder);
        state.receivedOrders = state.receivedOrders.map(updateOrder);
        state.orderHistory = state.orderHistory.map(updateOrder);
        state.allOrders = state.allOrders.map(updateOrder);

        if (state.selectedOrder?.id === orderId && state.selectedOrder?.shopId === shopId) {
          state.selectedOrder = { ...state.selectedOrder, status };
        }
      });
  },
});

export const {
  setPlacedOrders,
  setReceivedOrders,
  setSelectedOrder,
  setOrderHistory,
  addToOrderHistory,
  addToPlacedOrders,
  addToReceivedOrders,
  resetOrderState,
} = orderSlice.actions;
export default orderSlice.reducer;
