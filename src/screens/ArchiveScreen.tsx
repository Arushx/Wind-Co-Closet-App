import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useOutfitContext, Outfit, SEASONS } from '../context/OutfitContext';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'most_worn', label: 'Most Worn' },
  { id: 'least_worn', label: 'Least Worn' },
  { id: 'favorites', label: 'Favorites' },
];

const OutfitCard = ({ outfit }: { outfit: Outfit }) => {
  const navigation = useNavigation<any>();
  const { updateOutfit } = useOutfitContext();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('OutfitDetails', { outfit })}
    >
      {/* 2x2 Image Grid */}
      <View style={styles.imageGrid}>
        <View style={styles.imageRow}>
          <Image source={{ uri: outfit.images[0] }} style={[styles.image, styles.imageTopLeft]} />
          <Image source={{ uri: outfit.images[1] }} style={[styles.image, styles.imageTopRight]} />
        </View>
        <View style={styles.imageRow}>
          <Image source={{ uri: outfit.images[2] }} style={[styles.image, styles.imageBottomLeft]} />
          <Image source={{ uri: outfit.images[3] }} style={[styles.image, styles.imageBottomRight]} />
        </View>
      </View>

      {/* Outfit Details */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.outfitName}>{outfit.name}</Text>
          <TouchableOpacity 
            onPress={() => updateOutfit({ ...outfit, isFavorite: !outfit.isFavorite })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={outfit.isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={outfit.isFavorite ? Colors.coral : Colors.textMuted} 
              style={{ marginLeft: Spacing.sm }} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.wornText}>Worn {outfit.timesWorn} times</Text>

        <View style={styles.tagsContainer}>
          <View style={[styles.tag, styles.seasonTag]}>
            <Text style={[styles.tagText, styles.seasonTagText]}>{outfit.season}</Text>
          </View>
          {outfit.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ArchiveScreen() {
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const { outfits, allTags: ALL_TAGS } = useOutfitContext();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredOutfits = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = outfits.filter(outfit => {
      // Check favorites sort filter
      if (sortBy === 'favorites' && !outfit.isFavorite) {
        return false;
      }

      // Check season filter
      if (selectedSeason && outfit.season !== selectedSeason) {
        return false;
      }
      // Check tags filter (outfit must contain ALL selected tags)
      if (selectedTags.length > 0 && !selectedTags.every(t => outfit.tags.includes(t))) {
        return false;
      }
      // Check query against name, season, tags, and pieces
      if (lowerQuery) {
        const matchesName = outfit.name.toLowerCase().includes(lowerQuery);
        const matchesSeason = outfit.season.toLowerCase().includes(lowerQuery);
        const matchesTags = outfit.tags.some(t => t.toLowerCase().includes(lowerQuery));
        const matchesPieces = outfit.pieces.some(p => p.toLowerCase().includes(lowerQuery));

        if (!matchesName && !matchesSeason && !matchesTags && !matchesPieces) {
          return false;
        }
      }
      return true;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      switch(sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_worn':
          return b.timesWorn - a.timesWorn;
        case 'least_worn':
          return a.timesWorn - b.timesWorn;
        case 'newest':
        case 'favorites': // For favorites, sort by newest as a default secondary sort
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  }, [outfits, selectedSeason, selectedTags, searchQuery, sortBy]);

  const activeFiltersCount = (selectedSeason ? 1 : 0) + selectedTags.length;
  const currentSortLabel = SORT_OPTIONS.find(opt => opt.id === sortBy)?.label || 'Newest';

  const renderSortChips = () => {
    if (!isSortVisible) return null;

    return (
      <View style={styles.sortContainer}>
        <Text style={styles.filterSectionTitle}>Sort By</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SORT_OPTIONS.map(option => {
            const isSelected = sortBy === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSortBy(option.id)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderFilterChips = () => {
    if (!isFiltersVisible) return null;

    return (
      <View style={styles.filtersContainer}>
        <Text style={styles.filterSectionTitle}>Seasons</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SEASONS.map(season => {
            const isSelected = selectedSeason === season;
            return (
              <TouchableOpacity
                key={season}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedSeason(isSelected ? null : season)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {season}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.filterSectionTitle, { marginTop: Spacing.md }]}>Tags</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {ALL_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Saved Outfits ({outfits.length})</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.filterButton, isSortVisible && styles.filterButtonActive]}
              onPress={() => setIsSortVisible(!isSortVisible)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="swap-vertical"
                size={18}
                color={isSortVisible ? Colors.surface : Colors.textSecondary}
              />
              <Text style={[styles.filterButtonText, isSortVisible && styles.filterButtonTextActive]}>
                Sort
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, isFiltersVisible && styles.filterButtonActive]}
              onPress={() => setIsFiltersVisible(!isFiltersVisible)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFiltersVisible ? 'options' : 'options-outline'}
                size={18}
                color={isFiltersVisible ? Colors.surface : Colors.textSecondary}
              />
              <Text style={[styles.filterButtonText, isFiltersVisible && styles.filterButtonTextActive]}>
                Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits or pieces..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {renderSortChips()}
          {renderFilterChips()}

          {filteredOutfits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No outfits match your search.</Text>
            </View>
          ) : (
            filteredOutfits.map(outfit => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.largeTitle,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: Colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    marginLeft: Spacing.sm,
    color: Colors.text,
    outlineStyle: 'none' as any,
  },
  list: {
    flex: 1,
  },
  sortContainer: {
    marginBottom: Spacing.lg,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.subhead,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  imageGrid: {
    height: 300,
    width: '100%',
    flexDirection: 'column',
  },
  imageRow: {
    flex: 1,
    flexDirection: 'row',
  },
  image: {
    flex: 1,
    height: 150, // explicit height for reliable remote loading
    borderWidth: 1,
    borderColor: Colors.surfaceWarm,
  },
  imageTopLeft: {
    borderTopLeftRadius: BorderRadius.xl,
  },
  imageTopRight: {
    borderTopRightRadius: BorderRadius.xl,
  },
  imageBottomLeft: {
    borderBottomLeftRadius: 0,
  },
  imageBottomRight: {
    borderBottomRightRadius: 0,
  },
  cardContent: {
    padding: Spacing.md,
  },
  outfitName: {
    ...Typography.headline,
  },
  wornText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surfaceWarm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  seasonTag: {
    backgroundColor: Colors.mintSoft,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  seasonTagText: {
    color: Colors.mint,
    fontWeight: '600',
  },
});
