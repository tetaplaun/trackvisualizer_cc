'use client';

import React, { useCallback, useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  onPhotosUpload: (files: File[]) => Promise<void>;
  isProcessing?: boolean;
  acceptedFormats?: string[];
}

export function PhotoUploader({ 
  onPhotosUpload, 
  isProcessing = false,
  acceptedFormats = ['.jpg', '.jpeg', '.png', '.heic', '.webp'] 
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      
      if (!acceptedFormats.includes(fileExtension)) {
        toast({
          title: "Invalid file format",
          description: `${file.name} is not a supported image format. Accepted formats: ${acceptedFormats.join(', ')}`,
          variant: "destructive",
        });
        continue;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB size limit`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  }, [acceptedFormats, toast]);

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles = validateFiles(files);
    
    if (validFiles.length === 0) return;
    
    try {
      await onPhotosUpload(validFiles);
      toast({
        title: "Photos uploaded successfully",
        description: `${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} processed.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the photos",
        variant: "destructive",
      });
    }
  }, [validateFiles, onPhotosUpload, toast]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
    e.target.value = '';
  }, [handleFiles]);

  return (
    <Card
      className={`relative border-2 border-dashed transition-colors duration-200 ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-300 hover:border-gray-400'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-6 text-center">
        <Camera className={`mx-auto h-10 w-10 mb-3 ${
          isDragging ? 'text-primary' : 'text-gray-400'
        }`} />
        
        <p className="text-sm font-medium mb-1">
          {isDragging 
            ? 'Drop your photos here' 
            : 'Drag and drop photos here'
          }
        </p>
        
        <p className="text-xs text-gray-500 mb-3">
          or
        </p>
        
        <label htmlFor="photo-upload">
          <Button 
            variant="outline" 
            size="sm"
            disabled={isProcessing}
            asChild
          >
            <span>
              <ImageIcon className="h-4 w-4 mr-2" />
              Browse Photos
            </span>
          </Button>
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            disabled={isProcessing}
            multiple
          />
        </label>
        
        <p className="text-xs text-gray-400 mt-3">
          Supported: {acceptedFormats.join(', ')}
        </p>
        
        {isProcessing && (
          <p className="text-xs text-primary mt-2">
            Processing photos...
          </p>
        )}
      </div>
    </Card>
  );
}