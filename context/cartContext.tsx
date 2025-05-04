import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  photoURL?: string;
  negotiable?: boolean;
  specialInstructions?: string;
};

type ShopCart = {
  shopId: string;
  shopName: string;
  shopPhotoURL?: string;
  items: CartItem[];
  subtotal: number;
};

type CartContextType = {
  shopCarts: ShopCart[];
  isLoadingCart: boolean;
  addToCart: (item: Omit<CartItem, 'id'> & { shopId: string; shopName: string; shopPhotoURL?: string }) => void;
  removeFromCart: (shopId: string, itemId: string) => void;
  updateItemQuantity: (shopId: string, itemId: string, quantity: number) => void;
  updateSpecialInstructions: (shopId: string, itemId: string, instructions: string) => void;
  clearCart: () => void;
  clearShopCart: (shopId: string) => void;
  calculateTotalSubtotal: () => number;
  getItemCount: () => number;
  getShopCount: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [shopCarts, setShopCarts] = useState<ShopCart[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;

  // Load cart from storage on initial render
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await storage.getItem('cart');
        if (cartData) {
          setShopCarts(JSON.parse(cartData));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        if (shopCarts.length > 0) {
          await storage.setItem('cart', JSON.stringify(shopCarts));
        } else {
          await storage.removeItem('cart');
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };

    saveCart();
  }, [shopCarts]);

  const calculateSubtotalFromItems = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const addToCart = (item: Omit<CartItem, 'id'> & { shopId: string; shopName: string; shopPhotoURL?: string }) => {
    const { shopId, shopName, shopPhotoURL, ...itemData } = item;
    
    setShopCarts(prevShopCarts => {
      // Find if we already have a cart for this shop
      const shopCartIndex = prevShopCarts.findIndex(cart => cart.shopId === shopId);
      
      // If no cart exists for this shop yet
      if (shopCartIndex === -1) {
        const newShopCart: ShopCart = {
          shopId,
          shopName,
          shopPhotoURL,
          items: [itemData],
          subtotal: itemData.price * itemData.quantity
        };
        
        return [...prevShopCarts, newShopCart];
      }
      
      // Shop cart exists, so update it
      const updatedShopCarts = [...prevShopCarts];
      const shopCart = updatedShopCarts[shopCartIndex];
      
      // Check if the item already exists in the shop cart
      const existingItemIndex = shopCart.items.findIndex(
        cartItem => cartItem.itemId === itemData.itemId
      );
      
      if (existingItemIndex >= 0) {
        // Update the existing item
        const updatedItems = [...shopCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + itemData.quantity,
          specialInstructions: itemData.specialInstructions || updatedItems[existingItemIndex].specialInstructions
        };
        
        updatedShopCarts[shopCartIndex] = {
          ...shopCart,
          items: updatedItems,
          subtotal: calculateSubtotalFromItems(updatedItems)
        };
      } else {
        // Add the new item
        const updatedItems = [...shopCart.items, itemData];
        
        updatedShopCarts[shopCartIndex] = {
          ...shopCart,
          items: updatedItems,
          subtotal: calculateSubtotalFromItems(updatedItems)
        };
      }
      
      return updatedShopCarts;
    });
  };

  const removeFromCart = (shopId: string, itemId: string) => {
    setShopCarts(prevShopCarts => {
      const shopCartIndex = prevShopCarts.findIndex(cart => cart.shopId === shopId);
      
      // If shop cart doesn't exist, do nothing
      if (shopCartIndex === -1) return prevShopCarts;
      
      const updatedShopCarts = [...prevShopCarts];
      const shopCart = updatedShopCarts[shopCartIndex];
      
      const updatedItems = shopCart.items.filter(item => item.itemId !== itemId);
      
      // If there are no items left in this shop's cart, remove the shop cart
      if (updatedItems.length === 0) {
        return prevShopCarts.filter(cart => cart.shopId !== shopId);
      }
      
      // Update the shop cart with remaining items
      updatedShopCarts[shopCartIndex] = {
        ...shopCart,
        items: updatedItems,
        subtotal: calculateSubtotalFromItems(updatedItems)
      };
      
      return updatedShopCarts;
    });
  };

  const updateItemQuantity = (shopId: string, itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(shopId, itemId);
      return;
    }
    
    setShopCarts(prevShopCarts => {
      const shopCartIndex = prevShopCarts.findIndex(cart => cart.shopId === shopId);
      
      // If shop cart doesn't exist, do nothing
      if (shopCartIndex === -1) return prevShopCarts;
      
      const updatedShopCarts = [...prevShopCarts];
      const shopCart = updatedShopCarts[shopCartIndex];
      
      const updatedItems = shopCart.items.map(item => 
        item.itemId === itemId ? { ...item, quantity } : item
      );
      
      updatedShopCarts[shopCartIndex] = {
        ...shopCart,
        items: updatedItems,
        subtotal: calculateSubtotalFromItems(updatedItems)
      };
      
      return updatedShopCarts;
    });
  };

  const updateSpecialInstructions = (shopId: string, itemId: string, instructions: string) => {
    setShopCarts(prevShopCarts => {
      const shopCartIndex = prevShopCarts.findIndex(cart => cart.shopId === shopId);
      
      // If shop cart doesn't exist, do nothing
      if (shopCartIndex === -1) return prevShopCarts;
      
      const updatedShopCarts = [...prevShopCarts];
      const shopCart = updatedShopCarts[shopCartIndex];
      
      const updatedItems = shopCart.items.map(item => 
        item.id === itemId ? { ...item, specialInstructions: instructions } : item
      );
      
      updatedShopCarts[shopCartIndex] = {
        ...shopCart,
        items: updatedItems
      };
      
      return updatedShopCarts;
    });
  };

  const clearCart = () => {
    setShopCarts([]);
  };

  const clearShopCart = (shopId: string) => {
    setShopCarts(prevShopCarts => prevShopCarts.filter(cart => cart.shopId !== shopId));
  };

  const calculateTotalSubtotal = (): number => {
    return shopCarts.reduce((total, shopCart) => total + shopCart.subtotal, 0);
  };

  const getItemCount = (): number => {
    return shopCarts.reduce((count, shopCart) => 
      count + shopCart.items.reduce((itemCount, item) => itemCount + item.quantity, 0), 0);
  };

  const getShopCount = (): number => {
    return shopCarts.length;
  };

  return (
    <CartContext.Provider value={{
      shopCarts,
      isLoadingCart,
      addToCart,
      removeFromCart,
      updateItemQuantity,
      updateSpecialInstructions,
      clearCart,
      clearShopCart,
      calculateTotalSubtotal,
      getItemCount,
      getShopCount
    }}>
      {children}
    </CartContext.Provider>
  );
};