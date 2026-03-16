import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Switch, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { ClothingItem, useCloset } from '../context/ClosetContext';
import { SEASONS, useOutfitContext } from '../context/OutfitContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';

export default function OutfitBuilderScreen() {
  const { items, categories } = useCloset();
  const { outfits, addOutfit, updateOutfit, allTags } = useOutfitContext();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialOutfit = route.params?.editOutfit;
  const prefillItemId = route.params?.prefillItemId;
  const prefillRequestId = route.params?.prefillRequestId;

  const [name, setName] = useState('');
  const [season, setSeason] = useState(SEASONS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const [pieces, setPieces] = useState<Record<string, ClothingItem[]>>({});

  useEffect(() => {
    // Initialize pieces state with available categories if not already set up
    if (categories.length > 0 && Object.keys(pieces).length === 0) {
      const initialPieces: Record<string, ClothingItem[]> = {};
      categories.forEach(cat => {
        initialPieces[cat] = [];
      });
      setPieces(initialPieces);
    }
  }, [categories]);

  const [weatherRange, setWeatherRange] = useState<{ min24h: number, max24h: number } | null>(null);

  React.useEffect(() => {
    const fetchWeatherRange = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let location = await Location.getCurrentPositionAsync({});
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&hourly=temperature_2m`);
        const data = await response.json();
        const next24hTemps = data.hourly.temperature_2m.slice(0, 24);
        setWeatherRange({
          min24h: Math.round(Math.min(...next24hTemps)),
          max24h: Math.round(Math.max(...next24hTemps)),
        });
      } catch (e) {}
    };
    fetchWeatherRange();
  }, []);

  React.useEffect(() => {
    if (initialOutfit && items.length > 0 && !name) {
      setName(initialOutfit.name);
      setSeason(initialOutfit.season);
      setTags(initialOutfit.tags);
      
      const hydratedPieces: Record<string, ClothingItem[]> = {};
      categories.forEach(cat => { hydratedPieces[cat] = []; });
      
      initialOutfit.pieces.forEach((pieceName: string) => {
        const match = items.find(i => i.name === pieceName);
        if (match) {
           const slot = match.category;
           if (hydratedPieces[slot] !== undefined) {
             hydratedPieces[slot].push(match);
           }
        }
      });
      setPieces(hydratedPieces);
    }
  }, [initialOutfit, items, categories]);

  React.useEffect(() => {
    if (!prefillItemId || !prefillRequestId || initialOutfit || items.length === 0) return;

    const prefillItem = items.find(item => item.id === prefillItemId);
    if (!prefillItem) return;

    const slot = prefillItem.category;
    if (!slot || !categories.includes(slot)) return;

    setPieces(prev => {
      const slotItems = prev[slot] || [];
      if (slotItems.some(i => i.id === prefillItem.id)) return prev;
      return {
        ...prev,
        [slot]: [...slotItems, prefillItem],
      };
    });
  }, [prefillItemId, prefillRequestId, initialOutfit, items, categories]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [weatherShuffle, setWeatherShuffle] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  const openPicker = (slot: string) => {
    setActiveSlot(slot);
    setPickerVisible(true);
  };

  const selectItemForSlot = (item: ClothingItem) => {
    if (activeSlot) {
      setPieces(prev => {
        const slotItems = prev[activeSlot] || [];
        const isSelected = slotItems.some(i => i.id === item.id);
        if (isSelected) {
          return { ...prev, [activeSlot]: slotItems.filter(i => i.id !== item.id) };
        } else {
          return { ...prev, [activeSlot]: [...slotItems, item] };
        }
      });
    }
  };

  const clearSlotItem = (slot: string, itemId: string) => {
    setPieces(prev => ({
      ...prev,
      [slot]: (prev[slot] || []).filter(i => i.id !== itemId),
    }));
  };

  const clearSlot = (slot: string) => {
    setPieces(prev => ({ ...prev, [slot]: [] }));
  };

  const availableItemsForActiveSlot = useMemo(() => {
    if (!activeSlot) return [];
    const normalizedSlot = activeSlot.toLowerCase();
    let filtered = items.filter(i => i.category.toLowerCase() === normalizedSlot);
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q));
    }
    return filtered;
  }, [items, activeSlot, pickerSearch]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const overlapsWeatherRange = (
    item: ClothingItem,
    range: { min24h: number; max24h: number }
  ) => {
    if (!item.weatherRating) return false;
    return item.weatherRating.minTemp <= range.max24h && item.weatherRating.maxTemp >= range.min24h;
  };

  const getWeatherMismatchScore = (
    item: ClothingItem,
    range: { min24h: number; max24h: number }
  ) => {
    if (!item.weatherRating) return Number.POSITIVE_INFINITY;

    // Penalize items that are clearly outside today's temperature window.
    const tooColdPenalty = Math.max(0, item.weatherRating.minTemp - range.max24h);
    const tooWarmPenalty = Math.max(0, range.min24h - item.weatherRating.maxTemp);

    // Mild tiebreaker so among suitable items we favor closest comfort midpoint.
    const itemMid = (item.weatherRating.minTemp + item.weatherRating.maxTemp) / 2;
    const dayMid = (range.min24h + range.max24h) / 2;
    const midpointPenalty = Math.abs(itemMid - dayMid) * 0.05;

    return tooColdPenalty * 4 + tooWarmPenalty * 4 + midpointPenalty;
  };

  const handleShuffle = () => {
    const currentSeason = getCurrentSeason();
    const newPieces: Record<string, ClothingItem[]> = {};
    categories.forEach(cat => { newPieces[cat] = []; });
    
    categories.forEach(category => {
      let candidates = items.filter(i => i.category.toLowerCase() === category.toLowerCase() && i.status === 'clean');
      if (weatherShuffle) {
        if (weatherRange) {
          const weatherMatched = candidates.filter(i => overlapsWeatherRange(i, weatherRange));

          if (weatherMatched.length > 0) {
            candidates = weatherMatched;
          } else {
            // If no perfect match exists, choose from least-mismatched items instead of random picks.
            const scored = [...candidates]
              .map(item => ({ item, score: getWeatherMismatchScore(item, weatherRange) }))
              .sort((a, b) => a.score - b.score);
            const bestScore = scored[0]?.score;
            candidates = bestScore === undefined
              ? []
              : scored.filter(entry => entry.score === bestScore).map(entry => entry.item);
          }
        } else {
          // Fallback if weather API data isn't available yet.
          candidates = candidates.filter(i => i.seasons && i.seasons.includes(currentSeason as any));
        }
      }
      if (candidates.length > 0) {
        newPieces[category] = [candidates[Math.floor(Math.random() * candidates.length)]];
      }
    });

    setPieces(newPieces);
    if (!name.trim()) {
      setName(`Shuffled ${getCurrentSeason().charAt(0).toUpperCase() + getCurrentSeason().slice(1)} Look`);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give your outfit a name.');
      return;
    }

    const selectedItems = Object.values(pieces).flat();
    if (selectedItems.length === 0) {
      Alert.alert('Empty Outfit', 'Please add at least one piece to your outfit.');
      return;
    }

    // Check for duplicates
    const selectedPieceNames = selectedItems.map(i => i.name).sort();
    const isDuplicate = outfits.some(o => {
      if (initialOutfit && o.id === initialOutfit.id) return false;
      const oPieces = [...o.pieces].sort();
      return JSON.stringify(oPieces) === JSON.stringify(selectedPieceNames);
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Outfit', 'You already have an outfit with these exact pieces! Please edit the existing one or change a piece.');
      return;
    }

    const outfitData = {
      id: initialOutfit ? initialOutfit.id : `outfit_${Date.now()}`,
      name: name.trim(),
      season,
      tags,
      pieces: selectedItems.map(i => i.name),
      createdAt: initialOutfit ? initialOutfit.createdAt : new Date().toISOString(),
      timesWorn: initialOutfit ? initialOutfit.timesWorn : 0,
      wearHistory: initialOutfit ? initialOutfit.wearHistory : [],
      isFavorite: initialOutfit ? initialOutfit.isFavorite : false,
      images: selectedItems.map(i => i.imageUrl),
    };

    if (initialOutfit) {
      updateOutfit(outfitData);
    } else {
      addOutfit(outfitData);
    }

    // Show toast
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowToast(false);
      handleClear();
      if (initialOutfit) {
        navigation.setParams({ editOutfit: undefined });
      }
      navigation.navigate('ArchiveTab');
    });
  };

  const handleClear = () => {
    setName('');
    setSeason(SEASONS[0]);
    setTags([]);
    const clearedPieces: Record<string, ClothingItem[]> = {};
    categories.forEach(cat => { clearedPieces[cat] = []; });
    setPieces(clearedPieces);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{initialOutfit ? 'Edit Outfit' : 'Create Outfit'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle} activeOpacity={0.7}>
            <Ionicons name="shuffle" size={18} color={Colors.accent} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.shuffleHelpText}>
        Shuffle auto-fills your outfit with random pieces. Turn on weather shuffle to prioritize items suited to current conditions.
      </Text>

      {/* Weather Toggle */}
      <View style={styles.weatherToggleRow}>
        <Text style={styles.weatherToggleLabel}>Shuffle by current weather</Text>
        <Switch
          value={weatherShuffle}
          onValueChange={setWeatherShuffle}
          trackColor={{ false: Colors.border, true: Colors.accentSoft }}
          thumbColor={weatherShuffle ? Colors.accent : Colors.textMuted}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Flat-Lay Slots */}
          <View style={styles.slotsContainer}>
            {categories.map((slot) => {
              const slotItems = pieces[slot] || [];
              return (
                <View key={slot} style={styles.slotRow}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotLabel}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                    {slotItems.length > 0 && (
                      <TouchableOpacity onPress={() => clearSlot(slot)}>
                        <Text style={styles.clearSlotText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotItemsScroll}>
                    {slotItems.map(item => (
                      <View key={item.id} style={styles.selectedItemCard}>
                        <Image source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl} style={styles.slotImage} resizeMode="contain" />
                        <TouchableOpacity style={styles.removeSlotBtn} onPress={() => clearSlotItem(slot, item.id)}>
                          <Ionicons name="close-circle" size={24} color={Colors.surface} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={styles.addSlotCard} 
                      onPress={() => openPicker(slot)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={32} color={Colors.textMuted} />
                      <Text style={styles.emptySlotText}>Add</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              );
            })}
          </View>
          
          {/* Weather Warning */}
          {(() => {
             if (!weatherRange) return null;
             const selectedPieces = Object.values(pieces).flat();
             if (selectedPieces.length === 0) return null;
             
             let outfitMin = null;
             let outfitMax = null;
             for (const p of selectedPieces) {
               if (p.weatherRating) {
                 outfitMin = outfitMin === null ? p.weatherRating.minTemp : Math.min(outfitMin, p.weatherRating.minTemp);
                 outfitMax = outfitMax === null ? p.weatherRating.maxTemp : Math.max(outfitMax, p.weatherRating.maxTemp);
               }
             }

             if (outfitMin !== null && outfitMax !== null) {
               const isTooCold = outfitMin > weatherRange.max24h;
               const isTooWarm = outfitMax < weatherRange.min24h;

               if (isTooCold || isTooWarm) {
                 return (
                   <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.amberSoft, padding: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                     <Ionicons name="warning" size={20} color={Colors.amber} />
                     <View style={{ flex: 1 }}>
                       <Text style={{ ...Typography.subhead, color: Colors.amber }}>
                         {isTooCold ? `This outfit is rated for warmer weather (> ${outfitMin}°C). It might be too cold for today's high of ${weatherRange.max24h}°C.` : `This outfit is rated for colder weather (< ${outfitMax}°C). It might be too warm for today's low of ${weatherRange.min24h}°C.`}
                       </Text>
                       <Text style={{ ...Typography.caption, color: Colors.amber, marginTop: 4 }}>
                         Daily Range: {weatherRange.min24h}°C - {weatherRange.max24h}°C
                       </Text>
                     </View>
                   </View>
                 );
               }
             }
             return null;
          })()}

          {/* Details Section */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Outfit Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Summer Picnic, Conference Look..."
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Season</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {SEASONS.map((s: string) => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.chip, season === s && styles.chipActive]}
                    onPress={() => setSeason(s)}
                  >
                    <Text style={[styles.chipText, season === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occasion Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a new occasion..."
                  placeholderTextColor={Colors.textMuted}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={() => addTag(newTagInput)}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.tagAddButton} onPress={() => addTag(newTagInput)}>
                  <Ionicons name="add" size={20} color={Colors.surface} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.appliedTagsRow}>
                {tags.map(tag => (
                  <View key={tag} style={styles.appliedTag}>
                    <Text style={styles.appliedTagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => setTags(tags.filter(t => t !== tag))}>
                      <Ionicons name="close-circle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {allTags.filter((t: string) => !tags.includes(t)).length > 0 && (
                <View style={[styles.chipsRow, { marginTop: Spacing.sm }]}>
                  {allTags.filter((t: string) => !tags.includes(t)).map((tag: string) => (
                    <TouchableOpacity key={tag} style={styles.suggestedTag} onPress={() => addTag(tag)}>
                      <Ionicons name="add" size={14} color={Colors.primary} style={{ marginRight: 2 }} />
                      <Text style={styles.suggestedTagText}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Outfit</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Item Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setPickerVisible(false); setPickerSearch(''); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalPhoneFrame}>
            <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
              <View style={styles.modalHeader}>
                <View style={{ width: 40 }} />
                <Text style={styles.modalTitle}>Select {activeSlot ? activeSlot.charAt(0).toUpperCase() + activeSlot.slice(1) : ''}</Text>
                <TouchableOpacity onPress={() => { setPickerVisible(false); setPickerSearch(''); }} style={{ width: 40, alignItems: 'flex-end' }}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              {/* Picker Search */}
              <View style={styles.pickerSearchContainer}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search items..."
                  placeholderTextColor={Colors.textMuted}
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                />
                {pickerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setPickerSearch('')}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView contentContainerStyle={styles.pickerContent}>
                {availableItemsForActiveSlot.length === 0 ? (
                  <View style={styles.emptyPickerContainer}>
                    <Ionicons name="shirt-outline" size={48} color={Colors.border} />
                    <Text style={styles.emptyPickerText}>No {activeSlot} items found.</Text>
                    <Text style={styles.emptyPickerSub}>Go to the Closet tab to add some!</Text>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {availableItemsForActiveSlot.map((item: ClothingItem) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.pickerItemCard, (activeSlot && (pieces[activeSlot] || []).some(i => i.id === item.id)) && styles.pickerItemCardSelected]}
                        onPress={() => selectItemForSlot(item)}
                      >
                        <Image source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl} style={styles.pickerItemImage} resizeMode="contain" />
                        <Text style={styles.pickerItemName} numberOfLines={1}>{item.name}</Text>
                        {(activeSlot && (pieces[activeSlot] || []).some(i => i.id === item.id)) && (
                          <View style={styles.selectedOverlay}>
                            <Ionicons name="checkmark-circle" size={32} color={Colors.mint} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.modalBottomAction}>
                <TouchableOpacity 
                  style={styles.modalDoneButton} 
                  onPress={() => { setPickerVisible(false); setPickerSearch(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Save Toast */}
      {showToast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.mint} />
          <Text style={styles.toastText}>Outfit Saved!</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.title },
  shuffleHelpText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  clearText: { ...Typography.subhead, color: Colors.coral, fontWeight: '600' },
  container: { paddingBottom: 150 },
  
  slotsContainer: {
    paddingVertical: Spacing.md,
  },
  slotRow: {
    marginBottom: Spacing.lg,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  slotLabel: {
    ...Typography.headline,
  },
  clearSlotText: {
    ...Typography.subhead,
    color: Colors.coral,
  },
  slotItemsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  selectedItemCard: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    ...Shadows.card,
    overflow: 'hidden',
  },
  addSlotCard: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  emptySlotText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  removeSlotBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.full,
  },

  detailsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.subhead,
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Typography.body,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },

  tagInputContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    padding: Spacing.md,
    ...Typography.body,
    outlineStyle: 'none' as any,
  },
  tagAddButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  appliedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  appliedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  appliedTagText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '500',
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  suggestedTagText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '500',
  },

  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  saveButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { ...Typography.headline },
  modalActionTextCancel: { ...Typography.subhead, color: Colors.textSecondary },
  modalBottomAction: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  modalDoneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  modalDoneButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },
  
  pickerContent: {
    padding: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pickerItemCard: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerItemCardSelected: {
    borderColor: Colors.mint,
  },
  pickerItemImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPickerContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPickerText: {
    ...Typography.headline,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyPickerSub: {
    ...Typography.subhead,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Shuffle
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  shuffleText: {
    ...Typography.subhead,
    color: Colors.accent,
    fontWeight: '600',
  },

  // Weather Toggle
  weatherToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  weatherToggleLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },

  // Modal Overlay & Phone Frame
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPhoneFrame: {
    width: '100%',
    maxWidth: 430,
    height: '85%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },

  // Picker Search
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    fontSize: 13,
  },
  pickerItemName: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  toastText: {
    ...Typography.headline,
    color: Colors.text,
  },
});
