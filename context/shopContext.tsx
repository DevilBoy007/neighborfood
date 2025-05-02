import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ItemData } from '@/context/itemContext';

type ShopLocation = {
    marketId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
};

export type ShopData = {
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
    seasons: string[];
    openTime: string;
    closeTime: string;
    items?: ItemData[];
};

type ShopContextType = {
    selectedShop: ShopData | null;
    shops: ShopData[];
    isLoadingShop: boolean;
    setSelectedShop: (shop: ShopData | null) => void;
    clearSelectedShop: () => void;
    setShops: (shops: ShopData[]) => void;
    setIsLoadingShop: (isLoading: boolean) => void;
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
    const [shops, setShopsState] = useState<ShopData[]>([]);
    const [isLoadingShop, setIsLoadingShop] = useState(false);

    const setSelectedShop = (shop: ShopData | null) => {
        setSelectedShopState(shop);
    };

    const clearSelectedShop = () => {
        setSelectedShopState(null);
    };

    const setShops = (newShops: ShopData[]) => {
        setShopsState(newShops);
    };

    return (
        <ShopContext.Provider value={{
            selectedShop,
            shops,
            isLoadingShop,
            setSelectedShop,
            clearSelectedShop,
            setShops,
            setIsLoadingShop
        }}>
        {children}
        </ShopContext.Provider>
    );
};