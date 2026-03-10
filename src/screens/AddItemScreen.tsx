import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useCloset } from '../context/ClosetContext';

type ClothingCategory = 'tops' | 'bottoms' | 'shoes' | 'accessories';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface AddItemScreenProps {
  navigation: any;
}

export default function AddItemScreen({ navigation }: AddItemScreenProps) {
  const { addItem } = useCloset();
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(['spring', 'summer', 'fall', 'winter']);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

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

  const toggleSeason = (season: Season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season) 
        : [...prev, season]
    );
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        if (photo) {
          setImageUri(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
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
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter an item name.');
      return;
    }

    if (!imageUri) {
      Alert.alert('Required Field', 'Please add a photo of the item.');
      return;
    }

    if (selectedSeasons.length === 0) {
      Alert.alert('Required Field', 'Please select at least one season.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: name.trim(),
      brand: brand.trim() || 'Unknown',
      category,
      color: '#CCCCCC', // Default color, can be enhanced later
      status: 'clean' as const,
      imageUrl: imageUri,
      seasons: selectedSeasons,
    };

    addItem(newItem);
    Alert.alert('Success', 'Item added to your closet!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, name, brand, category, selectedSeasons, imageUri]);

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing="back"
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity 
              style={styles.cameraCloseButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.cameraBottomControls}>
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={capturePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={[styles.photoButton, styles.photoButtonSecondary]}
                  onPress={handleTakePhoto}
                >
                  <MaterialCommunityIcons name="camera" size={20} color={Colors.primary} />
                  <Text style={styles.photoButtonSecondaryText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.photoButton, styles.photoButtonSecondary]}
                  onPress={handlePickImage}
                >
                  <MaterialCommunityIcons name="image" size={20} color={Colors.primary} />
                  <Text style={styles.photoButtonSecondaryText}>Choose Different</Text>
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

        {/* Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Blue Denim Jacket"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand (Optional)</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
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
                  category === cat.key && styles.categoryCardSelected,
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={28}
                  color={category === cat.key ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.key && styles.categoryTextSelected,
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
                  selectedSeasons.includes(season.key) && styles.seasonCardSelected,
                ]}
                onPress={() => toggleSeason(season.key)}
              >
                <MaterialCommunityIcons
                  name={season.icon}
                  size={24}
                  color={selectedSeasons.includes(season.key) ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.seasonText,
                    selectedSeasons.includes(season.key) && styles.seasonTextSelected,
                  ]}
                >
                  {season.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
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
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.border,
  },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  
  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  categoryText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.primary,
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  seasonText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  seasonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Save Button (Header)
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    fontSize: 16,
  },
});
