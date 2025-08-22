import exifr from 'exifr';
import { PhotoLocation, PhotoMetadata } from '@/types/photo';

// Dynamic import for heic2any (only loads when needed)
type Heic2AnyConverter = (options: { blob: Blob; toType: string; quality?: number }) => Promise<Blob>;
let heic2any: Heic2AnyConverter | null = null;
const loadHeic2Any = async () => {
  if (!heic2any && typeof window !== 'undefined') {
    try {
      heic2any = (await import('heic2any')).default as Heic2AnyConverter;
    } catch (error) {
      console.error('Failed to load heic2any:', error);
    }
  }
  return heic2any;
};

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    const exifData = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'Make', 'Model', 'Orientation', 'GPSLatitude', 'GPSLongitude'],
    });

    let location: PhotoLocation | null = null;
    
    if (exifData && exifData.latitude !== undefined && exifData.longitude !== undefined) {
      location = {
        lat: exifData.latitude,
        lon: exifData.longitude,
      };
    }

    const timestamp = exifData?.DateTimeOriginal ? new Date(exifData.DateTimeOriginal) : undefined;
    const camera = exifData?.Make && exifData?.Model 
      ? `${exifData.Make} ${exifData.Model}` 
      : undefined;
    const orientation = exifData?.Orientation;

    return {
      location,
      timestamp,
      camera,
      orientation,
    };
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return {
      location: null,
      timestamp: undefined,
      camera: undefined,
      orientation: undefined,
    };
  }
}

async function convertHeicToJpeg(file: File): Promise<File | Blob> {
  const isHeic = /\.(heic|heif)$/i.test(file.name) || 
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';
  
  if (!isHeic) {
    return file;
  }

  console.log('Detected HEIC file, attempting conversion...');
  
  try {
    const converter = await loadHeic2Any();
    if (!converter) {
      console.error('heic2any not available');
      return file;
    }

    const convertedBlob = await converter({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    console.log('HEIC conversion successful');
    return convertedBlob as Blob;
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    return file; // Return original file if conversion fails
  }
}

export function createThumbnail(file: File, maxSize: number = 200): Promise<string | null> {
  return new Promise(async (resolve) => {
    console.log(`Creating thumbnail for: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('Thumbnail creation not available in server-side context');
      resolve(null);
      return;
    }

    try {
      // Convert HEIC to JPEG if necessary
      const processedFile = await convertHeicToJpeg(file);
      console.log('File after processing:', processedFile);

      const reader = new FileReader();
      
      reader.onload = (e) => {
      const result = e.target?.result;
      
      if (!result || typeof result !== 'string') {
        console.error('Invalid FileReader result');
        resolve(null);
        return;
      }

      // Create image with timeout
      const img = new Image();
      // eslint-disable-next-line prefer-const
      let timeoutId: NodeJS.Timeout | undefined;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
      
      img.onload = () => {
        cleanup();
        console.log(`Image loaded successfully: ${file.name}, dimensions: ${img.width}x${img.height}`);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('Could not get canvas context');
            resolve(null);
            return;
          }

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          console.log(`Thumbnail created successfully for: ${file.name}`);
          resolve(thumbnailDataUrl);
        } catch (error) {
          console.error('Error creating thumbnail:', error);
          resolve(null);
        }
      };
      
      img.onerror = (error) => {
        cleanup();
        console.error('Failed to load image for thumbnail:', error, 'File:', file.name, 'Type:', file.type, 'Size:', file.size);
        console.error('This might be due to unsupported format (like HEIC) or corrupted file');
        resolve(null);
      };
      
      // Set timeout for image loading
      timeoutId = setTimeout(() => {
        console.warn('Image loading timeout for thumbnail');
        resolve(null);
      }, 5000);
      
      img.src = result;
    };
    
    reader.onerror = (error) => {
      console.error('Failed to read file for thumbnail:', error);
      resolve(null);
    };
    
      try {
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error starting file read:', error);
        resolve(null);
      }
    } catch (error) {
      console.error('Error in thumbnail creation process:', error);
      resolve(null);
    }
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  // Convert HEIC to JPEG if necessary before creating data URL
  const processedFile = await convertHeicToJpeg(file);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(processedFile);
  });
}