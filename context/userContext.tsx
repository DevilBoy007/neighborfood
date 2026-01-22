import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type UserData = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  // Additional fields from Firestore
  createdAt: { seconds: number; nanoseconds: number } | Date | string;
  first: string;
  last: string;
  dob: string;
  phone: string;
  location: {
    address: string;
    city: string;
    coords: {
      latitude: number;
      longitude: number;
    };
    state: string;
    zip?: string;
  };
};

type UserContextType = {
  userData: UserData | null;
  isLoading: boolean;
  setUserData: (data: UserData | null) => void;
  updateUserData: (data: Partial<UserData>) => void;
  clearUserData: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Add proper typing for children props
type UserProviderProps = {
  children: ReactNode;
};

// Helper to get storage - lazily evaluated with guard for bundling
const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };
    }
    return localStorage;
  }
  return AsyncStorage;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userData, setUserDataState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storage = getStorage();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await storage.getItem('userData');
        if (data) {
          const parsedData = JSON.parse(data);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Improved setUserData function to handle data or null
  const setUserData = async (data: UserData | null) => {
    try {
      setUserDataState(data);
      if (data) {
        await storage.setItem('userData', JSON.stringify(data));
      } else {
        await storage.removeItem('userData');
      }
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  };

  const updateUserData = async (newData: Partial<UserData>) => {
    try {
      const updatedData = { ...userData, ...newData } as UserData;
      setUserData(updatedData);
      await storage.setItem('userData', JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // Improved clearUserData function to ensure complete logout
  const clearUserData = async () => {
    try {
      setUserDataState(null);
      await storage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        isLoading,
        setUserData,
        updateUserData,
        clearUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
