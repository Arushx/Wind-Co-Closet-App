import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset } from '../context/ClosetContext';

type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories';
type ClothingStatus = 'clean' | 'dirty' | 'laundry';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface ItemDetailScreenProps {
  navigation: any;
  route: any;
}

export default function ItemDetailScreen({ navigation, route }: ItemDetailScreenProps) {
  const { item } = route.params;
  const { deleteItem } = useCloset();
  
  const [status, setStatus] = useState<ClothingStatus>(item.status);
  
  // These are now derived directly from the passed-in item props since this screen is read-only
  // If the user comes back from the edit screen, we want the most updated version from the closet context.
  const { items, categories } = useCloset();
  const currentItem = items.find(i => i.id === item.id) || item;

  const { name, brand, category, seasons: selectedSeasons } = currentItem;

  const getCategoryIcon = (cat: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const lower = cat.toLowerCase();
    if (lower === 'tops') return 'tshirt-crew';
    if (lower === 'bottoms') return 'hanger';
    if (lower === 'shoes') return 'shoe-sneaker';
    if (lower === 'accessories') return 'bag-personal';
    if (lower.includes('jacket') || lower.includes('coat')) return 'coat-rack';
    if (lower.includes('dress')) return 'hanger';
    if (lower.includes('hat')) return 'hat-fedora';
    return 'hanger';
  };

  const seasons: { key: Season; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'spring', label: 'Spring', icon: 'flower' },
    { key: 'summer', label: 'Summer', icon: 'white-balance-sunny' },
    { key: 'fall', label: 'Fall', icon: 'leaf' },
    { key: 'winter', label: 'Winter', icon: 'snowflake' },
  ];

  const statusOptions: ClothingStatus[] = ['clean', 'dirty', 'laundry'];

  const getStatusColor = (s: ClothingStatus) => {
    switch (s) {
      case 'clean': return Colors.clean;
      case 'dirty': return Colors.dirty;
      case 'laundry': return Colors.laundry;
    }
  };

  const getStatusBackground = (s: ClothingStatus) => {
    switch (s) {
      case 'clean': return Colors.mintSoft;
      case 'dirty': return Colors.amberSoft;
      case 'laundry': return Colors.coralSoft;
    }
  };

  const cycleStatus = () => {
    const currentIndex = statusOptions.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    setStatus(statusOptions[nextIndex]);
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
      if (confirmed) {
        deleteItem(item.id);
        navigation.goBack();
      }
    } else {
      Alert.alert(
        'Delete Item',
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteItem(item.id);
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddItem', { editItem: currentItem });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <TouchableOpacity onPress={handleEdit} style={styles.saveButton}>
            <Text style={styles.saveText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Item Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEM NAME</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BRAND</Text>
          <View style={styles.readOnlyField}>
            <Text style={[styles.readOnlyText, !brand && { color: Colors.textMuted }]}>
              {brand || 'No brand specified'}
            </Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <View style={styles.optionsGrid}>
            {categories.map(cat => (
              <View
                key={cat}
                style={[
                  styles.optionCard,
                  (category || '').toLowerCase() === cat.toLowerCase() && styles.optionCardActive
                ]}
              >
                <MaterialCommunityIcons 
                  name={getCategoryIcon(cat)}
                  size={24}
                  color={(category || '').toLowerCase() === cat.toLowerCase() ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[
                  styles.optionText,
                  (category || '').toLowerCase() === cat.toLowerCase() && styles.optionTextActive
                ]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATUS</Text>
          <TouchableOpacity 
            style={[styles.statusButton, { backgroundColor: getStatusBackground(status) }]}
            onPress={cycleStatus}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            <MaterialCommunityIcons 
              name="sync" 
              size={20} 
              color={getStatusColor(status)} 
            />
          </TouchableOpacity>
          <Text style={styles.helperText}>Tap to cycle between clean, dirty, and laundry</Text>
        </View>

        {/* Seasons */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SEASONS</Text>
          <View style={styles.seasonsGrid}>
            {seasons.map(season => (
              <View
                key={season.key}
                style={[
                  styles.seasonCard,
                  selectedSeasons.includes(season.key) && styles.seasonCardActive
                ]}
              >
                <MaterialCommunityIcons 
                  name={season.icon}
                  size={24}
                  color={selectedSeasons.includes(season.key) ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[
                  styles.seasonText,
                  selectedSeasons.includes(season.key) && styles.seasonTextActive
                ]}>
                  {season.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.laundry} />
          <Text style={styles.deleteButtonText}>Delete Item</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...Typography.headline,
    fontSize: 17,
  },
  saveButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveText: {
    ...Typography.headline,
    color: Colors.accent,
    fontSize: 16,
  },
  
  // Image
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceWarm,
    marginBottom: Spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  
  // Input
  input: {
    ...Typography.body,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  
  // Read Only Text
  readOnlyField: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyText: {
    ...Typography.body,
    color: Colors.text,
  },
  
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  optionText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  
  // Status
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusButtonText: {
    ...Typography.headline,
    fontSize: 16,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // Seasons
  seasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  seasonCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  seasonCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  seasonText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  seasonTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  
  // Delete Button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.coralSoft,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    ...Typography.headline,
    color: Colors.laundry,
    fontSize: 16,
  },
  
  bottomPadding: {
    height: Spacing.xxl,
  },
});
