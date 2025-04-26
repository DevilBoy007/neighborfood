import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ItemData = {
    id: string;
    shopId: string[];
    marketId: string;
    userId: string;
    name: string;
    description: string;
    category: string[];
    imageUrl: string;
    price: number;
    unit: string;
    negotiable: boolean;
    quantity: number;
    createdAt: { seconds: number; nanoseconds: number };
};

type ItemContextType = {
    selectedItem: ItemData | null;
    isLoadingItem: boolean;
    setSelectedItem: (item: ItemData | null) => void;
    clearSelectedItem: () => void;
    setIsLoadingItem: (isLoading: boolean) => void;
};

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const useItem = () => {
    const context = useContext(ItemContext);
    if (context === undefined) {
        throw new Error('useItem must be used within an ItemProvider');
    }
    return context;
};

type ItemProviderProps = {
    children: ReactNode;
};

export const ItemProvider = ({ children }: ItemProviderProps) => {
    const [selectedItem, setSelectedItemState] = useState<ItemData | null>(null);
    const [isLoadingItem, setIsLoadingItem] = useState(false);

    const setSelectedItem = (item: ItemData | null) => {
        setSelectedItemState(item);
    };

    const clearSelectedItem = () => {
        setSelectedItemState(null);
    };

    return (
        <ItemContext.Provider value={{
            selectedItem,
            isLoadingItem,
            setSelectedItem,
            clearSelectedItem,
            setIsLoadingItem
        }}>
        {children}
        </ItemContext.Provider>
    );
};