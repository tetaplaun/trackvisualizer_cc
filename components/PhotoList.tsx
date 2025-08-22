'use client';

import React from 'react';
import { Photo } from '@/types/photo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Eye, EyeOff, MapPin, MapPinOff, Calendar } from 'lucide-react';
import Image from 'next/image';

interface PhotoListProps {
  photos: Photo[];
  onRemovePhoto: (photoId: string) => void;
  onToggleVisibility: (photoId: string) => void;
}

export function PhotoList({ photos, onRemovePhoto, onToggleVisibility }: PhotoListProps) {
  if (photos.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'No date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
        <span>Photos ({photos.length})</span>
        <span className="text-xs font-normal text-gray-500">
          {photos.filter(p => p.location).length} with location
        </span>
      </h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {photos.map((photo) => (
          <div 
            key={photo.id}
            className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="relative flex-shrink-0 w-16 h-16">
              {photo.thumbnailUrl && (
                <Image 
                  src={photo.thumbnailUrl} 
                  alt={photo.name}
                  fill
                  className="object-cover rounded"
                  sizes="64px"
                />
              )}
              {!photo.visible && (
                <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center z-10">
                  <EyeOff className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={photo.name}>
                {photo.name}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                {photo.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {photo.location.lat.toFixed(4)}, {photo.location.lon.toFixed(4)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MapPinOff className="h-3 w-3" />
                    No location
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{formatFileSize(photo.size)}</span>
                {photo.timestamp && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(photo.timestamp)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(photo.id)}
                className="h-6 w-6 p-0"
                title={photo.visible ? 'Hide photo' : 'Show photo'}
              >
                {photo.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemovePhoto(photo.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}