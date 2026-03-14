import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset } from '../context/ClosetContext';
import { useOutfitContext } from '../context/OutfitContext';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WeatherData = {
  temp: number;
  condition: string;
  icon: keyof typeof Ionicons.glyphMap;
  city: string;
  min24h: number;
  max24h: number;
};

export default function DashboardScreen({ navigation }: any) {
  const { items } = useCloset();
  const { outfits } = useOutfitContext();
  
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  
  const [userName, setUserName] = useState<string>('User');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [tempNameInput, setTempNameInput] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    loadUserName();
    fetchWeather();
  }, []);

  const loadUserName = async () => {
    try {
      const storedName = await AsyncStorage.getItem('user_name');
      if (storedName) {
         setUserName(storedName);
      } else {
         setShowNameModal(true);
      }
    } catch (e) {
      console.log('Failed to fetch user name', e);
    }
  };

  const saveUserName = async () => {
    if (tempNameInput.trim()) {
      try {
        await AsyncStorage.setItem('user_name', tempNameInput.trim());
        setUserName(tempNameInput.trim());
        setShowNameModal(false);
      } catch (e) {
         console.log('Failed to save user name', e);
      }
    }
  };

  const fetchWeather = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingWeather(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      const city = reverseGeo[0]?.city || 'Local Area';

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&current=temperature_2m,weather_code&hourly=temperature_2m`);
      const data = await response.json();
      
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      
      // Calculate 24h min and max
      const next24hTemps = data.hourly.temperature_2m.slice(0, 24);
      const min24h = Math.round(Math.min(...next24hTemps));
      const max24h = Math.round(Math.max(...next24hTemps));
      
      let condition = 'Clear';
      let icon: keyof typeof Ionicons.glyphMap = 'sunny';
      
      if (code >= 1 && code <= 3) { condition = 'Cloudy'; icon = 'partly-sunny'; }
      else if (code >= 51 && code <= 67) { condition = 'Rain'; icon = 'rainy'; }
      else if (code >= 71 && code <= 82) { condition = 'Snow'; icon = 'snow'; }
      else if (code >= 95) { condition = 'Storm'; icon = 'thunderstorm'; }
      else if (code === 45 || code === 48) { condition = 'Fog'; icon = 'cloud'; }

      setWeather({ temp, condition, icon, city, min24h, max24h });
    } catch (e) {
      console.log('Weather error', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  const getSuggestedItem = () => {
    const cleanItems = items.filter(i => i.status === 'clean' && i.category === 'tops');
    if (cleanItems.length === 0) return null;
    
    // Try to find one that fits the weather rating first
    if (weather) {
       const idealItems = cleanItems.filter(i => 
         !i.weatherRating || (i.weatherRating.minTemp <= weather.max24h && i.weatherRating.maxTemp >= weather.min24h)
       );
       if (idealItems.length > 0) {
          return idealItems[Math.floor(Math.random() * idealItems.length)];
       }
    }
    
    return cleanItems[Math.floor(Math.random() * cleanItems.length)];
  };

  const suggestedItem = getSuggestedItem();
  const recentOutfits = [...outfits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Welcome to Wind & Co.</Text>
            <Text style={styles.modalSubtitle}>What should we call you?</Text>
            
            <TextInput
              style={styles.nameInput}
              value={tempNameInput}
              onChangeText={setTempNameInput}
              placeholder="Your Name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveUserName}
            />
            
            <TouchableOpacity 
              style={[styles.saveNameBtn, !tempNameInput.trim() && { opacity: 0.5 }]}
              onPress={saveUserName}
              disabled={!tempNameInput.trim()}
            >
              <Text style={styles.saveNameBtnText}>Let's go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {userName}</Text>
            <Text style={styles.subtitle}>What are we wearing today?</Text>
          </View>

        </View>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          {loadingWeather ? (
            <ActivityIndicator color={Colors.surface} />
          ) : weather ? (
            <View style={styles.weatherContent}>
              <View>
                <Text style={styles.weatherCity}>{weather.city}</Text>
                <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
                <Text style={styles.weatherCond}>{weather.condition}</Text>
              </View>
              <Ionicons name={weather.icon} size={64} color={Colors.surface} />
            </View>
          ) : (
             <View style={styles.weatherContent}>
              <Text style={styles.weatherCity}>Location Disabled</Text>
              <Text style={styles.weatherCond}>Enable location to see weather.</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
            onPress={() => navigation.navigate('OutfitBuilderTab')}
          >
            <Ionicons name="add-circle" size={24} color={Colors.surface} />
            <Text style={[styles.actionText, { color: Colors.surface }]}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Colors.mintSoft }]}
            onPress={() => navigation.navigate('ClosetTab')}
          >
            <MaterialCommunityIcons name="hanger" size={24} color={Colors.clean} />
            <Text style={[styles.actionText, { color: Colors.clean }]}>Closet</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestion */}
        {suggestedItem && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested For You</Text>
            <TouchableOpacity 
              style={styles.suggestionCard}
              onPress={() => navigation.navigate('OutfitBuilderTab', {
                prefillItemId: suggestedItem.id,
                prefillRequestId: Date.now(),
              })}
            >
              <Image source={{ uri: suggestedItem.imageUrl }} style={styles.suggestionImg} resizeMode="contain" />
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>{suggestedItem.name}</Text>
                <Text style={styles.suggestionBrand}>{suggestedItem.brand}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                  <View style={styles.cleanBadge}>
                    <Text style={styles.cleanBadgeText}>Clean & Ready</Text>
                  </View>
                  {weather && suggestedItem.weatherRating && (suggestedItem.weatherRating.minTemp > weather.max24h || suggestedItem.weatherRating.maxTemp < weather.min24h) && (
                    <View style={[styles.cleanBadge, { backgroundColor: Colors.amberSoft }]}>
                      <Ionicons name="warning" size={12} color={Colors.amber} style={{ marginRight: 2 }} />
                      <Text style={[styles.cleanBadgeText, { color: Colors.amber }]}>
                        {suggestedItem.weatherRating.minTemp > weather.max24h ? 'Might be too cold today' : 'Might be too warm today'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Outfits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Fits</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ArchiveTab')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentOutfits.length > 0 ? (
              recentOutfits.map(outfit => (
                <TouchableOpacity key={outfit.id} style={styles.outfitCard} onPress={() => navigation.navigate('ArchiveTab')}>
                  <View style={styles.outfitImagesGrid}>
                    {outfit.images.slice(0,4).map((img, i) => (
                      <Image key={i} source={{ uri: img }} style={styles.outfitGridImg} resizeMode="contain" />
                    ))}
                  </View>
                  <Text style={styles.outfitName} numberOfLines={1}>{outfit.name}</Text>
                  <Text style={styles.outfitSub}>{outfit.season}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyOutfits}>
                <Text style={styles.emptyOutfitsText}>No recent outfits. Create one!</Text>
              </View>
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: Spacing.xxl },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.title },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  weatherCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherCity: { ...Typography.subhead, color: 'rgba(255,255,255,0.8)' },
  weatherTemp: { ...Typography.largeTitle, color: Colors.surface, marginVertical: 4 },
  weatherCond: { ...Typography.subhead, color: Colors.surface, fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionText: { ...Typography.headline, fontSize: 16 },

  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.headline, marginBottom: Spacing.md },
  seeAll: { ...Typography.subhead, color: Colors.primary, fontWeight: '600' },
  
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.soft,
  },
  suggestionImg: {
    width: 80, height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceWarm,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  suggestionName: { ...Typography.headline, fontSize: 16, marginBottom: 2 },
  suggestionBrand: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 8 },
  cleanBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.mintSoft,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4,
  },
  cleanBadgeText: { ...Typography.caption, color: Colors.clean, fontWeight: '600' },

  outfitCard: {
    width: 160,
    marginRight: Spacing.md,
  },
  outfitImagesGrid: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surfaceWarm,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  outfitGridImg: {
    width: '50%',
    height: '50%',
  },
  outfitName: { ...Typography.subhead, fontWeight: '600' },
  outfitSub: { ...Typography.caption, color: Colors.textMuted },
  emptyOutfits: {
    width: 300,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center'
  },
  emptyOutfitsText: { ...Typography.subhead, color: Colors.textMuted },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    ...Shadows.medium,
  },
  modalTitle: {
    ...Typography.title,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  nameInput: {
    ...Typography.headline,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  saveNameBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  saveNameBtnText: {
    ...Typography.headline,
    color: Colors.surface,
  },
});
