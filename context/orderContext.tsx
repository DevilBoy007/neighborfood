import React, { createContext, useState, useContext, ReactNode } from 'react';
import firebaseService from '@/handlers/firebaseService';

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
    tip: number;
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

type OrderContextType = {
    // Orders placed by the user (as customer)
    placedOrders: OrderData[];
    // Orders received by user's shops (as shop owner)
    receivedOrders: OrderData[];
    // Combined orders for backward compatibility
    currentOrders: OrderData[];
    orderHistory: OrderData[];
    selectedOrder: OrderData | null;
    isLoadingOrders: boolean;
    isInitialized: boolean;
    setPlacedOrders: (orders: OrderData[]) => void;
    setReceivedOrders: (orders: OrderData[]) => void;
    setCurrentOrders: (orders: OrderData[]) => void;
    setSelectedOrder: (order: OrderData | null) => void;
    setOrderHistory: (orders: OrderData[]) => void;
    addToOrderHistory: (order: OrderData) => void;
    addToCurrentOrders: (order: OrderData) => void;
    addToPlacedOrders: (order: OrderData) => void;
    addToReceivedOrders: (order: OrderData) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    clearCurrentOrders: () => void;
    initializeOrders: (userId: string) => Promise<void>;
    refreshOrders: (userId: string) => Promise<void>;
    resetOrderContext: () => void;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
};

type OrderProviderProps = {
    children: ReactNode;
};

export const OrderProvider = ({ children }: OrderProviderProps) => {
    // New separated order states
    const [placedOrders, setPlacedOrdersState] = useState<OrderData[]>([]);
    const [receivedOrders, setReceivedOrdersState] = useState<OrderData[]>([]);
    
    // Legacy combined states (for backward compatibility)
    const [currentOrders, setCurrentOrdersState] = useState<OrderData[]>([]);
    const [orderHistory, setOrderHistoryState] = useState<OrderData[]>([]);
    
    const [selectedOrder, setSelectedOrderState] = useState<OrderData | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // New setters for placed and received orders
    const setPlacedOrders = (orders: OrderData[]) => {
        setPlacedOrdersState(orders);
        // Update currentOrders for backward compatibility (only current placed orders)
        const currentPlacedOrders = orders.filter(order => 
            order.status !== 'completed' && order.status !== 'cancelled'
        );
        setCurrentOrdersState(prevOrders => {
            // Combine with current received orders
            const currentReceived = receivedOrders.filter(order => 
                order.status !== 'completed' && order.status !== 'cancelled'
            );
            return [...currentPlacedOrders, ...currentReceived];
        });
    };

    const setReceivedOrders = (orders: OrderData[]) => {
        setReceivedOrdersState(orders);
        // Update currentOrders for backward compatibility (only current received orders)
        const currentReceivedOrders = orders.filter(order => 
            order.status !== 'completed' && order.status !== 'cancelled'
        );
        setCurrentOrdersState(prevOrders => {
            // Combine with current placed orders
            const currentPlaced = placedOrders.filter(order => 
                order.status !== 'completed' && order.status !== 'cancelled'
            );
            return [...currentPlaced, ...currentReceivedOrders];
        });
    };

    const setCurrentOrders = (orders: OrderData[]) => {
        setCurrentOrdersState(orders);
    };

    const setSelectedOrder = (order: OrderData | null) => {
        setSelectedOrderState(order);
    };

    const setOrderHistory = (orders: OrderData[]) => {
        setOrderHistoryState(orders);
    };

    const addToOrderHistory = (order: OrderData) => {
        setOrderHistoryState(prevOrders => [order, ...prevOrders]);
    };

    const addToCurrentOrders = (order: OrderData) => {
        setCurrentOrdersState(prevOrders => [order, ...prevOrders]);
    };

    const addToPlacedOrders = (order: OrderData) => {
        setPlacedOrdersState(prevOrders => [order, ...prevOrders]);
    };

    const addToReceivedOrders = (order: OrderData) => {
        setReceivedOrdersState(prevOrders => [order, ...prevOrders]);
    };

    const initializeOrders = async (userId: string) => {
        if (!userId) return;
        
        // Don't re-initialize if already done for this user session
        if (isInitialized) {
            console.log('Orders already initialized, skipping...');
            return;
        }
        
        try {
            setIsLoadingOrders(true);
            console.log('Initializing comprehensive orders for user:', userId);
            
            // Fetch all orders for the user (placed and received)
            const { placedOrders: userPlacedOrders, receivedOrders: userReceivedOrders, allOrders } = 
                await firebaseService.getOrdersForUser(userId);
            
            // Set placed orders
            setPlacedOrdersState(userPlacedOrders);
            
            // Set received orders  
            setReceivedOrdersState(userReceivedOrders);
            
            // Separate current orders from history (from all orders)
            const currentOrdersData = allOrders.filter(order => 
                order.status !== 'completed' && order.status !== 'cancelled'
            );
            
            const orderHistoryData = allOrders.filter(order => 
                order.status === 'completed' || order.status === 'cancelled'
            );
            
            // Update legacy state for backward compatibility
            setCurrentOrdersState(currentOrdersData);
            setOrderHistoryState(orderHistoryData);
            setIsInitialized(true);
            
            console.log(`Initialized: ${userPlacedOrders.length} placed orders, ${userReceivedOrders.length} received orders, ${currentOrdersData.length} current orders, ${orderHistoryData.length} historical orders`);
            
        } catch (error) {
            console.error('Error initializing orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const refreshOrders = async (userId: string) => {
        if (!userId) return;
        
        try {
            setIsLoadingOrders(true);
            console.log('Refreshing comprehensive orders for user:', userId);
            
            // Re-fetch all orders
            const { placedOrders: userPlacedOrders, receivedOrders: userReceivedOrders, allOrders } = 
                await firebaseService.getOrdersForUser(userId);
            
            // Set placed orders
            setPlacedOrdersState(userPlacedOrders);
            
            // Set received orders  
            setReceivedOrdersState(userReceivedOrders);
            
            // Separate current orders from history (from all orders)
            const currentOrdersData = allOrders.filter(order => 
                order.status !== 'completed' && order.status !== 'cancelled'
            );
            
            const orderHistoryData = allOrders.filter(order => 
                order.status === 'completed' || order.status === 'cancelled'
            );
            
            // Update legacy state for backward compatibility
            setCurrentOrdersState(currentOrdersData);
            setOrderHistoryState(orderHistoryData);
            
            console.log(`Refreshed: ${userPlacedOrders.length} placed orders, ${userReceivedOrders.length} received orders, ${currentOrdersData.length} current orders, ${orderHistoryData.length} historical orders`);
            
        } catch (error) {
            console.error('Error refreshing orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const updateOrderStatus = (orderId: string, status: OrderStatus) => {
        // Update in order history
        setOrderHistoryState(prevOrders => 
        prevOrders.map(order => 
            order.id === orderId ? { ...order, status } : order
        )
        );

        // Update selected order if matching
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrderState(prevOrder =>
                prevOrder ? { ...prevOrder, status } : null
            );
        }

        // Update current orders if matching
        setCurrentOrdersState(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, status } : order
            )
        );

        // If order is completed, remove from current orders
        if (status === 'completed') {
            setCurrentOrdersState(prevOrders =>
                prevOrders.filter(order => order.id !== orderId)
            );
        }
    };

    const clearCurrentOrders = () => {
        setCurrentOrdersState([]);
    };

    const resetOrderContext = () => {
        setPlacedOrdersState([]);
        setReceivedOrdersState([]);
        setCurrentOrdersState([]);
        setOrderHistoryState([]);
        setSelectedOrderState(null);
        setIsLoadingOrders(false);
        setIsInitialized(false);
        console.log('Order context reset');
    };

    return (
        <OrderContext.Provider value={{
            placedOrders,
            receivedOrders,
            currentOrders,
            orderHistory,
            selectedOrder,
            isLoadingOrders,
            isInitialized,
            setPlacedOrders,
            setReceivedOrders,
            setCurrentOrders,
            setSelectedOrder,
            setOrderHistory,
            addToOrderHistory,
            addToCurrentOrders,
            addToPlacedOrders,
            addToReceivedOrders,
            updateOrderStatus,
            clearCurrentOrders,
            initializeOrders,
            refreshOrders,
            resetOrderContext,
        }}>
            {children}
        </OrderContext.Provider>
    );
};