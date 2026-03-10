import { Platform } from 'react-native';

export interface ExtractedItem {
  id: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories';
  imageUri: string;
  name: string;
  color?: string;
  seasons?: string[];
  weatherRating?: { minTemp: number, maxTemp: number };
}

export async function extractOutfitItems(imageUri: string): Promise<ExtractedItem[]> {
  try {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const fileBlob = await response.blob();
      formData.append('file', fileBlob, 'outfit.jpg');
    } else {
      // Native mobile networking layers require an object blob reference format for files.
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'outfit.jpg',
      } as any);
    }

    // Pointing to the live Render ML Backend
    const apiUrl = 'https://wind-co-closet-app.onrender.com/segment';

    console.log(`Sending image to ML Server: ${apiUrl}...`);
    const resp = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!resp.ok) {
      console.warn(`ML API returned ${resp.status}`);
      throw new Error(`API returned ${resp.status}`);
    }

    const data = await resp.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map((item: any, idx: number) => ({
        id: Date.now().toString() + '_' + idx.toString(),
        category: item.category,
        imageUri: item.imageUri,
        name: item.name,
        color: item.color || '#CCCCCC',
        seasons: item.seasons || ['spring', 'summer', 'fall', 'winter'],
        weatherRating: item.weatherRating || { minTemp: 10, maxTemp: 25 }, // Default 10-25°C
      }));
    } else {
      console.log('No ML items found in photo');
      return [];
    }
  } catch (error) {
    console.error("ML API connection failed.", error);
    return [];
  }
}
