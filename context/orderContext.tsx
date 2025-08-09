import React, { createContext, useState, useContext, ReactNode } from 'react';

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
    currentOrders: OrderData[];
    orderHistory: OrderData[];
    selectedOrder: OrderData | null;
    isLoadingOrders: boolean;
    setCurrentOrders: (orders: OrderData[]) => void;
    setSelectedOrder: (order: OrderData | null) => void;
    setOrderHistory: (orders: OrderData[]) => void;
    addToOrderHistory: (order: OrderData) => void;
    addToCurrentOrders: (order: OrderData) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    clearCurrentOrders: () => void;
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
    const [currentOrders, setCurrentOrdersState] = useState<OrderData[]>([]);
    const [orderHistory, setOrderHistoryState] = useState<OrderData[]>([]);
    const [selectedOrder, setSelectedOrderState] = useState<OrderData | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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

    return (
        <OrderContext.Provider value={{
            currentOrders,
            orderHistory,
            selectedOrder,
            isLoadingOrders,
            setCurrentOrders,
            setSelectedOrder,
            setOrderHistory,
            addToOrderHistory,
            addToCurrentOrders,
            updateOrderStatus,
            clearCurrentOrders,
        }}>
            {children}
        </OrderContext.Provider>
    );
};