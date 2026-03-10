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
    // If we're on web, fetch the blob directly from the object URL
    let fileBlob: Blob;
    
    // Both web and native URI can be fetched to a blob natively in modern React Native/Expo
    const response = await fetch(imageUri);
    fileBlob = await response.blob();

    const formData = new FormData();
    formData.append('file', fileBlob, 'outfit.jpg');

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
