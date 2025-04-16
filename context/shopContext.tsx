import React, { createContext, useState, useContext, ReactNode } from 'react';

type ShopLocation = {
    marketId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
};

type ItemData = {
    id: string;
    shopId: string;
    marketId: string;
    name: string;
    description: string;
    category: string[];
    imageUrl: string;
    price: number;
    unit: string;
    negotiable: boolean;
    quantity: number;
    available: boolean;
    createdAt: { seconds: number; nanoseconds: number };
};

type ShopData = {
    id: string;
    name: string;
    description: string;
    backgroundImageUrl: string;
    userId: string;
    location: ShopLocation;
    createdAt: { seconds: number; nanoseconds: number };
    type: string;
    localDelivery: boolean;
    allowPickup: boolean;
    days: string[];
    openTime: string;
    closeTime: string;
    items?: ItemData[];
};

type ShopContextType = {
    selectedShop: ShopData | null;
    isLoadingShop: boolean;
    setSelectedShop: (shop: ShopData | null) => void;
    clearSelectedShop: () => void;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};

type ShopProviderProps = {
    children: ReactNode;
};

export const ShopProvider = ({ children }: ShopProviderProps) => {
    const [selectedShop, setSelectedShopState] = useState<ShopData | null>(null);
    const [isLoadingShop, setIsLoadingShop] = useState(false);

    const setSelectedShop = (shop: ShopData | null) => {
        setSelectedShopState(shop);
    };

    const clearSelectedShop = () => {
        setSelectedShopState(null);
    };

    return (
        <ShopContext.Provider value={{
            selectedShop,
            isLoadingShop,
            setSelectedShop,
            clearSelectedShop
        }}>
        {children}
        </ShopContext.Provider>
    );
};