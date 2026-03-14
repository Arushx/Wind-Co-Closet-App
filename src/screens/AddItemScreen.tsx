import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset } from '../context/ClosetContext';

type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

type DraftItem = {
  id: string;
  name: string;
  brand: string;
  category: ClothingCategory;
  selectedSeasons: Season[];
  imageUri: string;
  color: string;
  tags: string[];
  weatherRating: { minTemp: number, maxTemp: number };
};

interface AddItemScreenProps {
  navigation: any;
}

export default function AddItemScreen({ navigation }: AddItemScreenProps) {
  const { items, addItems } = useCloset();
  
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTagInput, setNewTagInput] = useState('');
  const [minTempInput, setMinTempInput] = useState('10');
  const [maxTempInput, setMaxTempInput] = useState('25');
  const [minTempNegative, setMinTempNegative] = useState(false);
  const [maxTempNegative, setMaxTempNegative] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  const currentItem = draftItems[currentIndex] || null;

  const normalizeTemperature = (value: string, isNegative: boolean) => {
    const parsed = parseInt(value, 10);
    const absoluteValue = isNaN(parsed) ? 0 : Math.abs(parsed);
    return isNegative ? -absoluteValue : absoluteValue;
  };

  useEffect(() => {
    if (!currentItem) return;
    setMinTempInput(String(Math.abs(currentItem.weatherRating.minTemp)));
    setMaxTempInput(String(Math.abs(currentItem.weatherRating.maxTemp)));
    setMinTempNegative(currentItem.weatherRating.minTemp < 0);
    setMaxTempNegative(currentItem.weatherRating.maxTemp < 0);
  }, [currentIndex, currentItem?.id]);

  const categories: { key: ClothingCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'tops', label: 'Tops', icon: 'tshirt-crew' },
    { key: 'bottoms', label: 'Bottoms', icon: 'hanger' },
    { key: 'shoes', label: 'Shoes', icon: 'shoe-sneaker' },
    { key: 'accessories', label: 'Accessories', icon: 'bag-personal' },
  ];

  const seasons: { key: Season; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'spring', label: 'Spring', icon: 'flower' },
    { key: 'summer', label: 'Summer', icon: 'white-balance-sunny' },
    { key: 'fall', label: 'Fall', icon: 'leaf' },
    { key: 'winter', label: 'Winter', icon: 'snowflake' },
  ];

  const updateCurrentItem = (updates: Partial<DraftItem>) => {
    setDraftItems(prev => {
      const newItems = [...prev];
      if (newItems[currentIndex]) {
        newItems[currentIndex] = { ...newItems[currentIndex], ...updates };
      }
      return newItems;
    });
  };

  const deleteCurrentItem = () => {
    setDraftItems(prev => {
      const newItems = [...prev];
      newItems.splice(currentIndex, 1);
      return newItems;
    });
    setCurrentIndex(0);
  };

  const toggleSeason = (season: Season) => {
    if (!currentItem) return;
    const prevSeasons = currentItem.selectedSeasons;
    const newSeasons = prevSeasons.includes(season) 
      ? prevSeasons.filter(s => s !== season) 
      : [...prevSeasons, season];
    updateCurrentItem({ selectedSeasons: newSeasons });
  };

  const processImage = async (uri: string) => {
    try {
      const item: DraftItem = {
        id: Date.now().toString(),
        name: '',
        brand: '',
        category: 'tops',
        selectedSeasons: ['spring', 'summer', 'fall', 'winter'],
        imageUri: uri,
        color: '#CCCCCC',
        tags: [],
        weatherRating: { minTemp: 10, maxTemp: 25 },
      };
      setDraftItems([item]);
      setCurrentIndex(0);
    } catch (e) {
      console.log('Failed to process image', e);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (draftItems.length === 0) return;

    const normalizedMin = normalizeTemperature(minTempInput, minTempNegative);
    const normalizedMax = normalizeTemperature(maxTempInput, maxTempNegative);

    const newClothingItems = draftItems.map((item, index) => {
      const weatherRating = index === currentIndex
        ? { minTemp: normalizedMin, maxTemp: normalizedMax }
        : item.weatherRating;
      const defaultName = `New ${item.category.charAt(0).toUpperCase() + item.category.slice(1)} ${Date.now().toString().slice(-4) + index}`;
      return {
        id: item.id,
        name: item.name.trim() || defaultName,
        brand: item.brand.trim() || 'Unknown',
        category: item.category,
        color: item.color || '#CCCCCC',
        weatherRating,
        status: 'clean' as const,
        imageUrl: item.imageUri,
        seasons: item.selectedSeasons,
        tags: item.tags,
      };
    });

    // Check for duplicates
    for (const draft of newClothingItems) {
       const isDuplicate = items.some(item => 
         item.name.toLowerCase() === draft.name.toLowerCase() && 
         item.category === draft.category
       );
       if (isDuplicate) {
          Alert.alert('Duplicate Item Detected', `An item named "${draft.name}" already exists in your ${draft.category}. Please rename it to something unique or delete it.`);
          return;
       }
    }

    addItems(newClothingItems);

    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowToast(false);
      navigation.goBack();
    });
  };
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        
        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          
          {draftItems.length > 0 ? (
            <View style={styles.imagePreviewContainer}>
              <View style={{ width: '100%', aspectRatio: 1, borderRadius: BorderRadius.lg, backgroundColor: Colors.border, overflow: 'hidden' }}>
                <Image source={{ uri: currentItem?.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>

              {draftItems.length > 1 && (
                <View style={{ marginTop: Spacing.sm }}>
                  <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 }}>
                    Swipe to review extracted pieces
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                    {draftItems.map((draft, idx) => (
                      <TouchableOpacity 
                        key={draft.id} 
                        onPress={() => setCurrentIndex(idx)} 
                        style={[styles.thumbnailButton, currentIndex === idx && styles.thumbnailButtonActive]}
                      >
                        <Image source={{ uri: draft.imageUri }} style={styles.thumbnailImage} resizeMode="contain" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={[styles.photoButton, styles.photoButtonSecondary]}
                  onPress={handleTakePhoto}
                >
                  <MaterialCommunityIcons name="camera" size={20} color={Colors.primary} />
                  <Text style={styles.photoButtonSecondaryText}>Retake Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.photoButton, styles.photoButtonSecondary]}
                  onPress={handlePickImage}
                >
                  <MaterialCommunityIcons name="image" size={20} color={Colors.primary} />
                  <Text style={styles.photoButtonSecondaryText}>Choose Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={handleTakePhoto}
              >
                <MaterialCommunityIcons name="camera" size={32} color={Colors.primary} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.photoButton}
                onPress={handlePickImage}
              >
                <MaterialCommunityIcons name="image" size={32} color={Colors.primary} />
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {currentItem && (
          <>
            {/* Delete current draft if there are multiple */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Item Details</Text>
              {draftItems.length > 0 && (
                 <TouchableOpacity onPress={deleteCurrentItem} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                   <Ionicons name="trash-outline" size={16} color={Colors.coral} />
                   <Text style={{ color: Colors.coral, marginLeft: 4, fontWeight: '600' }}>Discard Item</Text>
                 </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={currentItem.name}
                  onChangeText={(val) => updateCurrentItem({ name: val })}
                  placeholder={`e.g., Blue ${currentItem.category === 'tops' ? 'Shirt' : currentItem.category}`}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Brand (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={currentItem.brand}
                  onChangeText={(val) => updateCurrentItem({ brand: val })}
                  placeholder="e.g., Levi's"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category *</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryCard,
                      currentItem.category === cat.key && styles.categoryCardSelected,
                    ]}
                    onPress={() => updateCurrentItem({ category: cat.key })}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={28}
                      color={currentItem.category === cat.key ? Colors.accent : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        currentItem.category === cat.key && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Season Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seasons *</Text>
              <Text style={styles.sectionSubtitle}>Select all seasons this item can be worn</Text>
              <View style={styles.seasonGrid}>
                {seasons.map((season) => (
                  <TouchableOpacity
                    key={season.key}
                    style={[
                      styles.seasonCard,
                      currentItem.selectedSeasons.includes(season.key) && styles.seasonCardSelected,
                    ]}
                    onPress={() => toggleSeason(season.key)}
                  >
                    <MaterialCommunityIcons
                      name={season.icon}
                      size={24}
                      color={currentItem.selectedSeasons.includes(season.key) ? Colors.accent : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.seasonText,
                        currentItem.selectedSeasons.includes(season.key) && styles.seasonTextSelected,
                      ]}
                    >
                      {season.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Item Properties */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Item Properties</Text>
              
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={styles.label}>Dominant Color</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: currentItem.color, borderWidth: 1, borderColor: Colors.border }} />
                  <Text style={{ ...Typography.body, color: Colors.textSecondary }}>{currentItem.color}</Text>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Weather Rating (°C)</Text>
                <Text style={styles.sectionSubtitle}>Ideal temperature range for this item</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                  <View style={styles.temperatureInputGroup}>
                    <TouchableOpacity
                      style={[styles.temperatureSignButton, minTempNegative && styles.temperatureSignButtonActive]}
                      onPress={() => {
                        const nextValue = !minTempNegative;
                        setMinTempNegative(nextValue);
                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            minTemp: normalizeTemperature(minTempInput, nextValue),
                          },
                        });
                      }}
                    >
                      <Text style={[styles.temperatureSignText, minTempNegative && styles.temperatureSignTextActive]}>
                        {minTempNegative ? '-' : ''}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.temperatureValueInput]}
                      keyboardType="numeric"
                      value={minTempInput}
                      onChangeText={(val) => {
                        if (/^\d*$/.test(val)) {
                          setMinTempInput(val);
                        }
                      }}
                      onEndEditing={() => {
                        const value = normalizeTemperature(minTempInput, minTempNegative);
                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            minTemp: value,
                          },
                        });
                        setMinTempInput(String(Math.abs(value)));
                      }}
                      placeholder="Min"
                    />
                  </View>
                  <Text style={{ ...Typography.body, color: Colors.textMuted }}>to</Text>
                  <View style={styles.temperatureInputGroup}>
                    <TouchableOpacity
                      style={[styles.temperatureSignButton, maxTempNegative && styles.temperatureSignButtonActive]}
                      onPress={() => {
                        const nextValue = !maxTempNegative;
                        setMaxTempNegative(nextValue);
                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            maxTemp: normalizeTemperature(maxTempInput, nextValue),
                          },
                        });
                      }}
                    >
                      <Text style={[styles.temperatureSignText, maxTempNegative && styles.temperatureSignTextActive]}>
                        {maxTempNegative ? '-' : ''}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.temperatureValueInput]}
                      keyboardType="numeric"
                      value={maxTempInput}
                      onChangeText={(val) => {
                        if (/^\d*$/.test(val)) {
                          setMaxTempInput(val);
                        }
                      }}
                      onEndEditing={() => {
                        const value = normalizeTemperature(maxTempInput, maxTempNegative);
                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            maxTemp: value,
                          },
                        });
                        setMaxTempInput(String(Math.abs(value)));
                      }}
                      placeholder="Max"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Custom Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Tags</Text>
              <Text style={styles.sectionSubtitle}>Add any labels to help filter this item later</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInputField}
                  placeholder="e.g. gym, work, party..."
                  placeholderTextColor={Colors.textMuted}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={() => {
                    const t = newTagInput.trim();
                    if (t && !currentItem.tags.includes(t)) {
                      updateCurrentItem({ tags: [...currentItem.tags, t] });
                    }
                    setNewTagInput('');
                  }}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.tagAddBtn}
                  onPress={() => {
                    const t = newTagInput.trim();
                    if (t && !currentItem.tags.includes(t)) {
                      updateCurrentItem({ tags: [...currentItem.tags, t] });
                    }
                    setNewTagInput('');
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.surface} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
                {currentItem.tags.map(tag => (
                  <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceBlue, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm }}>
                    <Text style={{ ...Typography.caption, color: Colors.accent }}>{tag}</Text>
                    <TouchableOpacity onPress={() => updateCurrentItem({ tags: currentItem.tags.filter(t => t !== tag) })}>
                      <Ionicons name="close-circle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.mainSaveButton}
              onPress={handleSave}
            >
              <MaterialCommunityIcons name="content-save-outline" size={24} color="#FFF" />
              <Text style={styles.mainSaveButtonText}>
                {draftItems.length > 1 ? `Save All ${draftItems.length} Items to Closet` : 'Save Item to Closet'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120, // Provides clearance for the save button to be scrolled into full view past the bottom bezel
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  
  // Photo Section
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoButtonSecondary: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
    padding: Spacing.md,
  },
  photoButtonText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  photoButtonSecondaryText: {
    ...Typography.body,
    color: Colors.primary,
    fontSize: 13,
  },
  imagePreviewContainer: {
    gap: Spacing.md,
  },
  thumbnailScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  thumbnailButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailButtonActive: {
    borderColor: Colors.accent,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  
  // Form Inputs
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
  },
  temperatureInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.xs,
  },
  temperatureSignButton: {
    width: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  temperatureSignButtonActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  temperatureSignText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  temperatureSignTextActive: {
    color: Colors.accent,
  },
  temperatureValueInput: {
    flex: 1,
  },
  
  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  categoryText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  
  // Season Grid
  seasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  seasonCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  seasonCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  seasonText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  seasonTextSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  tagInputField: {
    flex: 1,
    padding: Spacing.md,
    ...Typography.body,
  },
  tagAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
    minHeight: 48,
  },

  mainSaveButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  mainSaveButtonText: {
    ...Typography.headline,
    color: '#FFF',
    fontSize: 16,
  },
});
