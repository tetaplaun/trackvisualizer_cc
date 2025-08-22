import { useState, useCallback } from 'react';
import { Photo } from '@/types/photo';
import { extractPhotoMetadata, createThumbnail, fileToDataUrl } from '@/lib/exif-parser';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addPhoto = useCallback(async (file: File): Promise<Photo | null> => {
    setIsProcessing(true);
    try {
      const metadata = await extractPhotoMetadata(file);
      const dataUrl = await fileToDataUrl(file);
      
      // Try to create thumbnail, but don't fail if it doesn't work
      let thumbnailUrl: string | null = null;
      try {
        thumbnailUrl = await createThumbnail(file, 200);
      } catch (error) {
        console.warn('Thumbnail creation failed, using original image:', error);
      }
      
      const newPhoto: Photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        dataUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        location: metadata.location,
        timestamp: metadata.timestamp,
        visible: true,
        size: file.size,
      };
      
      setPhotos(prev => [...prev, newPhoto]);
      return newPhoto;
    } catch (error) {
      console.error('Error processing photo:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const addMultiplePhotos = useCallback(async (files: File[]): Promise<Photo[]> => {
    setIsProcessing(true);
    const processedPhotos: Photo[] = [];
    
    try {
      for (const file of files) {
        try {
          const metadata = await extractPhotoMetadata(file);
          const dataUrl = await fileToDataUrl(file);
          
          // Try to create thumbnail, but don't fail if it doesn't work
          let thumbnailUrl: string | null = null;
          try {
            thumbnailUrl = await createThumbnail(file, 200);
          } catch (error) {
            console.warn(`Thumbnail creation failed for ${file.name}, using original image:`, error);
          }
          
          const newPhoto: Photo = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            dataUrl,
            thumbnailUrl: thumbnailUrl || undefined,
            location: metadata.location,
            timestamp: metadata.timestamp,
            visible: true,
            size: file.size,
          };
          
          processedPhotos.push(newPhoto);
        } catch (error) {
          console.error(`Error processing photo ${file.name}:`, error);
        }
      }
      
      if (processedPhotos.length > 0) {
        setPhotos(prev => [...prev, ...processedPhotos]);
      }
      
      return processedPhotos;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const togglePhotoVisibility = useCallback((photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, visible: !photo.visible }
        : photo
    ));
  }, []);

  const clearAllPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const getPhotosWithLocation = useCallback(() => {
    return photos.filter(p => p.location !== null && p.visible);
  }, [photos]);

  return {
    photos,
    isProcessing,
    addPhoto,
    addMultiplePhotos,
    removePhoto,
    togglePhotoVisibility,
    clearAllPhotos,
    getPhotosWithLocation,
  };
}