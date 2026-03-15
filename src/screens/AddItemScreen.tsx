import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';
import jpeg from 'jpeg-js';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset } from '../context/ClosetContext';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

type DraftItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  selectedSeasons: Season[];
  imageUri: string;
  color: string;
  tags: string[];
  weatherRating: { minTemp: number, maxTemp: number };
};

interface AddItemScreenProps {
  navigation: any;
  route?: any;
}

export default function AddItemScreen({ navigation, route }: AddItemScreenProps) {
  const { items, categories, addItems, updateItem, addCategory, deleteCategory } = useCloset();
  
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTagInput, setNewTagInput] = useState('');
  const [minTempInput, setMinTempInput] = useState('10');
  const [maxTempInput, setMaxTempInput] = useState('25');
  const [minTempNegative, setMinTempNegative] = useState(false);
  const [maxTempNegative, setMaxTempNegative] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  const currentItem = draftItems[currentIndex] || null;

  useEffect(() => {
    if (route?.params?.editItem) {
      const editItem = route.params.editItem;
      setDraftItems([{
        id: editItem.id,
        name: editItem.name,
        brand: editItem.brand || '',
        category: editItem.category,
        selectedSeasons: editItem.seasons || [],
        imageUri: editItem.imageUrl,
        color: editItem.color,
        tags: editItem.tags || [],
        weatherRating: editItem.weatherRating || { minTemp: 10, maxTemp: 25 },
      }]);
    }
  }, [route?.params?.editItem]);

  const normalizeTemperature = (value: string) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  };

  useEffect(() => {
    if (!currentItem) return;
    setMinTempInput(String(Math.abs(currentItem.weatherRating.minTemp)));
    setMaxTempInput(String(Math.abs(currentItem.weatherRating.maxTemp)));
  }, [currentIndex, currentItem?.id]);

  const getCategoryIcon = (category: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const lower = category.toLowerCase();
    if (lower === 'tops') return 'tshirt-crew';
    if (lower === 'bottoms') return 'hanger';
    if (lower === 'shoes') return 'shoe-sneaker';
    if (lower === 'accessories') return 'bag-personal';
    return 'tag-multiple';
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
        Alert.alert('Duplicate Category', 'A category with this name already exists.');
        return;
      }
      addCategory(trimmed);
      if (currentItem) updateCurrentItem({ category: trimmed });
      setNewCategoryName('');
      setIsCategoryModalVisible(false);
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (category.toLowerCase() === 'tops' || category.toLowerCase() === 'bottoms' || category.toLowerCase() === 'shoes' || category.toLowerCase() === 'accessories') {
       Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
       return;
    }
    const hasItems = items.some(item => item.category.toLowerCase() === category.toLowerCase());
    if (hasItems) {
      Alert.alert('Cannot Delete', `There are items in the ${category} category. Please move or delete them before deleting the category.`);
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the "${category}" category?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
           deleteCategory(category);
           if (currentItem?.category === category) {
             updateCurrentItem({ category: categories[0] || 'Tops' });
           }
        }}
      ]
    );
  };

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

  const PRESET_COLORS = [
    '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00', 
    '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', 
    '#8E8E93', '#A2845E', '#E5E5EA', '#00205B', '#3B5998'
  ];

  const getDominantColor = async (uri: string): Promise<string> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 50, height: 50 } }], // small size for speed
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      if (!manipResult.base64) return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
      
      const buffer = Buffer.from(manipResult.base64, 'base64');
      const rawImageData = jpeg.decode(buffer, { useTArray: true });
      const pixels = rawImageData.data;
      
      const colorCounts: Record<string, number> = {};
      let maxCount = 0;
      let dominantRGB = [204, 204, 204]; // Default slightly gray
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];
        const a = pixels[i+3];

        if (a < 125) continue; // Skip transparency

        // Skip bright whites or deep blacks (typical backdrops/shadows)
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 25 && g < 25 && b < 25) continue;

        // Group very similar shades (quantize to steps of 16)
        const rQ = Math.round(r / 16) * 16;
        const gQ = Math.round(g / 16) * 16;
        const bQ = Math.round(b / 16) * 16;
        
        const key = `${rQ},${gQ},${bQ}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;

        if (colorCounts[key] > maxCount) {
          maxCount = colorCounts[key];
          dominantRGB = [rQ, gQ, bQ];
        }
      }

      const toHex = (c: number) => {
        const hex = Math.min(255, Math.max(0, c)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(dominantRGB[0])}${toHex(dominantRGB[1])}${toHex(dominantRGB[2])}`.toUpperCase();
    } catch (error) {
      console.warn('Failed JS color extraction, falling back to random', error);
      return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    }
  };

  const processImage = async (uri: string) => {
    try {
      const extractedColor = await getDominantColor(uri);

      const item: DraftItem = {
        id: Date.now().toString(),
        name: '',
        brand: '',
        category: categories.length > 0 ? categories[0] : 'Tops',
        selectedSeasons: ['spring', 'summer', 'fall', 'winter'],
        imageUri: uri,
        color: extractedColor,
        tags: [],
        weatherRating: { minTemp: 10, maxTemp: 25 },
      };
      setDraftItems(prev => [...prev, item]);
      setCurrentIndex(draftItems.length); // Switch to the newly added item
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
      allowsEditing: false, 
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
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (draftItems.length === 0) return;

    const normalizedMin = normalizeTemperature(minTempInput);
    let normalizedMax = normalizeTemperature(maxTempInput);
    if (normalizedMax < normalizedMin) {
      normalizedMax = normalizedMin;
    }

    const newClothingItems = draftItems.map((item, index) => {
      const weatherRating = index === currentIndex
        ? { minTemp: normalizedMin, maxTemp: normalizedMax }
        : item.weatherRating;
      const defaultName = `New ${item.category.charAt(0).toUpperCase() + item.category.slice(1)} ${Date.now().toString().slice(-4) + index}`;
      return {
        id: item.id,
        name: item.name.trim() || defaultName,
        brand: item.brand.trim(),
        category: item.category,
        color: item.color || '#CCCCCC',
        weatherRating,
        status: 'clean' as const,
        imageUrl: item.imageUri,
        seasons: item.selectedSeasons,
        tags: item.tags,
      };
    });

    if (route?.params?.editItem) {
      // Edit Mode
      updateItem(route.params.editItem.id, {
        name: newClothingItems[0].name,
        brand: newClothingItems[0].brand,
        category: newClothingItems[0].category,
        color: newClothingItems[0].color,
        weatherRating: newClothingItems[0].weatherRating,
        imageUrl: newClothingItems[0].imageUrl,
        seasons: newClothingItems[0].seasons,
        tags: newClothingItems[0].tags,
      });
    } else {
      // Check for duplicates only on new add
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
    }

    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowToast(false);
      
      if (route?.params?.editItem) {
        // Go back to the ItemDetail wrapper after edit
        navigation.goBack();
      } else {
        navigation.goBack();
      }
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <Text style={styles.sectionTitle}>Category *</Text>
                <TouchableOpacity onPress={() => setIsCategoryModalVisible(true)}>
                  <Text style={{ ...Typography.subhead, color: Colors.primary, fontWeight: '600' }}>+ New Category</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryCard,
                      (currentItem.category || '').toLowerCase() === cat.toLowerCase() && styles.categoryCardSelected,
                    ]}
                    onPress={() => updateCurrentItem({ category: cat })}
                    onLongPress={() => handleDeleteCategory(cat)}
                    delayLongPress={500}
                  >
                    <MaterialCommunityIcons
                      name={getCategoryIcon(cat)}
                      size={28}
                      color={(currentItem.category || '').toLowerCase() === cat.toLowerCase() ? Colors.accent : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        (currentItem.category || '').toLowerCase() === cat.toLowerCase() && styles.categoryTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                <Text style={styles.sectionSubtitle}>Tap a preset below to set the item's color.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: currentItem.color, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm }} />
                  <Text style={{ ...Typography.body, color: Colors.text }}>{currentItem.color.toUpperCase()}</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.xs }}>
                  {PRESET_COLORS.map(colorHex => (
                    <TouchableOpacity
                      key={colorHex}
                      style={{
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: colorHex, 
                        borderWidth: currentItem.color === colorHex ? 3 : 1,
                        borderColor: currentItem.color === colorHex ? Colors.primary : Colors.border,
                        ...Shadows.card
                      }}
                      onPress={() => updateCurrentItem({ color: colorHex })}
                    />
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text style={styles.label}>Weather Rating (°C)</Text>
                <Text style={styles.sectionSubtitle}>Ideal temperature range for this item</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                  <View style={styles.temperatureInputGroup}>
                    <TextInput
                      style={[styles.input, styles.temperatureValueInput, { borderTopLeftRadius: BorderRadius.md, borderBottomLeftRadius: BorderRadius.md }]}
                      keyboardType="numeric"
                      value={minTempInput}
                      onChangeText={(val) => {
                        if (/^\d*$/.test(val)) setMinTempInput(val);
                      }}
                      onEndEditing={() => {
                        const newMin = normalizeTemperature(minTempInput);
                        const currentMax = normalizeTemperature(maxTempInput);
                        const newMax = newMin > currentMax ? newMin : currentMax;
                        
                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            minTemp: newMin,
                            maxTemp: newMax,
                          },
                        });
                        setMinTempInput(String(newMin));
                        setMaxTempInput(String(newMax));
                      }}
                      placeholder="Min"
                    />
                  </View>
                  <Text style={{ ...Typography.body, color: Colors.textMuted }}>to</Text>
                  <View style={styles.temperatureInputGroup}>
                    <TextInput
                      style={[styles.input, styles.temperatureValueInput, { borderTopLeftRadius: BorderRadius.md, borderBottomLeftRadius: BorderRadius.md }]}
                      keyboardType="numeric"
                      value={maxTempInput}
                      onChangeText={(val) => {
                        if (/^\d*$/.test(val)) setMaxTempInput(val);
                      }}
                      onEndEditing={() => {
                        let newMax = normalizeTemperature(maxTempInput);
                        const currentMin = normalizeTemperature(minTempInput);
                        if (newMax < currentMin) newMax = currentMin;

                        updateCurrentItem({
                          weatherRating: {
                            ...currentItem.weatherRating,
                            maxTemp: newMax,
                          },
                        });
                        setMaxTempInput(String(newMax));
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
                {route?.params?.editItem 
                  ? 'Save Changes' 
                  : draftItems.length > 1 
                    ? `Save All ${draftItems.length} Items to Closet` 
                    : 'Save Item to Closet'
                }
              </Text>
            </TouchableOpacity>
          </>
        )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* New Category Modal */}
      {isCategoryModalVisible && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => { setIsCategoryModalVisible(false); setNewCategoryName(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="e.g. Dresses, Outerwear..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateCategory}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]} 
                onPress={() => { setIsCategoryModalVisible(false); setNewCategoryName(''); }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleCreateCategory}>
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

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
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.headline,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalInput: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonText: {
    ...Typography.headline,
    color: '#FFF',
  },
  modalButtonSecondaryText: {
    ...Typography.headline,
    color: Colors.textSecondary,
  },
});
