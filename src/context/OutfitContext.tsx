import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const INITIAL_OUTFITS: Outfit[] = [];

export const DEFAULT_WEAR_EVENT = 'Event';

const padDatePart = (value: number) => value.toString().padStart(2, '0');

export const formatWearDate = (date: Date) => (
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
);

export const parseWearDate = (value: string) => {
  const matchedDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (matchedDate) {
    const [, year, month, day] = matchedDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
};

export const normalizeWearDate = (date: Date) => (
  new Date(date.getFullYear(), date.getMonth(), date.getDate())
);

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

interface OutfitContextType {
  outfits: Outfit[];
  addOutfit: (outfit: Outfit) => void;
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
  const [isLoaded, setIsLoaded] = useState(false);
  
  const OUTFIT_STORAGE_KEY = '@wind_co_outfits_v2';
  const EVENTS_STORAGE_KEY = '@wind_co_events_v2';

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedOutfits = await AsyncStorage.getItem(OUTFIT_STORAGE_KEY);
        if (storedOutfits !== null) {
          const parsedOutfits = JSON.parse(storedOutfits);
          if (Array.isArray(parsedOutfits)) {
            setOutfits(currentOutfits => currentOutfits.length > 0 ? currentOutfits : parsedOutfits);
          }
        }
        
        const storedEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
        if (storedEvents !== null) {
          const parsedEvents = JSON.parse(storedEvents);
          if (parsedEvents && typeof parsedEvents === 'object') {
            setEventDefaultAudiences(currentEvents =>
              Object.keys(currentEvents).length > 0 ? currentEvents : parsedEvents
            );
          }
        }
      } catch (e) {
        console.error('Failed to load outfit data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits)).catch(console.error);
    }
  }, [outfits, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(eventDefaultAudiences)).catch(console.error);
    }
  }, [eventDefaultAudiences, isLoaded]);

  const addOutfit = (outfit: Outfit) => {
    setOutfits(currentOutfits => [...currentOutfits, outfit]);
  };

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
    <OutfitContext.Provider value={{ outfits, addOutfit, updateOutfit, deleteOutfit, allTags, allEvents, allAudiences, eventDefaultAudiences, updateEventDefaults }}>
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
