'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
  acceptedFormats?: string[];
}

export function FileUploader({ 
  onFileUpload, 
  acceptedFormats = ['.gpx'] 
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!acceptedFormats.includes(fileExtension)) {
      toast({
        title: "Invalid file format",
        description: `Please upload a GPX file. Accepted formats: ${acceptedFormats.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await onFileUpload(file);
      setUploadedFiles(prev => [...prev, file]);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [acceptedFormats, onFileUpload, toast]);

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
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="w-full space-y-4">
      <Card
        className={`relative border-2 border-dashed transition-colors duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className={`mx-auto h-12 w-12 mb-4 ${
            isDragging ? 'text-primary' : 'text-gray-400'
          }`} />
          
          <p className="text-lg font-medium mb-2">
            {isDragging 
              ? 'Drop your GPX file here' 
              : 'Drag and drop your GPX file here'
            }
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            or
          </p>
          
          <label htmlFor="file-upload">
            <Button 
              variant="outline" 
              disabled={isUploading}
              asChild
            >
              <span>Browse Files</span>
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
          
          <p className="text-xs text-gray-400 mt-4">
            Supported formats: {acceptedFormats.join(', ')}
          </p>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}