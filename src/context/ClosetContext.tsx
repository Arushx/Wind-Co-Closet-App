import React, { createContext, useState, useContext, ReactNode } from 'react';

type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories';
type ClothingStatus = 'clean' | 'dirty' | 'laundry';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  category: ClothingCategory;
  color: string;
  status: ClothingStatus;
  imageUrl: string;
  seasons: Season[];
}

interface ClosetContextType {
  items: ClothingItem[];
  updateItem: (id: string, updates: Partial<ClothingItem>) => void;
  deleteItem: (id: string) => void;
  addItem: (item: ClothingItem) => void;
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

const INITIAL_ITEMS: ClothingItem[] = [
  // Tops
  { id: '1', name: 'White Oxford Shirt', brand: 'Uniqlo', category: 'tops', color: '#FFFFFF', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall', 'winter'] },
  { id: '2', name: 'Navy Sweater', brand: 'J.Crew', category: 'tops', color: '#1E40AF', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '3', name: 'Gray T-Shirt', brand: 'Everlane', category: 'tops', color: '#6B7280', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '4', name: 'Black Polo', brand: 'Ralph Lauren', category: 'tops', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '5', name: 'Denim Shirt', brand: 'Levi\'s', category: 'tops', color: '#3B82F6', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1626497764746-6dc36546d242?w=400&h=400&fit=crop', seasons: ['spring', 'fall'] },
  { id: '6', name: 'Striped Tee', brand: 'Gap', category: 'tops', color: '#FFFFFF', status: 'laundry', imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '7', name: 'Olive Henley', brand: 'Bonobos', category: 'tops', color: '#65A30D', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=400&h=400&fit=crop', seasons: ['spring', 'fall'] },
  { id: '8', name: 'Cream Cardigan', brand: 'COS', category: 'tops', color: '#FFF7ED', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', seasons: ['spring', 'fall', 'winter'] },
  { id: '9', name: 'Blue Flannel', brand: 'Patagonia', category: 'tops', color: '#3B82F6', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '10', name: 'White Linen Shirt', brand: 'Massimo Dutti', category: 'tops', color: '#FFFFFF', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '11', name: 'Black Turtleneck', brand: 'Uniqlo', category: 'tops', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '12', name: 'Burgundy Hoodie', brand: 'Nike', category: 'tops', color: '#7F1D1D', status: 'laundry', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '13', name: 'Tan Sweatshirt', brand: 'Everlane', category: 'tops', color: '#D4A574', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=400&fit=crop', seasons: ['spring', 'fall'] },
  { id: '14', name: 'Pink Button-Up', brand: 'Charles Tyrwhitt', category: 'tops', color: '#F472B6', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1603252109612-23e5b0d6c2d4?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '15', name: 'V-Neck Tee', brand: 'H&M', category: 'tops', color: '#374151', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  
  // Bottoms
  { id: '16', name: 'Dark Denim Jeans', brand: 'Levi\'s 511', category: 'bottoms', color: '#1E3A8A', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', seasons: ['spring', 'fall', 'winter'] },
  { id: '17', name: 'Khaki Chinos', brand: 'Bonobos', category: 'bottoms', color: '#D4A574', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '18', name: 'Black Slacks', brand: 'Banana Republic', category: 'bottoms', color: '#000000', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop', seasons: ['spring', 'fall', 'winter'] },
  { id: '19', name: 'Gray Joggers', brand: 'Nike', category: 'bottoms', color: '#6B7280', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400&h=400&fit=crop', seasons: ['spring', 'fall', 'winter'] },
  { id: '20', name: 'Navy Shorts', brand: 'Patagonia', category: 'bottoms', color: '#1E40AF', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '21', name: 'Light Wash Jeans', brand: 'Gap', category: 'bottoms', color: '#93C5FD', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '22', name: 'Olive Cargo Pants', brand: 'Carhartt', category: 'bottoms', color: '#65A30D', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1624378439299-c8e9a5d6a70d?w=400&h=400&fit=crop', seasons: ['spring', 'fall'] },
  { id: '23', name: 'Gray Dress Pants', brand: 'Hugo Boss', category: 'bottoms', color: '#4B5563', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '24', name: 'Black Jeans', brand: 'Levi\'s 510', category: 'bottoms', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop', seasons: ['spring', 'fall', 'winter'] },
  { id: '25', name: 'Beige Linen Pants', brand: 'Massimo Dutti', category: 'bottoms', color: '#FEF3C7', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '26', name: 'Charcoal Chinos', brand: 'Dockers', category: 'bottoms', color: '#374151', status: 'laundry', imageUrl: 'https://images.unsplash.com/photo-1624378440070-7ad0b597a904?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '27', name: 'Athletic Shorts', brand: 'Adidas', category: 'bottoms', color: '#000000', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1591195853842-c45cb8d4c5b6?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  
  // Shoes
  { id: '28', name: 'White Sneakers', brand: 'Common Projects', category: 'shoes', color: '#FFFFFF', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '29', name: 'Brown Leather Boots', brand: 'Thursday Boot', category: 'shoes', color: '#92400E', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '30', name: 'Black Loafers', brand: 'Allen Edmonds', category: 'shoes', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '31', name: 'Running Shoes', brand: 'Nike', category: 'shoes', color: '#3B82F6', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall', 'winter'] },
  { id: '32', name: 'Canvas Sneakers', brand: 'Converse', category: 'shoes', color: '#6B7280', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  
  // Accessories
  { id: '33', name: 'Leather Belt', brand: 'Coach', category: 'accessories', color: '#92400E', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall', 'winter'] },
  { id: '34', name: 'Wool Scarf', brand: 'Burberry', category: 'accessories', color: '#DC2626', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop', seasons: ['fall', 'winter'] },
  { id: '35', name: 'Sunglasses', brand: 'Ray-Ban', category: 'accessories', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop', seasons: ['spring', 'summer'] },
  { id: '36', name: 'Baseball Cap', brand: 'New Era', category: 'accessories', color: '#1E40AF', status: 'dirty', imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall'] },
  { id: '37', name: 'Watch', brand: 'Seiko', category: 'accessories', color: '#374151', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall', 'winter'] },
  { id: '38', name: 'Backpack', brand: 'Herschel', category: 'accessories', color: '#000000', status: 'clean', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', seasons: ['spring', 'summer', 'fall', 'winter'] },
];

export function ClosetProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>(INITIAL_ITEMS);

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

  return (
    <ClosetContext.Provider value={{ items, updateItem, deleteItem, addItem }}>
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
