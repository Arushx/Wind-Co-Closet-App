import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

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
  category: string;
  color: string;
  weatherRating?: WeatherRating;
  status: ClothingStatus;
  imageUrl: string;
  seasons: Season[];
  tags?: string[];
}

interface ClosetContextType {
  items: ClothingItem[];
  categories: string[];
  updateItem: (id: string, updates: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  addItem: (item: ClothingItem) => void;
  addItems: (items: ClothingItem[]) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  resetCloset: () => Promise<void>;
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

const CLASSIC_WHITE_TSHIRT_URI = Image.resolveAssetSource(require('../../assets/closet items/classic white t-shirt.png')).uri;
const NAVY_BLUE_HOODIE_URI = Image.resolveAssetSource(require('../../assets/closet items/navy blue hoodie.png')).uri;
const STRIPED_SUMMER_BLOUSE_URI = Image.resolveAssetSource(require('../../assets/closet items/striped summer blouse.png')).uri;
const BLACK_LEATHER_JACKET_URI = Image.resolveAssetSource(require('../../assets/closet items/black leather jacket.png')).uri;
const GREEN_FLANNEL_SHIRT_URI = Image.resolveAssetSource(require('../../assets/closet items/green flannel shirt.png')).uri;
const BLUE_DENIM_JEANS_URI = Image.resolveAssetSource(require('../../assets/closet items/blue denim jeans.png')).uri;
const BLACK_DRESS_PANTS_URI = Image.resolveAssetSource(require('../../assets/closet items/black dress pants.png')).uri;
const KHAKI_SHORTS_URI = Image.resolveAssetSource(require('../../assets/closet items/khaki shorts.png')).uri;
const GRAY_SWEATPANTS_URI = Image.resolveAssetSource(require('../../assets/closet items/gray sweatpants.png')).uri;
const PLAID_SKIRT_URI = Image.resolveAssetSource(require('../../assets/closet items/plaid skirt.png')).uri;
const WHITE_SNEAKERS_URI = Image.resolveAssetSource(require('../../assets/closet items/white sneakers.png')).uri;
const BROWN_LEATHER_BOOTS_URI = Image.resolveAssetSource(require('../../assets/closet items/brown leather boots.png')).uri;
const BLACK_RUNNING_SHOES_URI = Image.resolveAssetSource(require('../../assets/closet items/black running shoes.png')).uri;
const BEIGE_SANDALS_URI = Image.resolveAssetSource(require('../../assets/closet items/beige sandals.png')).uri;
const GRAY_WOOL_BEANIE_URI = Image.resolveAssetSource(require('../../assets/closet items/gray wool beanie.png')).uri;
const BLACK_LEATHER_BELT_URI = Image.resolveAssetSource(require('../../assets/closet items/black leather belt.png')).uri;
const PATTERNED_SCARF_URI = Image.resolveAssetSource(require('../../assets/closet items/patterned scarf.png')).uri;
const CANVAS_BACKPACK_URI = Image.resolveAssetSource(require('../../assets/closet items/canvas backpack.png')).uri;
const AVIATOR_SUNGLASSES_URI = Image.resolveAssetSource(require('../../assets/closet items/aviator sunglasses.png')).uri;
const RED_BASEBALL_CAP_URI = Image.resolveAssetSource(require('../../assets/closet items/red baseball cap.png')).uri;

const LOCAL_IMAGE_BY_ID: Record<string, string> = {
  '1': CLASSIC_WHITE_TSHIRT_URI,
  '2': NAVY_BLUE_HOODIE_URI,
  '3': STRIPED_SUMMER_BLOUSE_URI,
  '4': BLACK_LEATHER_JACKET_URI,
  '5': GREEN_FLANNEL_SHIRT_URI,
  '6': BLUE_DENIM_JEANS_URI,
  '7': BLACK_DRESS_PANTS_URI,
  '8': KHAKI_SHORTS_URI,
  '9': GRAY_SWEATPANTS_URI,
  '10': PLAID_SKIRT_URI,
  '11': WHITE_SNEAKERS_URI,
  '12': BROWN_LEATHER_BOOTS_URI,
  '13': BLACK_RUNNING_SHOES_URI,
  '14': BEIGE_SANDALS_URI,
  '15': GRAY_WOOL_BEANIE_URI,
  '16': BLACK_LEATHER_BELT_URI,
  '17': PATTERNED_SCARF_URI,
  '18': CANVAS_BACKPACK_URI,
  '19': AVIATOR_SUNGLASSES_URI,
  '20': RED_BASEBALL_CAP_URI,
};

const applyLocalImageOverrides = (items: ClothingItem[]): ClothingItem[] =>
  items.map(item => ({
    ...item,
    imageUrl: LOCAL_IMAGE_BY_ID[item.id] || item.imageUrl,
  }));

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
    imageUrl: CLASSIC_WHITE_TSHIRT_URI,
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
    imageUrl: NAVY_BLUE_HOODIE_URI,
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
    imageUrl: STRIPED_SUMMER_BLOUSE_URI,
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
    imageUrl: BLACK_LEATHER_JACKET_URI,
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
    imageUrl: GREEN_FLANNEL_SHIRT_URI,
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
    imageUrl: BLUE_DENIM_JEANS_URI,
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
    imageUrl: BLACK_DRESS_PANTS_URI,
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
    imageUrl: KHAKI_SHORTS_URI,
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
    imageUrl: GRAY_SWEATPANTS_URI,
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
    imageUrl: PLAID_SKIRT_URI,
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
    imageUrl: WHITE_SNEAKERS_URI,
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
    imageUrl: BROWN_LEATHER_BOOTS_URI,
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
    imageUrl: BLACK_RUNNING_SHOES_URI,
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
    imageUrl: BEIGE_SANDALS_URI,
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
    imageUrl: GRAY_WOOL_BEANIE_URI,
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
    imageUrl: BLACK_LEATHER_BELT_URI,
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
    imageUrl: PATTERNED_SCARF_URI,
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
    imageUrl: CANVAS_BACKPACK_URI,
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
    imageUrl: AVIATOR_SUNGLASSES_URI,
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
    imageUrl: RED_BASEBALL_CAP_URI,
    seasons: ['spring', 'summer', 'fall'],
    tags: ['casual', 'sports', 'summer'],
  },
];

export function ClosetProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(applyLocalImageOverrides(INITIAL_ITEMS));
  const [categories, setCategories] = useState<string[]>(['Tops', 'Bottoms', 'Shoes', 'Accessories']);
  const [isLoaded, setIsLoaded] = useState(false);
  const CLOSET_STORAGE_KEY = '@wind_co_closet_items_v2';
  const CATEGORIES_STORAGE_KEY = '@wind_co_closet_categories';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load items
        const storedItems = await AsyncStorage.getItem(CLOSET_STORAGE_KEY);
        if (storedItems !== null) {
          const parsedItems = JSON.parse(storedItems);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            setItems(applyLocalImageOverrides(parsedItems));
          } else {
            console.log('Storage empty, using initial items');
            setItems(applyLocalImageOverrides(INITIAL_ITEMS));
          }
        } else {
          console.log('No storage found, using initial items');
          setItems(applyLocalImageOverrides(INITIAL_ITEMS));
        }

        // Load categories
        const storedCategories = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (storedCategories !== null) {
          const parsedCategories = JSON.parse(storedCategories);
          if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
             setCategories(parsedCategories);
          }
        }
      } catch (e) {
        console.error('Failed to load closet data', e);
        setItems(applyLocalImageOverrides(INITIAL_ITEMS));
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(CLOSET_STORAGE_KEY, JSON.stringify(items)).catch(console.error);
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories)).catch(console.error);
    }
  }, [categories, isLoaded]);

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
    setItems(prevItems => [item, ...prevItems]);
  };

  const addItems = (newItems: ClothingItem[]) => {
    setItems(prevItems => [...newItems, ...prevItems]);
  };

  const addCategory = (name: string) => {
    setCategories(prev => {
       if (prev.map(c => c.toLowerCase()).includes(name.toLowerCase())) return prev;
       return [...prev, name];
    });
  };

  const deleteCategory = (name: string) => {
    setCategories(prev => prev.filter(c => c.toLowerCase() !== name.toLowerCase()));
  };

  const resetCloset = async () => {
    try {
      await AsyncStorage.removeItem(CLOSET_STORAGE_KEY);
      await AsyncStorage.removeItem(CATEGORIES_STORAGE_KEY);
      setItems(applyLocalImageOverrides(INITIAL_ITEMS));
      setCategories(['Tops', 'Bottoms', 'Shoes', 'Accessories']);
      console.log('Closet reset to initial items and categories');
    } catch (e) {
      console.error('Failed to reset closet', e);
    }
  };

  return (
    <ClosetContext.Provider value={{ items, categories, updateItem, deleteItem, addItem, addItems, addCategory, deleteCategory, resetCloset }}>
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
