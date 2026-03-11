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

const INITIAL_ITEMS: ClothingItem[] = [
  // Tops
  {
    id: '1',
    name: 'Classic White T-Shirt',
    brand: 'Uniqlo',
    category: 'tops',
    color: '#FFFFFF',
    weatherRating: { minTemp: 15, maxTemp: 30 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    seasons: ['spring', 'summer', 'fall'],
    tags: ['casual', 'basics'],
  },
  {
    id: '2',
    name: 'Navy Blue Hoodie',
    brand: 'Nike',
    category: 'tops',
    color: '#001F3F',
    weatherRating: { minTemp: 5, maxTemp: 20 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    seasons: ['fall', 'winter', 'spring'],
    tags: ['casual', 'sports', 'comfortable'],
  },
  {
    id: '3',
    name: 'Striped Summer Blouse',
    brand: 'Zara',
    category: 'tops',
    color: '#FFE5E5',
    weatherRating: { minTemp: 18, maxTemp: 35 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400',
    seasons: ['spring', 'summer'],
    tags: ['casual', 'feminine', 'work'],
  },
  {
    id: '4',
    name: 'Black Leather Jacket',
    brand: 'AllSaints',
    category: 'tops',
    color: '#000000',
    weatherRating: { minTemp: 0, maxTemp: 15 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    seasons: ['fall', 'winter', 'spring'],
    tags: ['formal', 'edgy', 'leather'],
  },
  {
    id: '5',
    name: 'Green Flannel Shirt',
    brand: 'Patagonia',
    category: 'tops',
    color: '#2E8B57',
    weatherRating: { minTemp: 10, maxTemp: 20 },
    status: 'laundry',
    imageUrl: 'https://images.unsplash.com/photo-1603252110971-b8a57087be18?w=400',
    seasons: ['fall', 'winter'],
    tags: ['casual', 'outdoor', 'layering'],
  },
  // Bottoms
  {
    id: '6',
    name: 'Blue Denim Jeans',
    brand: 'Levi\'s',
    category: 'bottoms',
    color: '#4169E1',
    weatherRating: { minTemp: 5, maxTemp: 25 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    tags: ['casual', 'basics', 'denim'],
  },
  {
    id: '7',
    name: 'Black Dress Pants',
    brand: 'Hugo Boss',
    category: 'bottoms',
    color: '#000000',
    weatherRating: { minTemp: 10, maxTemp: 25 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    tags: ['formal', 'work', 'professional'],
  },
  {
    id: '8',
    name: 'Khaki Shorts',
    brand: 'Gap',
    category: 'bottoms',
    color: '#C3B091',
    weatherRating: { minTemp: 20, maxTemp: 35 },
    status: 'dirty',
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
    seasons: ['summer'],
    tags: ['casual', 'summer', 'comfortable'],
  },
  {
    id: '9',
    name: 'Gray Sweatpants',
    brand: 'Adidas',
    category: 'bottoms',
    color: '#808080',
    weatherRating: { minTemp: 5, maxTemp: 20 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400',
    seasons: ['fall', 'winter', 'spring'],
    tags: ['sports', 'comfortable', 'casual'],
  },
  {
    id: '10',
    name: 'Plaid Skirt',
    brand: 'Urban Outfitters',
    category: 'bottoms',
    color: '#8B4513',
    weatherRating: { minTemp: 12, maxTemp: 25 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400',
    seasons: ['spring', 'fall'],
    tags: ['casual', 'vintage', 'pattern'],
  },
  // Shoes
  {
    id: '11',
    name: 'White Sneakers',
    brand: 'Adidas',
    category: 'shoes',
    color: '#FFFFFF',
    weatherRating: { minTemp: 10, maxTemp: 30 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    seasons: ['spring', 'summer', 'fall'],
    tags: ['casual', 'sports', 'comfortable'],
  },
  {
    id: '12',
    name: 'Brown Leather Boots',
    brand: 'Dr. Martens',
    category: 'shoes',
    color: '#8B4513',
    weatherRating: { minTemp: -10, maxTemp: 15 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400',
    seasons: ['fall', 'winter'],
    tags: ['formal', 'durable', 'leather'],
  },
  {
    id: '13',
    name: 'Black Running Shoes',
    brand: 'Nike',
    category: 'shoes',
    color: '#000000',
    weatherRating: { minTemp: 5, maxTemp: 30 },
    status: 'dirty',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    seasons: ['spring', 'summer', 'fall'],
    tags: ['sports', 'athletic', 'comfortable'],
  },
  {
    id: '14',
    name: 'Beige Sandals',
    brand: 'Birkenstock',
    category: 'shoes',
    color: '#F5DEB3',
    weatherRating: { minTemp: 18, maxTemp: 35 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400',
    seasons: ['summer'],
    tags: ['casual', 'summer', 'comfortable'],
  },
  // Accessories
  {
    id: '15',
    name: 'Gray Wool Beanie',
    brand: 'Carhartt',
    category: 'accessories',
    color: '#696969',
    weatherRating: { minTemp: -15, maxTemp: 10 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400',
    seasons: ['winter'],
    tags: ['cold-weather', 'cozy', 'wool'],
  },
  {
    id: '16',
    name: 'Black Leather Belt',
    brand: 'Calvin Klein',
    category: 'accessories',
    color: '#000000',
    weatherRating: { minTemp: -20, maxTemp: 40 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583aa?w=400',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    tags: ['formal', 'leather', 'basics'],
  },
  {
    id: '17',
    name: 'Patterned Scarf',
    brand: 'Burberry',
    category: 'accessories',
    color: '#DEB887',
    weatherRating: { minTemp: -10, maxTemp: 12 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
    seasons: ['fall', 'winter'],
    tags: ['formal', 'pattern', 'luxury'],
  },
  {
    id: '18',
    name: 'Canvas Backpack',
    brand: 'Fjällräven',
    category: 'accessories',
    color: '#FFD700',
    weatherRating: { minTemp: -10, maxTemp: 35 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    tags: ['casual', 'outdoor', 'practical'],
  },
  {
    id: '19',
    name: 'Aviator Sunglasses',
    brand: 'Ray-Ban',
    category: 'accessories',
    color: '#C0C0C0',
    weatherRating: { minTemp: 15, maxTemp: 40 },
    status: 'clean',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
    seasons: ['spring', 'summer'],
    tags: ['summer', 'protective', 'classic'],
  },
  {
    id: '20',
    name: 'Red Baseball Cap',
    brand: 'New Era',
    category: 'accessories',
    color: '#FF0000',
    weatherRating: { minTemp: 10, maxTemp: 35 },
    status: 'laundry',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
    seasons: ['spring', 'summer', 'fall'],
    tags: ['casual', 'sports', 'summer'],
  },
];

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
