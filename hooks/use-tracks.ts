import { useState, useCallback } from 'react';
import { Track, TrackStyle } from '@/types/track';

const DEFAULT_STYLE: TrackStyle = {
  color: '#E53E3E',
  width: 3,
  opacity: 1,
  lineStyle: 'solid',
};

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);

  const addTrack = useCallback((track: Omit<Track, 'id' | 'style' | 'visible'>) => {
    const newTrack: Track = {
      ...track,
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      style: { ...DEFAULT_STYLE },
      visible: true,
    };
    setTracks(prev => [...prev, newTrack]);
    return newTrack;
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const updateTrackStyle = useCallback((trackId: string, style: Partial<TrackStyle>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, style: { ...track.style, ...style } }
        : track
    ));
  }, []);

  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, visible: !track.visible }
        : track
    ));
  }, []);

  const clearAllTracks = useCallback(() => {
    setTracks([]);
  }, []);

  return {
    tracks,
    addTrack,
    removeTrack,
    updateTrackStyle,
    toggleTrackVisibility,
    clearAllTracks,
  };
}