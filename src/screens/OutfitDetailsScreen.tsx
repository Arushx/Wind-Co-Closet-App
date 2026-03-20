import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, useWindowDimensions, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useOutfitContext, Outfit, SEASONS, DEFAULT_WEAR_EVENT, formatWearDate, parseWearDate } from '../context/OutfitContext';
import { useLocationSearch } from '../hooks/useLocationSearch';

const mergeAudienceInput = (audiences: string[], pendingInput: string) => {
  const trimmed = pendingInput.trim();
  if (!trimmed || audiences.includes(trimmed)) return audiences;
  return [...audiences, trimmed];
};

export default function OutfitDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLogWearModalVisible, setIsLogWearModalVisible] = useState(false);
  
  const { outfits, updateOutfit, deleteOutfit, allTags, allEvents, allAudiences, eventDefaultAudiences, updateEventDefaults } = useOutfitContext();

  // Cast the route parameters to our expected shape.
  const routeOutfit = (route.params as { outfit: Outfit }).outfit;
  const outfit = outfits.find(o => o.id === routeOutfit.id) || routeOutfit;

  const [editedSeason, setEditedSeason] = useState(outfit.season);
  const [editedTags, setEditedTags] = useState<string[]>(outfit.tags);
  const [newTagInput, setNewTagInput] = useState('');

  const openEditModal = () => {
    setIsEditModalVisible(false); // Make sure this is closed if it somehow opens
    navigation.navigate('OutfitBuilderTab', { 
      editOutfit: outfit 
    });
  };

  const handleSaveEdit = () => {
    updateOutfit({ ...outfit, season: editedSeason, tags: editedTags });
    setIsEditModalVisible(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteOutfit(outfit.id);
            navigation.goBack();
          } 
        }
      ]
    );
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    const exists = editedTags.some(existing => existing.toLowerCase() === trimmed.toLowerCase());
    if (trimmed && !exists) {
      setEditedTags([...editedTags, trimmed]);
    }
    setNewTagInput('');
  };

  const mostUsedUnusedTags = useMemo(() => {
    const usage = new Map<string, number>();

    outfits.forEach(o => {
      o.tags.forEach(tag => {
        usage.set(tag, (usage.get(tag) || 0) + 1);
      });
    });

    return allTags
      .filter(tag => !editedTags.includes(tag))
      .sort((a, b) => {
        const countDiff = (usage.get(b) || 0) - (usage.get(a) || 0);
        if (countDiff !== 0) return countDiff;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [outfits, allTags, editedTags]);

  const filteredUnusedTags = useMemo(() => {
    const q = newTagInput.trim().toLowerCase();
    if (!q) return mostUsedUnusedTags;

    return allTags
      .filter(tag => !editedTags.includes(tag) && tag.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8);
  }, [newTagInput, allTags, editedTags, mostUsedUnusedTags]);

  const canCreateTypedTag = useMemo(() => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return false;

    const lower = trimmed.toLowerCase();
    const alreadyUsed = editedTags.some(tag => tag.toLowerCase() === lower);
    const existsInAllTags = allTags.some(tag => tag.toLowerCase() === lower);
    return !alreadyUsed && !existsInAllTags;
  }, [newTagInput, editedTags, allTags]);

  const removeTag = (tag: string) => {
    setEditedTags(editedTags.filter(t => t !== tag));
  };

  // --- Log Wear State ---
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [logPickerKey, setLogPickerKey] = useState(0);
  const [logEvent, setLogEvent] = useState('');
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [logAudiences, setLogAudiences] = useState<string[]>([]);
  const [logAudienceInput, setLogAudienceInput] = useState('');
  const [logNotes, setLogNotes] = useState('');
  
  const { 
    query: logLocation, 
    setQuery: setLogLocation, 
    suggestions: locationSuggestions, 
    isLoading: isLocationLoading, 
    clearSuggestions: clearLocationSuggestions 
  } = useLocationSearch();

  const [saveAsDefaultAudience, setSaveAsDefaultAudience] = useState(false);

  const openLogWearModal = () => {
    setLogDate(new Date());
    setLogEvent('');
    setLogAudiences([]);
    setLogAudienceInput('');
    setLogNotes('');
    setLogLocation('');
    clearLocationSuggestions();
    setSaveAsDefaultAudience(false);
    setIsLogWearModalVisible(true);
  };

  const handleEventChange = (text: string) => {
    setLogEvent(text);
    // Auto-fill audiences if we have a default mapping
    if (eventDefaultAudiences[text]) {
      const mergedAudiences = Array.from(new Set([...logAudiences, ...eventDefaultAudiences[text]]));
      setLogAudiences(mergedAudiences);
    }
  };

  const addLogAudience = (audience: string) => {
    const trimmed = audience.trim();
    if (trimmed && !logAudiences.includes(trimmed)) {
      setLogAudiences([...logAudiences, trimmed]);
    }
    setLogAudienceInput('');
  };

  const removeLogAudience = (audience: string) => {
    setLogAudiences(logAudiences.filter(a => a !== audience));
  };

  const handleSaveLogWear = () => {
    const finalizedAudiences = mergeAudienceInput(logAudiences, logAudienceInput);

    const newHistoryItem = {
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: formatWearDate(logDate),
      event: logEvent.trim() || DEFAULT_WEAR_EVENT,
      audiences: finalizedAudiences,
      notes: logNotes.trim() === '' ? undefined : logNotes.trim(),
      location: logLocation.trim() === '' ? undefined : logLocation.trim(),
    };

    if (saveAsDefaultAudience && logEvent.trim()) {
      updateEventDefaults(logEvent.trim(), finalizedAudiences);
    }

    updateOutfit({
      ...outfit,
      timesWorn: outfit.timesWorn + 1,
      wearHistory: [newHistoryItem, ...(outfit.wearHistory || [])]
    });
    
    setIsLogWearModalVisible(false);
  };

  // Calculate image width so they look nice (2 columns or 1 column based on screen size, 
  // but since we want to show clothing pieces clearly, large almost full-width images might be better
  // or a 2-column masonry grid. Let's do a vertical feed of large images since they represent distinct pieces.)
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}>
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title} numberOfLines={1}>{outfit.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity 
              onPress={confirmDelete} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.coral} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={openEditModal} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Outfit Info */}
        <View style={styles.infoSection}>
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.favoriteBadge, !outfit.isFavorite && { backgroundColor: Colors.surfaceWarm }]}
              onPress={() => updateOutfit({ ...outfit, isFavorite: !outfit.isFavorite })}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={outfit.isFavorite ? "heart" : "heart-outline"} 
                size={16} 
                color={outfit.isFavorite ? Colors.coral : Colors.textSecondary} 
              />
              <Text style={[styles.favoriteText, !outfit.isFavorite && { color: Colors.textSecondary }]}>
                {outfit.isFavorite ? "Favorited" : "Favorite"}
              </Text>
            </TouchableOpacity>
             <TouchableOpacity 
              style={styles.historyButton} 
              activeOpacity={0.7}
              onPress={() => setIsHistoryModalVisible(true)}
            >
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.historyButtonText}>View Wear History ({outfit.timesWorn})</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

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

          {/* Log Wear Trigger */}
          <View style={{ marginTop: Spacing.xl }}>
            <TouchableOpacity style={styles.logWearButton} onPress={openLogWearModal} activeOpacity={0.8}>
              <Ionicons name="add-circle" size={24} color={Colors.surface} />
              <Text style={styles.logWearButtonText}>Log an Outfit Wear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pieces List */}
        <View style={styles.piecesSection}>
          <Text style={styles.sectionTitle}>Clothing Pieces</Text>
          
          <View style={styles.grid}>
            {outfit.pieces.map((piece, index) => {
              const imageUrl = outfit.images[index];
              return (
                <View key={index} style={styles.pieceCard}>
                  <View style={styles.pieceImageContainer}>
                    <Image source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl} style={styles.pieceImage} resizeMode="contain" />
                  </View>
                  <View style={styles.pieceLabelContainer}>
                    <Text style={styles.pieceLabel} numberOfLines={2}>{piece}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Wear History Modal */}
      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wear History</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setIsHistoryModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {outfit.wearHistory && outfit.wearHistory.length > 0 ? (
              outfit.wearHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Ionicons name="calendar" size={20} color={Colors.primarySoft} />
                    <Text style={styles.historyDate}>
                      {parseWearDate(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.historyEvent}>{item.event}</Text>
                  {item.location && (
                    <View style={styles.historyLocationRow}>
                      <Ionicons name="location" size={14} color={Colors.textSecondary} />
                      <Text style={styles.historyLocationText}>{item.location}</Text>
                    </View>
                  )}
                  <View style={styles.historyAudiences}>
                    <Text style={styles.historyAudienceLabel}>Seen by:</Text>
                    {item.audiences.map((audience, idx) => (
                      <View key={idx} style={styles.audienceTag}>
                        <Text style={styles.audienceTagText}>{audience}</Text>
                      </View>
                    ))}
                  </View>
                  {item.notes && item.notes.length > 0 && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                <Text style={{ ...Typography.body, color: Colors.textMuted }}>No history recorded yet.</Text>
              </View>
            )}
            {outfit.wearHistory.length < outfit.timesWorn && (
              <Text style={styles.historyDisclaimer}>
                Showing recent recorded wears ({outfit.wearHistory.length} out of {outfit.timesWorn}).
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalActionTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Outfit</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalActionTextSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalScrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Season Editor */}
            <Text style={styles.editSectionTitle}>Season</Text>
            <View style={styles.editChipsRow}>
              {SEASONS.map((season) => {
                const isSelected = editedSeason === season;
                return (
                  <TouchableOpacity
                    key={season}
                    style={[styles.editChip, isSelected && styles.editChipSelected]}
                    onPress={() => setEditedSeason(season)}
                  >
                    <Text style={[styles.editChipText, isSelected && styles.editChipTextSelected]}>
                      {season}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tags Editor */}
            <Text style={styles.editSectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="e.g. picnic, hangout"
                placeholderTextColor={Colors.textMuted}
                value={newTagInput}
                onChangeText={setNewTagInput}
                onSubmitEditing={() => addTag(newTagInput)}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.tagHintText}>Search existing tags or type to create a new one.</Text>

            {(filteredUnusedTags.length > 0 || canCreateTypedTag) && (
              <View style={styles.tagDropdown}>
                {canCreateTypedTag && (
                  <TouchableOpacity style={styles.tagDropdownItem} onPress={() => addTag(newTagInput)}>
                    <Ionicons name="add-circle-outline" size={16} color={Colors.accent} />
                    <Text style={styles.tagDropdownText}>Use "{newTagInput.trim()}"</Text>
                  </TouchableOpacity>
                )}

                {filteredUnusedTags.map((tag) => (
                  <TouchableOpacity key={tag} style={styles.tagDropdownItem} onPress={() => addTag(tag)}>
                    <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.tagDropdownText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Currently Applied Tags */}
            <View style={styles.editChipsRow}>
              {editedTags.map((tag) => (
                <View key={tag} style={styles.appliedTagChip}>
                  <Text style={styles.appliedTagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Suggested Tags */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.editSectionSubtitle}>Most Used Presets (Tap to add)</Text>
              <View style={styles.editChipsRow}>
                {mostUsedUnusedTags.map((tag) => (
                  <TouchableOpacity key={tag} style={styles.suggestedTagChip} onPress={() => addTag(tag)}>
                    <Ionicons name="add" size={14} color={Colors.primary} style={{ marginRight: 2 }} />
                    <Text style={styles.suggestedTagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Log Wear Modal */}
      <Modal
        visible={isLogWearModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsLogWearModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsLogWearModalVisible(false)}>
              <Text style={styles.modalActionTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Outfit Wear</Text>
            <TouchableOpacity onPress={handleSaveLogWear}>
              <Text style={styles.modalActionTextSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalScrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
              {/* Date Editor */}
            <View style={{ marginBottom: Spacing.md, alignSelf: 'flex-start' }}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  key={`log-${logPickerKey}`}
                  value={logDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setLogPickerKey(prev => prev + 1);
                    if (selectedDate && event.type === 'set') {
                      setLogDate(selectedDate);
                    }
                  }}
                  themeVariant="light"
                  style={{ marginLeft: -10 }} 
                />
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => setShowAndroidPicker(true)} 
                    style={{ backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border }}
                  >
                    <Text style={{ ...Typography.body }}>{logDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  {showAndroidPicker && (
                    <DateTimePicker
                      value={logDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowAndroidPicker(false);
                        if (selectedDate && event.type === 'set') {
                          setLogDate(selectedDate);
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>

            {/* Event Name */}
            <Text style={styles.editSectionTitle}>Event</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder={DEFAULT_WEAR_EVENT}
                placeholderTextColor={Colors.textMuted}
                value={logEvent}
                onChangeText={handleEventChange}
                returnKeyType="done"
              />
            </View>
            
            {/* Event Suggestions */}
            {allEvents.length > 0 && !logEvent && (
              <View style={[styles.editChipsRow, { marginBottom: Spacing.md }]}>
                {allEvents.map((eventOption) => (
                  <TouchableOpacity 
                    key={eventOption} 
                    style={styles.suggestedTagChip} 
                    onPress={() => handleEventChange(eventOption)}
                  >
                    <Text style={styles.suggestedTagText}>{eventOption}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Audiences Input */}
            <Text style={styles.editSectionTitle}>Audiences Seen By</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="e.g. Sarah, Co-workers..."
                placeholderTextColor={Colors.textMuted}
                value={logAudienceInput}
                onChangeText={setLogAudienceInput}
                onSubmitEditing={() => addLogAudience(logAudienceInput)}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={() => addLogAudience(logAudienceInput)}>
                <Ionicons name="add" size={20} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            {/* Currently Applied Audiences */}
            <View style={[styles.editChipsRow, { marginBottom: Spacing.sm }]}>
              {logAudiences.map((audience) => (
                <View key={audience} style={styles.appliedTagChip}>
                  <Text style={styles.appliedTagText}>{audience}</Text>
                  <TouchableOpacity onPress={() => removeLogAudience(audience)}>
                    <Ionicons name="close-circle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Audience Suggestions */}
            {allAudiences.filter(a => !logAudiences.includes(a)).length > 0 && (
              <View style={[styles.editChipsRow, { marginBottom: Spacing.md }]}>
                {allAudiences.filter((a) => !logAudiences.includes(a)).map((audience) => (
                  <TouchableOpacity key={audience} style={styles.suggestedTagChip} onPress={() => addLogAudience(audience)}>
                    <Ionicons name="add" size={14} color={Colors.primary} style={{ marginRight: 2 }} />
                    <Text style={styles.suggestedTagText}>{audience}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Save as Default Checkbox */}
            {logEvent.trim() !== '' && (
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setSaveAsDefaultAudience(!saveAsDefaultAudience)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={saveAsDefaultAudience ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={saveAsDefaultAudience ? Colors.primary : Colors.textMuted} 
                />
                <Text style={styles.checkboxLabel}>Always apply these audiences to this event</Text>
              </TouchableOpacity>
            )}

            {/* Optional Location */}
            <Text style={styles.editSectionTitle}>Location (Optional)</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="e.g. Central Park, The Office, Paris..."
                placeholderTextColor={Colors.textMuted}
                value={logLocation}
                onChangeText={setLogLocation}
                returnKeyType="done"
              />
            </View>

            {/* Location Suggestions Dropdown */}
            {isLocationLoading && (
              <Text style={styles.locationLoadingText}>Searching...</Text>
            )}
            {!isLocationLoading && locationSuggestions.length > 0 && (
              <View style={styles.locationSuggestionsContainer}>
                {locationSuggestions.map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion.place_id} 
                    style={styles.locationSuggestionItem}
                    onPress={() => {
                      setLogLocation(suggestion.display_name);
                      clearLocationSuggestions();
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.locationSuggestionText}>{suggestion.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Optional Notes */}
            <Text style={styles.editSectionTitle}>Notes (Optional)</Text>
            <View style={[styles.tagInputContainer, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.tagInput, { minHeight: 80, paddingTop: Spacing.sm }]}
                placeholder="Any special memories or comments..."
                placeholderTextColor={Colors.textMuted}
                value={logNotes}
                onChangeText={setLogNotes}
                multiline={true}
                returnKeyType="default"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.coralSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  favoriteText: {
    ...Typography.caption,
    color: Colors.coral,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  historyButtonText: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surfaceWarm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  seasonTag: {
    backgroundColor: Colors.mintSoft,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  seasonTagText: {
    color: Colors.mint,
    fontWeight: '600',
  },
  piecesSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  pieceCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
    marginBottom: Spacing.sm,
  },
  pieceImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceWarm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  pieceLabelContainer: {
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pieceLabel: {
    ...Typography.subhead,
    color: Colors.text,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.title,
  },
  modalCloseButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  historyDate: {
    ...Typography.subhead,
    color: Colors.primarySoft,
    fontWeight: '600',
  },
  historyEvent: {
    ...Typography.headline,
    marginBottom: Spacing.sm,
  },
  historyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  historyLocationText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  historyAudiences: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  historyAudienceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  audienceTag: {
    backgroundColor: Colors.surfaceBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  audienceTagText: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '500',
  },
  historyDisclaimer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  modalActionTextCancel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    width: 60,
  },
  modalActionTextSave: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  editSectionTitle: {
    ...Typography.headline,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  editSectionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  editChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  editChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  editChipText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  editChipTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    outlineStyle: 'none' as any,
  },
  tagHintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tagDropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  tagDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  tagDropdownText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  tagAddButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWarm,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  appliedTagText: {
    ...Typography.caption,
    color: Colors.text,
  },
  locationLoadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  locationSuggestionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  locationSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  locationSuggestionText: {
    ...Typography.body,
    flex: 1,
    color: Colors.text,
  },
  suggestionsContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  suggestedTagText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  logWearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  logWearButtonText: {
    ...Typography.subhead,
    color: Colors.surface,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  checkboxLabel: {
    ...Typography.subhead,
    color: Colors.text,
    flex: 1,
  },
  historyNotes: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
  },
});
