import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset, ClothingItem } from '../context/ClosetContext';

type ClothingCategory = 'all' | 'tops' | 'bottoms' | 'shoes' | 'accessories';
type ClothingStatus = 'clean' | 'dirty' | 'laundry';

interface ClosetScreenProps {
  navigation: any;
}

export default function ClosetScreen({ navigation }: ClosetScreenProps) {
  const { items } = useCloset();
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('all');
  const [selectedSeason, setSelectedSeason] = useState<'all' | 'spring' | 'summer' | 'fall' | 'winter'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => (item.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [items]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const categories: { key: ClothingCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'view-grid' },
    { key: 'tops', label: 'Tops', icon: 'tshirt-crew' },
    { key: 'bottoms', label: 'Bottoms', icon: 'hanger' },
    { key: 'shoes', label: 'Shoes', icon: 'shoe-sneaker' },
    { key: 'accessories', label: 'Accessories', icon: 'bag-personal' },
  ];

  const seasons: { key: 'all' | 'spring' | 'summer' | 'fall' | 'winter'; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'all', label: 'All Weather', icon: 'cloud' },
    { key: 'spring', label: 'Spring', icon: 'flower' },
    { key: 'summer', label: 'Summer', icon: 'white-balance-sunny' },
    { key: 'fall', label: 'Fall', icon: 'leaf' },
    { key: 'winter', label: 'Winter', icon: 'snowflake' },
  ];

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const seasonMatch = selectedSeason === 'all' || (item.seasons && item.seasons.includes(selectedSeason));
      const tagMatch = selectedTag === 'all' || (item.tags && item.tags.includes(selectedTag));
      return categoryMatch && seasonMatch && tagMatch;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q))
      );
      // Sort by relevance: name match first, then brand, then rest
      result.sort((a, b) => {
        const aName = a.name.toLowerCase().includes(q) ? 0 : 1;
        const bName = b.name.toLowerCase().includes(q) ? 0 : 1;
        if (aName !== bName) return aName - bName;
        const aBrand = a.brand.toLowerCase().includes(q) ? 0 : 1;
        const bBrand = b.brand.toLowerCase().includes(q) ? 0 : 1;
        return aBrand - bBrand;
      });
    }

    return result;
  }, [items, selectedCategory, selectedSeason, selectedTag, searchQuery]);

  const getStatusColor = (status: ClothingStatus) => {
    switch (status) {
      case 'clean': return Colors.clean;
      case 'dirty': return Colors.dirty;
      case 'laundry': return Colors.laundry;
    }
  };

  const getStatusBackground = (status: ClothingStatus) => {
    switch (status) {
      case 'clean': return Colors.mintSoft;
      case 'dirty': return Colors.amberSoft;
      case 'laundry': return Colors.coralSoft;
    }
  };

  const renderClothingItem = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    >
      <View style={[styles.itemImageContainer, { backgroundColor: item.color }]}>
        <Image 
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="hanger" size={80} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>Your closet is empty</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'all' 
          ? 'Add your first clothing item to get started' 
          : `No ${selectedCategory} items found`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Closet</Text>
          <Text style={styles.itemCount}>{filteredItems.length} items</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, brand, or tag..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                selectedCategory === category.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={category.icon}
                size={20}
                color={selectedCategory === category.key ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.key && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Season Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {seasons.map(season => (
            <TouchableOpacity
              key={season.key}
              style={[
                styles.categoryButton,
                selectedSeason === season.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedSeason(season.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={season.icon}
                size={20}
                color={selectedSeason === season.key ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                selectedSeason === season.key && styles.categoryTextActive
              ]}>
                {season.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedTag === 'all' && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedTag('all')}
              activeOpacity={0.7}
            >
              <Ionicons name="pricetag" size={16} color={selectedTag === 'all' ? Colors.accent : Colors.textSecondary} />
              <Text style={[
                styles.categoryText,
                selectedTag === 'all' && styles.categoryTextActive
              ]}>All Tags</Text>
            </TouchableOpacity>
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.categoryButton,
                  selectedTag === tag && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryText,
                  selectedTag === tag && styles.categoryTextActive
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Items Grid */}
        <FlatList
          style={{ flex: 1 }}
          data={filteredItems}
          renderItem={renderClothingItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={filteredItems.length > 0 ? styles.row : undefined}
          contentContainerStyle={[styles.listContent, filteredItems.length === 0 && styles.listContentEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        />

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddItem')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
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
    paddingTop: Spacing.lg 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: { 
    ...Typography.largeTitle 
  },
  itemCount: {
    ...Typography.subhead,
    color: Colors.textMuted,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    fontSize: 14,
  },

  // Categories
  categoriesContainer: {
    marginBottom: Spacing.md,
    flexGrow: 0,
    minHeight: 40,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  categoryText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  
  // Items Grid
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  itemCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  itemImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceWarm,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    padding: Spacing.md,
  },
  itemName: {
    ...Typography.headline,
    fontSize: 15,
    marginBottom: Spacing.xs / 2,
  },
  itemBrand: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs / 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
});
