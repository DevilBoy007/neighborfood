import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
    currentOrder: OrderData | null;
    orderHistory: OrderData[];
    selectedOrder: OrderData | null;
    isLoadingOrders: boolean;
    setCurrentOrder: (order: OrderData | null) => void;
    setSelectedOrder: (order: OrderData | null) => void;
    setOrderHistory: (orders: OrderData[]) => void;
    addToOrderHistory: (order: OrderData) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    clearCurrentOrder: () => void;
    createNewOrder: (orderData: Omit<OrderData, 'id'>) => OrderData;
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
    const [currentOrder, setCurrentOrderState] = useState<OrderData | null>(null);
    const [orderHistory, setOrderHistoryState] = useState<OrderData[]>([]);
    const [selectedOrder, setSelectedOrderState] = useState<OrderData | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    const setCurrentOrder = (order: OrderData | null) => {
        setCurrentOrderState(order);
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

        // Update current order if matching
        if (currentOrder && currentOrder.id === orderId) {
            setCurrentOrderState(prevOrder =>
                prevOrder ? { ...prevOrder, status } : null
            );
        }

        // If order is completed, generate a new order context
        if (status === 'completed') {
            // Clear current order to reset the context
            setCurrentOrderState(null);
        }
    };

    const clearCurrentOrder = () => {
        setCurrentOrderState(null);
    };

    const createNewOrder = (orderData: Omit<OrderData, 'id'>): OrderData => {
        const newOrder: OrderData = {
            ...orderData,
            id: uuidv4()
        };
        return newOrder;
    };


    return (
        <OrderContext.Provider value={{
            currentOrder,
            orderHistory,
            selectedOrder,
            isLoadingOrders,
            setCurrentOrder,
            setSelectedOrder,
            setOrderHistory,
            addToOrderHistory,
            updateOrderStatus,
            clearCurrentOrder,
            createNewOrder
        }}>
            {children}
        </OrderContext.Provider>
    );
};