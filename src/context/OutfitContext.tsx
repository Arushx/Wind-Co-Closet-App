import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

export interface WearHistoryItem {
  id: string;
  date: string;
  event: string;
  audiences: string[];
  notes?: string;
  location?: string;
}

export interface Outfit {
  id: string;
  name: string;
  season: string;
  tags: string[];
  pieces: string[];
  createdAt: string;
  timesWorn: number;
  wearHistory: WearHistoryItem[];
  isFavorite: boolean;
  images: string[];
}

const INITIAL_OUTFITS: Outfit[] = [
  {
    id: '1',
    name: 'Casual Spring',
    season: 'Spring',
    tags: ['Casual', 'Daytime'],
    pieces: ['White Tee', 'Blue Jeans', 'White Sneakers', 'Sunglasses'],
    createdAt: '2025-04-12T10:00:00Z',
    timesWorn: 12,
    wearHistory: [
      { id: 'wh1', date: '2025-05-15T18:00:00Z', event: 'Park Picnic', audiences: ['Friends', 'Family'], location: 'High Park, Toronto' },
      { id: 'wh2', date: '2025-06-02T10:00:00Z', event: 'Weekend Coffee', audiences: ['Sarah'] },
    ],
    isFavorite: true,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80',
    ],
  },
  {
    id: '2',
    name: 'Office Ready',
    season: 'Fall',
    tags: ['Work', 'Professional', 'Chic'],
    pieces: ['Blazer', 'Black Pants', 'Oxford Shoes', 'Watch'],
    createdAt: '2025-09-05T08:30:00Z',
    timesWorn: 34,
    wearHistory: [
      { id: 'wh3', date: '2025-10-10T09:00:00Z', event: 'Important Client Pitch', audiences: ['Clients', 'Boss'] },
      { id: 'wh4', date: '2025-11-04T08:30:00Z', event: 'Regular Office Day', audiences: ['Co-workers'] },
    ],
    isFavorite: false,
    images: [
      'https://unsplash.com/photos/a-red-jacket-hanging-on-a-clothes-line-L7MBmE1VbVg',
      'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQrzkKGSBjWN1GgGIQCXzTUiHSBR_eYRFaChFkGFDrUtNFnuLNQtCidEnKIbj6cLOxCKqxdAyFVFxnn_bM191Vr-bKD2emzhmbgu_YZ0qiOv-0p-MGJGUK3pg',
      'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRXDo-g4utdWDLHQOr5whRuT9AHZebQAh3kJGTkccMd92wCUHsYwBgQ5YBBq1Lm2xqDBTT-rE8IDBjDciCzSmIR_ZBDa9OpMgLXHFJQ_Yz-Sw-lIgAvE-2gyw',
      'https://unsplash.com/photos/white-round-analog-watch-at-10-10-1PosCRNoxJg',
    ],
  },
  {
    id: '3',
    name: 'Evening Out',
    season: 'Summer',
    tags: ['Night', 'Elegant', 'Formal'],
    pieces: ['Silk Blouse', 'Midi Skirt', 'Heels', 'Leather Handbag'],
    createdAt: '2025-07-20T19:00:00Z',
    timesWorn: 3,
    wearHistory: [
      { id: 'wh5', date: '2025-08-15T20:00:00Z', event: 'Anniversary Dinner', audiences: ['Partner'], location: 'Canoe Restaurant' },
    ],
    isFavorite: true,
    images: [
      'https://images.unsplash.com/photo-GWh3A0Gf3z8?w=400&q=80',
      'https://images.unsplash.com/photo-3y8TdbKX7SA?w=400&q=80',
      'https://images.unsplash.com/photo-g3wX2lRomFU?w=400&q=80',
      'https://images.unsplash.com/photo-IjfvQXXGHNo?w=400&q=80',
    ],
  },
  {
    id: '4',
    name: 'Winter Cozy',
    season: 'Winter',
    tags: ['Casual', 'Warm'],
    pieces: ['Sweater', 'Blue Jeans', 'Boots', 'Scarf'],
    createdAt: '2025-12-01T14:15:00Z',
    timesWorn: 18,
    wearHistory: [
      { id: 'wh6', date: '2026-01-10T11:00:00Z', event: 'Ski Trip Brunch', audiences: ['Friends', 'Date'] },
      { id: 'wh7', date: '2026-01-22T19:30:00Z', event: 'Movie Night', audiences: ['Roommates'] },
      { id: 'wh8', date: '2026-02-05T08:00:00Z', event: 'Morning Commute', audiences: ['General Public'] },
      { id: 'wh9', date: '2026-02-28T14:00:00Z', event: 'Ice Skating', audiences: ['Family'] },
    ],
    isFavorite: false,
    images: [
      'https://images.unsplash.com/photo-1574296715891-b3b0dfbbf27a?w=400&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
      'https://images.unsplash.com/photo-1620803158784-0a3ceba206ee?w=400&q=80',
      'https://images.unsplash.com/photo-1600868774775-dbf5d8866df7?w=400&q=80',
    ],
  },
];

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

interface OutfitContextType {
  outfits: Outfit[];
  updateOutfit: (outfit: Outfit) => void;
  allTags: string[];
  allEvents: string[];
  allAudiences: string[];
  eventDefaultAudiences: Record<string, string[]>;
  updateEventDefaults: (event: string, audiences: string[]) => void;
  deleteOutfit: (id: string) => void;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

export const OutfitProvider = ({ children }: { children: React.ReactNode }) => {
  const [outfits, setOutfits] = useState<Outfit[]>(INITIAL_OUTFITS);
  const [eventDefaultAudiences, setEventDefaultAudiences] = useState<Record<string, string[]>>({});

  const updateOutfit = (updatedOutfit: Outfit) => {
    setOutfits(currentOutfits => 
      currentOutfits.map(outfit => outfit.id === updatedOutfit.id ? updatedOutfit : outfit)
    );
  };

  const deleteOutfit = (id: string) => {
    setOutfits(currentOutfits => currentOutfits.filter(outfit => outfit.id !== id));
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    outfits.forEach(outfit => outfit.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [outfits]);

  const allEvents = useMemo(() => {
    const eventSet = new Set<string>();
    outfits.forEach(o => {
      (o.wearHistory || []).forEach(wh => {
        if (wh.event) eventSet.add(wh.event);
      });
    });
    return Array.from(eventSet).sort();
  }, [outfits]);

  const allAudiences = useMemo(() => {
    const audSet = new Set<string>();
    outfits.forEach(o => {
      (o.wearHistory || []).forEach(wh => {
        (wh.audiences || []).forEach(aud => audSet.add(aud));
      });
    });
    return Array.from(audSet).sort();
  }, [outfits]);

  const updateEventDefaults = (event: string, audiences: string[]) => {
    setEventDefaultAudiences(prev => ({
      ...prev,
      [event]: audiences
    }));
  };

  return (
    <OutfitContext.Provider value={{ outfits, updateOutfit, deleteOutfit, allTags, allEvents, allAudiences, eventDefaultAudiences, updateEventDefaults }}>
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfitContext() {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error('useOutfitContext must be used within an OutfitProvider');
  }
  return context;
}
