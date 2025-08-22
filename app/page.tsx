'use client';

import React, { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapViewRef } from '@/components/MapView';
import { FileUploader } from '@/components/FileUploader';
import { TrackCustomizer } from '@/components/TrackCustomizer';
import { ExportButton } from '@/components/ExportButton';
import { useTracks } from '@/hooks/use-tracks';
import { parseGPXFile } from '@/lib/gpx-parser';
import { Map, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Map className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const mapRef = useRef<MapViewRef>(null!);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    tracks,
    addTrack,
    removeTrack,
    updateTrackStyle,
    toggleTrackVisibility,
    clearAllTracks,
  } = useTracks();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const parsedTracks = await parseGPXFile(file);
      parsedTracks.forEach(track => {
        addTrack({
          name: track.name,
          segments: track.segments,
          stats: track.stats,
        });
      });
    } catch (error) {
      console.error('Error parsing GPX file:', error);
      throw error;
    }
  }, [addTrack]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-900">GPX Track Visualizer</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        <aside className={`
          absolute lg:relative
          top-0 left-0 h-full
          w-full sm:w-96 lg:w-96
          bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          z-20 lg:z-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${!isSidebarOpen && 'lg:-translate-x-full'}
        `}>
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Upload GPX File</h2>
              <FileUploader onFileUpload={handleFileUpload} />
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Tracks</h2>
                {tracks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTracks}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <TrackCustomizer
                tracks={tracks}
                onUpdateTrackStyle={updateTrackStyle}
                onToggleVisibility={toggleTrackVisibility}
                onRemoveTrack={removeTrack}
              />
            </Card>

            {tracks.length > 0 && (
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-3">Export</h2>
                <ExportButton mapRef={mapRef} disabled={tracks.length === 0} />
              </Card>
            )}
          </div>
        </aside>

        <main className="flex-1 relative">
          {isMobileMenuOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-10 lg:hidden"
              onClick={toggleMobileMenu}
            />
          )}
          
          <div className="w-full h-full">
            <MapView ref={mapRef} tracks={tracks} />
          </div>
        </main>
      </div>
    </div>
  );
}