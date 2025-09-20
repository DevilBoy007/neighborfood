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

type OrderStatus = 
  | 'pending' 
  | 'preparing' 
  | 'ready' 
  | 'in-delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled';

type OrderData = {
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

interface OrderState {
  // Orders placed by the user (as customer)
  placedOrders: OrderData[];
  // Orders received by user's shops (as shop owner)
  receivedOrders: OrderData[];
  orderHistory: OrderData[];
  selectedOrder: OrderData | null;
  isLoadingOrders: boolean;
  isInitialized: boolean;
}

const initialState: OrderState = {
  placedOrders: [],
  receivedOrders: [],
  orderHistory: [],
  selectedOrder: null,
  isLoadingOrders: false,
  isInitialized: false,
};

// Async thunk to initialize orders
export const initializeOrders = createAsyncThunk(
  'order/initializeOrders',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { order: OrderState };
      
      // Don't re-initialize if already done for this user session
      if (state.order.isInitialized) {
        console.log('Orders already initialized, skipping...');
        return null;
      }

      if (!userId) {
        return rejectWithValue('User ID is required');
      }

      console.log('Initializing orders for user:', userId);

      // Fetch orders from Firebase
      const orderData = await firebaseService.getOrdersForUser(userId);
      
      return {
        placedOrders: orderData.placedOrders || [],
        receivedOrders: orderData.receivedOrders || [],
        orderHistory: orderData.allOrders || [],
      };
    } catch (error) {
      console.error('Error initializing orders:', error);
      return rejectWithValue('Failed to initialize orders');
    }
  }
);

// Async thunk to refresh orders
export const refreshOrders = createAsyncThunk(
  'order/refreshOrders',
  async (userId: string, { rejectWithValue }) => {
    try {
      if (!userId) {
        return rejectWithValue('User ID is required');
      }

      console.log('Refreshing orders for user:', userId);

      // Fetch fresh orders from Firebase
      const orderData = await firebaseService.getOrdersForUser(userId);

      return {
        placedOrders: orderData.placedOrders || [],
        receivedOrders: orderData.receivedOrders || [],
        orderHistory: orderData.allOrders || [],
      };
    } catch (error) {
      console.error('Error refreshing orders:', error);
      return rejectWithValue('Failed to refresh orders');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setPlacedOrders: (state, action: PayloadAction<OrderData[]>) => {
      state.placedOrders = action.payload;
    },
    setReceivedOrders: (state, action: PayloadAction<OrderData[]>) => {
      state.receivedOrders = action.payload;
    },
    setSelectedOrder: (state, action: PayloadAction<OrderData | null>) => {
      state.selectedOrder = action.payload;
    },
    setOrderHistory: (state, action: PayloadAction<OrderData[]>) => {
      state.orderHistory = action.payload;
    },
    addToOrderHistory: (state, action: PayloadAction<OrderData>) => {
      state.orderHistory.unshift(action.payload);
    },
    addToPlacedOrders: (state, action: PayloadAction<OrderData>) => {
      state.placedOrders.unshift(action.payload);
    },
    addToReceivedOrders: (state, action: PayloadAction<OrderData>) => {
      state.receivedOrders.unshift(action.payload);
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: OrderStatus }>) => {
      const { orderId, status } = action.payload;
      
      // Update in placed orders
      const placedOrderIndex = state.placedOrders.findIndex(order => order.id === orderId);
      if (placedOrderIndex !== -1) {
        state.placedOrders[placedOrderIndex].status = status;
      }
      
      // Update in received orders
      const receivedOrderIndex = state.receivedOrders.findIndex(order => order.id === orderId);
      if (receivedOrderIndex !== -1) {
        state.receivedOrders[receivedOrderIndex].status = status;
      }
      
      // Update selected order if it matches
      if (state.selectedOrder && state.selectedOrder.id === orderId) {
        state.selectedOrder.status = status;
      }
      
      // If status is completed, move to history and remove from current orders
      if (status === 'completed') {
        const orderToMove = state.placedOrders.find(order => order.id === orderId) ||
                           state.receivedOrders.find(order => order.id === orderId);
        
        if (orderToMove) {
          state.orderHistory.unshift(orderToMove);
          state.placedOrders = state.placedOrders.filter(order => order.id !== orderId);
          state.receivedOrders = state.receivedOrders.filter(order => order.id !== orderId);
        }
      }
    },
    resetOrderContext: (state) => {
      state.placedOrders = [];
      state.receivedOrders = [];
      state.orderHistory = [];
      state.selectedOrder = null;
      state.isLoadingOrders = false;
      state.isInitialized = false;
      console.log('Order context reset');
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize orders
      .addCase(initializeOrders.pending, (state) => {
        state.isLoadingOrders = true;
      })
      .addCase(initializeOrders.fulfilled, (state, action) => {
        if (action.payload) {
          state.placedOrders = action.payload.placedOrders;
          state.receivedOrders = action.payload.receivedOrders;
          state.orderHistory = action.payload.orderHistory;
        }
        state.isLoadingOrders = false;
        state.isInitialized = true;
      })
      .addCase(initializeOrders.rejected, (state) => {
        state.isLoadingOrders = false;
      })
      // Refresh orders
      .addCase(refreshOrders.pending, (state) => {
        state.isLoadingOrders = true;
      })
      .addCase(refreshOrders.fulfilled, (state, action) => {
        if (action.payload) {
          state.placedOrders = action.payload.placedOrders;
          state.receivedOrders = action.payload.receivedOrders;
          state.orderHistory = action.payload.orderHistory;
        }
        state.isLoadingOrders = false;
      })
      .addCase(refreshOrders.rejected, (state) => {
        state.isLoadingOrders = false;
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
  updateOrderStatus,
  resetOrderContext,
} = orderSlice.actions;

export type { OrderData, OrderItem, OrderStatus };
export default orderSlice.reducer;