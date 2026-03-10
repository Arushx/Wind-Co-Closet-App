import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal, ScrollView, Platform, TextInput, KeyboardAvoidingView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useOutfitContext, Outfit, WearHistoryItem } from '../context/OutfitContext';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Create a unified TimelineEvent that carries the parent outfit data
interface TimelineEvent extends WearHistoryItem {
  outfitId: string;
  outfitName: string;
  outfitImage: string;
}

export default function SocialLogScreen() {
  const { outfits, allEvents, allAudiences } = useOutfitContext();
  const navigation = useNavigation<any>();

  // Filter State
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Internal modal state for datetime pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Global Log Wear State
  const [isGlobalLogModalVisible, setIsGlobalLogModalVisible] = useState(false);
  const [logSelectedOutfitId, setLogSelectedOutfitId] = useState<string | null>(null);
  const [logDate, setLogDate] = useState<Date>(new Date());
  const [logEvent, setLogEvent] = useState('');
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
  const { updateOutfit, updateEventDefaults, eventDefaultAudiences } = useOutfitContext();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const openGlobalLogModal = () => {
    setLogSelectedOutfitId(null);
    setLogDate(new Date());
    setLogEvent('');
    setLogAudiences([]);
    setLogAudienceInput('');
    setLogNotes('');
    setLogLocation('');
    setSaveAsDefaultAudience(false);
    setIsGlobalLogModalVisible(true);
  };

  const handleGlobalEventChange = (text: string) => {
    setLogEvent(text);
    if (eventDefaultAudiences[text]) {
      const mergedAudiences = Array.from(new Set([...logAudiences, ...eventDefaultAudiences[text]]));
      setLogAudiences(mergedAudiences);
    }
  };

  const addGlobalLogAudience = (audience: string) => {
    const trimmed = audience.trim();
    if (trimmed && !logAudiences.includes(trimmed)) {
      setLogAudiences([...logAudiences, trimmed]);
    }
    setLogAudienceInput('');
  };

  const removeGlobalLogAudience = (audience: string) => {
    setLogAudiences(logAudiences.filter(a => a !== audience));
  };

  const handleSaveGlobalLog = () => {
    if (!logSelectedOutfitId) return;

    const targetOutfit = outfits.find(o => o.id === logSelectedOutfitId);
    if (!targetOutfit) return;

    const newHistoryItem = {
      id: `wh${Date.now()}`,
      date: logDate.toISOString().split('T')[0],
      event: logEvent || 'Everyday Outfit',
      audiences: logAudiences,
      notes: logNotes.trim() === '' ? undefined : logNotes.trim(),
      location: logLocation.trim() === '' ? undefined : logLocation.trim(),
    };

    if (saveAsDefaultAudience && logEvent.trim()) {
      updateEventDefaults(logEvent.trim(), logAudiences);
    }

    updateOutfit({
      ...targetOutfit,
      timesWorn: targetOutfit.timesWorn + 1,
      wearHistory: [newHistoryItem, ...(targetOutfit.wearHistory || [])]
    });
    
    setIsGlobalLogModalVisible(false);
  };

  // 1. Flatten all wear histories from every outfit into an array of TimelineEvents
  // 2. Filter based on active filter criteria
  // 3. Sort by date in descending order (newest first)
  const timelineEvents = useMemo(() => {
    let allEventsArr: TimelineEvent[] = [];
    outfits.forEach((outfit) => {
      if (outfit.wearHistory && outfit.wearHistory.length > 0) {
        outfit.wearHistory.forEach((wh) => {
          allEventsArr.push({
            ...wh,
            outfitId: outfit.id,
            outfitName: outfit.name,
            outfitImage: outfit.images[0] || 'https://via.placeholder.com/150',
          });
        });
      }
    });

    // Apply Filters
    if (selectedEvents.length > 0) {
      allEventsArr = allEventsArr.filter(e => selectedEvents.includes(e.event));
    }

    if (selectedAudiences.length > 0) {
      allEventsArr = allEventsArr.filter(e => 
        e.audiences && e.audiences.some(aud => selectedAudiences.includes(aud))
      );
    }

    if (startDate) {
      allEventsArr = allEventsArr.filter(e => {
        const d = new Date(e.date);
        d.setUTCHours(0, 0, 0, 0); // Normalize to start of day
        return d >= startDate;
      });
    }

    if (endDate) {
      allEventsArr = allEventsArr.filter(e => {
        const d = new Date(e.date);
        d.setUTCHours(0, 0, 0, 0); // Normalize to start of day
        return d <= endDate;
      });
    }

    return allEventsArr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [outfits, selectedEvents, selectedAudiences, startDate, endDate]);

  const toggleEventFilter = (event: string) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const toggleAudienceFilter = (audience: string) => {
    setSelectedAudiences(prev => 
      prev.includes(audience) ? prev.filter(a => a !== audience) : [...prev, audience]
    );
  };

  const clearFilters = () => {
    setSelectedEvents([]);
    setSelectedAudiences([]);
    setStartDate(null);
    setEndDate(null);
    setIsFilterModalVisible(false);
  };

  const activeFilterCount = selectedEvents.length + selectedAudiences.length + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const renderTimelineItem = ({ item, index }: { item: TimelineEvent; index: number }) => {
    // Format the date
    let dateStr = 'Unknown Date';
    try {
      const d = new Date(item.date);
      dateStr = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch(e) {}

    return (
      <View style={styles.timelineRow}>
        
        {/* Left Column: Visual Timeline Line & Node */}
        <View style={styles.timelineVisualCol}>
          {/* Top line segment - don't show above the first item */}
          <View style={[styles.timelineLine, { flex: 1, opacity: index === 0 ? 0 : 1 }]} />
          
          <View style={styles.timelineNode}>
            <View style={styles.timelineNodeInner} />
          </View>
          
          {/* Bottom line segment - don't show below the last item */}
          <View style={[styles.timelineLine, { flex: 4, opacity: index === timelineEvents.length - 1 ? 0 : 1 }]} />
        </View>

        {/* Right Column: Event Card */}
        <View style={styles.cardCol}>
          <Text style={styles.dateLabel}>{dateStr}</Text>
          
          <TouchableOpacity 
            style={styles.eventCard}
            onPress={() => navigation.navigate('ArchiveTab', { screen: 'OutfitDetails', params: { outfit: { id: item.outfitId } } })}
            activeOpacity={0.8}
          >
            {/* Header: Event Name */}
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={16} color={Colors.primarySoft} />
              <Text style={styles.eventName}>{item.event}</Text>
            </View>

            {item.location && (
              <View style={styles.timelineLocationRow}>
                <Ionicons name="location" size={14} color={Colors.textSecondary} />
                <Text style={styles.timelineLocationText}>{item.location}</Text>
              </View>
            )}

            {/* Content: Audiences + Outfit Snippet */}
            <View style={styles.cardBody}>
              
              {/* Audiences */}
              <View style={styles.audiencesContainer}>
                {item.audiences && item.audiences.length > 0 ? (
                  item.audiences.map((aud, i) => (
                    <View key={i} style={styles.audienceTag}>
                      <Text style={styles.audienceTagText}>{aud}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noAudienceText}>Personal</Text>
                )}
              </View>

              {/* Optional Notes */}
              {item.notes && item.notes.length > 0 && (
                <View style={styles.timelineNotesContainer}>
                  <Text style={styles.timelineNotesText} numberOfLines={3}>{item.notes}</Text>
                </View>
              )}

              {/* Outfit Preview Row */}
              <View style={styles.outfitPreviewRow}>
                <Image source={{ uri: item.outfitImage }} style={styles.outfitThumb} />
                <View style={styles.outfitInfoCol}>
                  <Text style={styles.outfitLabel}>Outfit Worn</Text>
                  <Text style={styles.outfitName} numberOfLines={1}>{item.outfitName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>

            </View>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Social Log</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]} 
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={activeFilterCount > 0 ? 'options' : 'options-outline'} 
              size={18} 
              color={activeFilterCount > 0 ? Colors.surface : Colors.textSecondary} 
            />
            <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
            onPress={openGlobalLogModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={Colors.surface} />
            <Text style={[styles.filterButtonTextActive, { fontWeight: '600' }]}>
              Log Wear
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={timelineEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptySub}>When you log an outfit wear, it will appear here in your timeline.</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters} style={styles.modalCloseButton}>
              <Text style={[styles.modalCloseText, { color: Colors.coral }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody} 
            contentContainerStyle={{ paddingBottom: Spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* Events Filter */}
            <Text style={styles.filterSectionTitle}>Events</Text>
            <View style={styles.filterChipsRow}>
              {allEvents.length === 0 ? (
                <Text style={styles.noFilterDataText}>No events logged yet.</Text>
              ) : (
                allEvents.map(event => {
                  const isSelected = selectedEvents.includes(event);
                  return (
                    <TouchableOpacity
                      key={event}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => toggleEventFilter(event)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{event}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Audiences Filter */}
            <Text style={styles.filterSectionTitle}>Audiences</Text>
            <View style={styles.filterChipsRow}>
              {allAudiences.length === 0 ? (
                <Text style={styles.noFilterDataText}>No audiences logged yet.</Text>
              ) : (
                allAudiences.map(audience => {
                  const isSelected = selectedAudiences.includes(audience);
                  return (
                    <TouchableOpacity
                      key={audience}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => toggleAudienceFilter(audience)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{audience}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Date Range Filter */}
            <Text style={styles.filterSectionTitle}>Date Range</Text>
            
            {/* Start Date */}
            <View style={styles.datePickerRow}>
              <Text style={styles.datePickerLabel}>Start Date</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (date) {
                      const normalized = new Date(date);
                      normalized.setUTCHours(0, 0, 0, 0);
                      setStartDate(normalized);
                    }
                  }}
                  style={styles.iosDatePicker}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.androidDateButton}>
                  <Text style={styles.androidDateText}>
                    {startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {showStartPicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (event.type === 'set' && date) {
                      const normalized = new Date(date);
                      normalized.setUTCHours(0, 0, 0, 0);
                      setStartDate(normalized);
                    }
                  }}
                />
              )}
            </View>

            {/* End Date */}
            <View style={styles.datePickerRow}>
              <Text style={styles.datePickerLabel}>End Date</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (date) {
                      const normalized = new Date(date);
                      normalized.setUTCHours(0, 0, 0, 0);
                      setEndDate(normalized);
                    }
                  }}
                  style={styles.iosDatePicker}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.androidDateButton}>
                  <Text style={styles.androidDateText}>
                    {endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {showEndPicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (event.type === 'set' && date) {
                      const normalized = new Date(date);
                      normalized.setUTCHours(0, 0, 0, 0);
                      setEndDate(normalized);
                    }
                  }}
                />
              )}
            </View>

          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.applyFiltersButton} 
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Show Results ({timelineEvents.length})</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Global Log Wear Modal */}
      <Modal
        visible={isGlobalLogModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsGlobalLogModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsGlobalLogModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log a Wear</Text>
            <TouchableOpacity 
              onPress={handleSaveGlobalLog} 
              style={styles.modalCloseButton}
              disabled={!logSelectedOutfitId}
            >
              <Text style={[styles.modalActionTextSave, !logSelectedOutfitId && { color: Colors.textMuted }]}>Save</Text>
            </TouchableOpacity>
          </View>

            <ScrollView 
              style={styles.modalBody} 
              contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 }} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
            
              {/* Outline Selection */}
            <Text style={styles.filterSectionTitle}>Which Outfit?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.md }}>
                {outfits.map(outfit => {
                  const isSelected = logSelectedOutfitId === outfit.id;
                  return (
                    <TouchableOpacity 
                      key={outfit.id} 
                      style={[styles.globalOutfitSelectCard, isSelected && styles.globalOutfitSelectCardActive]} 
                      onPress={() => setLogSelectedOutfitId(outfit.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: outfit.images[0] || 'https://via.placeholder.com/150' }} style={styles.globalOutfitSelectImage} />
                      <View style={styles.globalOutfitSelectLabelWrap}>
                        <Text style={[styles.globalOutfitSelectLabel, isSelected && { color: Colors.primary, fontWeight: '600' }]} numberOfLines={1}>{outfit.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {outfits.length === 0 && (
                  <Text style={styles.noFilterDataText}>You have no outfits in your closet to log!</Text>
                )}
              </View>
            </ScrollView>

            <View style={{ opacity: logSelectedOutfitId ? 1 : 0.4 }} pointerEvents={logSelectedOutfitId ? 'auto' : 'none'}>
              
              {/* Date Editor */}
              <Text style={styles.filterSectionTitle}>Date</Text>
              <View style={{ marginBottom: Spacing.md, alignSelf: 'flex-start' }}>
                <DateTimePicker
                  value={logDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setLogDate(selectedDate);
                  }}
                  themeVariant="light"
                  style={{ marginLeft: -10 }} 
                />
              </View>

              {/* Event Name */}
              <Text style={styles.filterSectionTitle}>Event</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="e.g. Birthday Dinner, Work Mtg..."
                  placeholderTextColor={Colors.textMuted}
                  value={logEvent}
                  onChangeText={handleGlobalEventChange}
                  returnKeyType="done"
                />
              </View>
              
              {/* Event Suggestions */}
              {allEvents.length > 0 && !logEvent && (
                <View style={[styles.filterChipsRow, { marginBottom: Spacing.md }]}>
                  {allEvents.map((eventOption) => (
                    <TouchableOpacity 
                      key={eventOption} 
                      style={styles.suggestedTagChip} 
                      onPress={() => handleGlobalEventChange(eventOption)}
                    >
                      <Text style={styles.suggestedTagText}>{eventOption}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Audiences Input */}
              <Text style={styles.filterSectionTitle}>Audiences Seen By</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="e.g. Sarah, Co-workers..."
                  placeholderTextColor={Colors.textMuted}
                  value={logAudienceInput}
                  onChangeText={setLogAudienceInput}
                  onSubmitEditing={() => addGlobalLogAudience(logAudienceInput)}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.tagAddButton} onPress={() => addGlobalLogAudience(logAudienceInput)}>
                  <Ionicons name="add" size={20} color={Colors.surface} />
                </TouchableOpacity>
              </View>

              {/* Currently Applied Audiences */}
              <View style={[styles.filterChipsRow, { marginBottom: Spacing.sm }]}>
                {logAudiences.map((audience) => (
                  <View key={audience} style={styles.appliedTagChip}>
                    <Text style={styles.appliedTagText}>{audience}</Text>
                    <TouchableOpacity onPress={() => removeGlobalLogAudience(audience)}>
                      <Ionicons name="close-circle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Audience Suggestions */}
              {allAudiences.filter(a => !logAudiences.includes(a)).length > 0 && (
                <View style={[styles.filterChipsRow, { marginBottom: Spacing.md }]}>
                  {allAudiences.filter((a) => !logAudiences.includes(a)).map((audience) => (
                    <TouchableOpacity key={audience} style={styles.suggestedTagChip} onPress={() => addGlobalLogAudience(audience)}>
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
              <Text style={styles.filterSectionTitle}>Location (Optional)</Text>
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
              <Text style={styles.filterSectionTitle}>Notes (Optional)</Text>
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

            </View>
            </ScrollView>

          </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    paddingHorizontal: Spacing.md,
  },
  
  // Timeline Row Layout
  timelineRow: {
    flexDirection: 'row',
  },
  timelineVisualCol: {
    width: 30,
    alignItems: 'center',
  },
  cardCol: {
    flex: 1,
    paddingBottom: Spacing.xl,
    paddingRight: Spacing.sm,
  },

  // Timeline Visuals
  timelineLine: {
    width: 2,
    backgroundColor: Colors.border,
  },
  timelineNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timelineNodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // Event Card
  dateLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventName: {
    ...Typography.headline,
    color: Colors.text,
    flex: 1,
  },
  cardBody: {
    // Gap doesn't work consistently across all RN versions inside standard Views, 
    // so we use margins on inner elements.
  },
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  timelineLocationText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  
  // Audiences
  audiencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
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
  noAudienceText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Notes
  timelineNotesContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primarySoft,
  },
  timelineNotesText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // Outfit Snippet
  outfitPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWarm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  outfitThumb: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
  },
  outfitInfoCol: {
    flex: 1,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  outfitLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  outfitName: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  noFilterDataText: {
    ...Typography.body,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Date Pickers
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  datePickerLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  iosDatePicker: {
    width: 130,
  },
  androidDateButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  androidDateText: {
    ...Typography.body,
    color: Colors.primary,
  },

  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  applyFiltersButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    ...Typography.headline,
    color: Colors.surface,
  },

  // Global Modal Form Additions
  modalActionTextSave: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  globalOutfitSelectCard: {
    width: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.soft,
    marginBottom: Spacing.sm,
  },
  globalOutfitSelectCardActive: {
    borderColor: Colors.primary,
  },
  globalOutfitSelectImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceWarm,
  },
  globalOutfitSelectLabelWrap: {
    padding: Spacing.xs,
    alignItems: 'center',
  },
  globalOutfitSelectLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  appliedTagText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  suggestedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  suggestedTagText: {
    ...Typography.caption,
    color: Colors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceWarm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkboxLabel: {
    ...Typography.subhead,
    color: Colors.text,
    marginLeft: Spacing.sm,
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
  locationLoadingText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
});
