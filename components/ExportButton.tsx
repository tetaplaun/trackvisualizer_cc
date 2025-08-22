'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapViewRef } from './MapView';

interface ExportButtonProps {
  mapRef: React.RefObject<MapViewRef>;
  disabled?: boolean;
}

export function ExportButton({ mapRef, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!mapRef.current) {
      toast({
        title: "Export failed",
        description: "Map is not ready for export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await mapRef.current.exportMap();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gpx-track-map-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your map has been downloaded as a PNG image",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export the map",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export as PNG'}
    </Button>
  );
}