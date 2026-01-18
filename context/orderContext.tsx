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

type OrderContextType = {
    // Orders placed by the user (as customer)
    placedOrders: OrderData[];
    // Orders received by user's shops (as shop owner)
    receivedOrders: OrderData[];
    orderHistory: OrderData[];
    allOrders: OrderData[];
    selectedOrder: OrderData | null;
    isLoadingOrders: boolean;
    isInitialized: boolean;
    setPlacedOrders: (orders: OrderData[]) => void;
    setReceivedOrders: (orders: OrderData[]) => void;
    setSelectedOrder: (order: OrderData | null) => void;
    setOrderHistory: (orders: OrderData[]) => void;
    addToOrderHistory: (order: OrderData) => void;
    addToPlacedOrders: (order: OrderData) => void;
    addToReceivedOrders: (order: OrderData) => void;
    updateOrderStatus: (orderId: string, shopId: string, status: OrderStatus) => void;
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
    const [placedOrders, setPlacedOrdersState] = useState<OrderData[]>([]);
    const [receivedOrders, setReceivedOrdersState] = useState<OrderData[]>([]);
    const [orderHistory, setOrderHistoryState] = useState<OrderData[]>([]);
    const [allOrders, setAllOrdersState] = useState<OrderData[]>([]);
    
    const [selectedOrder, setSelectedOrderState] = useState<OrderData | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const setPlacedOrders = (orders: OrderData[]) => {
        setPlacedOrdersState(orders);
    };

    const setReceivedOrders = (orders: OrderData[]) => {
        setReceivedOrdersState(orders);
    };

    const setSelectedOrder = (order: OrderData | null) => {
        setSelectedOrderState(order);
    };

    const setOrderHistory = (orders: OrderData[]) => {
        setOrderHistoryState(orders);
    };

    const setAllOrders = (orders: OrderData[]) => {
        setAllOrdersState(orders);
    }

    const updateAllOrders = () => {
        const combined = [...placedOrders, ...receivedOrders, ...orderHistory];
        setAllOrdersState(combined);
    };

    const addToOrderHistory = (order: OrderData) => {
        setOrderHistoryState(prevOrders => {
            const updated = [order, ...prevOrders];
            setAllOrdersState([...placedOrders, ...receivedOrders, ...updated]);
            return updated;
        });
    };

    const addToPlacedOrders = (order: OrderData) => {
        setPlacedOrdersState(prevOrders => {
            const updated = [order, ...prevOrders];
            setAllOrdersState([...updated, ...receivedOrders, ...orderHistory]);
            return updated;
        });
    };

    const addToReceivedOrders = (order: OrderData) => {
        setReceivedOrdersState(prevOrders => {
            const updated = [order, ...prevOrders];
            setAllOrdersState([...placedOrders, ...updated, ...orderHistory]);
            return updated;
        });
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
            
            setOrderHistoryState(orderHistoryData);
            
            setAllOrdersState([...userPlacedOrders, ...userReceivedOrders, ...orderHistoryData]);
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
            
            const orderHistoryData = allOrders.filter(order => 
                order.status === 'completed' || order.status === 'cancelled'
            );
            
            setOrderHistoryState(orderHistoryData);
            setAllOrdersState([...userPlacedOrders, ...userReceivedOrders, ...orderHistoryData]);
            
            console.log(`Refreshed: ${userPlacedOrders.length} placed orders, ${userReceivedOrders.length} received orders, ${orderHistoryData.length} historical orders`);
            
        } catch (error) {
            console.error('Error refreshing orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const updateOrderStatus = async (orderId: string, shopId: string, status: OrderStatus) => {
        try {
            // Find the order to get shopId
            const order = allOrders.find(o => (o.id === orderId && o.shopId === shopId));
            if (!order) {
                console.error('Order not found:', orderId);
                return;
            }

            if (order.status === 'pending' && status === 'preparing') {
                console.log('Updating item quantities for accepted order:', orderId);
                
                for (const orderItem of order.items) {
                    try {
                        await firebaseService.updateItemQuantity(orderItem.itemId, -orderItem.quantity);
                        console.log(`Decreased quantity for item ${orderItem.name} by ${orderItem.quantity}`);
                    } catch (itemError) {
                        // Continue with other items even if one fails
                        console.error(`Error updating quantity for item ${orderItem.itemId}:`, itemError);
                    }
                }
            }

            await firebaseService.updateOrderStatus(orderId, order.shopId, status);

            setPlacedOrdersState(prevOrders => 
                prevOrders.map(order => 
                    (order.id === orderId && order.shopId === shopId) ? { ...order, status } : order
                )
            );

            setReceivedOrdersState(prevOrders => 
                prevOrders.map(order => 
                    (order.id === orderId && order.shopId === shopId) ? { ...order, status } : order
                )
            );

            setOrderHistoryState(prevOrders => 
                prevOrders.map(order => 
                    (order.id === orderId && order.shopId === shopId) ? { ...order, status } : order
                )
            );

            setAllOrdersState(prevOrders => 
                prevOrders.map(order => 
                    (order.id === orderId && order.shopId === shopId) ? { ...order, status } : order
                )
            );

            if (selectedOrder && selectedOrder.id === orderId && selectedOrder.shopId === shopId) {
                setSelectedOrderState(prevOrder =>
                    prevOrder ? { ...prevOrder, status } : null
                );
            }

            console.log('Order status updated successfully:', orderId, status);
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    const resetOrderContext = () => {
        setPlacedOrdersState([]);
        setReceivedOrdersState([]);
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
            orderHistory,
            allOrders,
            selectedOrder,
            isLoadingOrders,
            isInitialized,
            setPlacedOrders,
            setReceivedOrders,
            setSelectedOrder,
            setOrderHistory,
            addToOrderHistory,
            addToPlacedOrders,
            addToReceivedOrders,
            updateOrderStatus,
            initializeOrders,
            refreshOrders,
            resetOrderContext,
        }}>
            {children}
        </OrderContext.Provider>
    );
};