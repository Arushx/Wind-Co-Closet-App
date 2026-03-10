import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories';
type ClothingStatus = 'clean' | 'dirty' | 'laundry';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface WeatherRating {
  minTemp: number;
  maxTemp: number;
}

export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  category: ClothingCategory;
  color: string;
  weatherRating?: WeatherRating;
  status: ClothingStatus;
  imageUrl: string;
  seasons: Season[];
  tags?: string[];
}

interface ClosetContextType {
  items: ClothingItem[];
  updateItem: (id: string, updates: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  addItem: (item: ClothingItem) => void;
  addItems: (items: ClothingItem[]) => void;
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

const INITIAL_ITEMS: ClothingItem[] = [];

export function ClosetProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(INITIAL_ITEMS);
  const [isLoaded, setIsLoaded] = useState(false);
  const CLOSET_STORAGE_KEY = '@wind_co_closet_items_v2';

  useEffect(() => {
    const loadItems = async () => {
      try {
        const stored = await AsyncStorage.getItem(CLOSET_STORAGE_KEY);
        if (stored !== null) {
          setItems(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load closet items', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(CLOSET_STORAGE_KEY, JSON.stringify(items)).catch(console.error);
    }
  }, [items, isLoaded]);

  const updateItem = (id: string, updates: Partial<ClothingItem>) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const addItem = (item: ClothingItem) => {
    setItems(prevItems => [...prevItems, item]);
  };

  const addItems = (newItems: ClothingItem[]) => {
    setItems(prevItems => [...prevItems, ...newItems]);
  };

  return (
    <ClosetContext.Provider value={{ items, updateItem, deleteItem, addItem, addItems }}>
      {children}
    </ClosetContext.Provider>
  );
}

export function useCloset() {
  const context = useContext(ClosetContext);
  if (!context) {
    throw new Error('useCloset must be used within a ClosetProvider');
  }
  return context;
}
