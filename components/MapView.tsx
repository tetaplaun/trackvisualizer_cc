'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup } from 'react-leaflet';
import { Track } from '@/types/track';
import { Photo } from '@/types/photo';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface IconDefaultPrototype extends L.Icon.Default {
  _getIconUrl?: (name: string) => string;
}

delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

const cameraIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="26" r="6" fill="#3B82F6"/>
      <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="#1e40af" stroke-width="2"/>
      <rect x="8" y="11" width="16" height="12" rx="2" fill="white"/>
      <circle cx="16" cy="17" r="3" fill="#3B82F6"/>
      <rect x="14" y="9" width="4" height="3" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  // No shadow - it was causing the icon to fail to load
});

interface MapViewProps {
  tracks: Track[];
  photos?: Photo[];
  className?: string;
}

export interface MapViewRef {
  exportMap: () => Promise<Blob>;
}

function MapBoundsUpdater({ tracks, photos }: { tracks: Track[]; photos?: Photo[] }) {
  const map = useMap();

  useEffect(() => {
    const allPoints: L.LatLngTuple[] = [];
    
    tracks.forEach(track => {
      if (track.visible) {
        track.segments.forEach(segment => {
          segment.points.forEach(point => {
            allPoints.push([point.lat, point.lon]);
          });
        });
      }
    });

    if (photos) {
      photos.forEach(photo => {
        if (photo.visible && photo.location) {
          allPoints.push([photo.location.lat, photo.location.lon]);
        }
      });
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [tracks, photos, map]);

  return null;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ tracks, photos = [], className = '' }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useImperativeHandle(ref, () => ({
    exportMap: async () => {
      if (!mapContainerRef.current) {
        throw new Error('Map container not found');
      }

      const htmlToImage = (await import('html-to-image')).toPng;
      
      const controls = mapContainerRef.current.querySelectorAll('.leaflet-control');
      controls.forEach(control => {
        (control as HTMLElement).style.display = 'none';
      });

      try {
        const dataUrl = await htmlToImage(mapContainerRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        return blob;
      } finally {
        controls.forEach(control => {
          (control as HTMLElement).style.display = '';
        });
      }
    }
  }));

  const getPolylineOptions = (track: Track) => {
    const dashArray = track.style.lineStyle === 'dashed' ? '10, 5' : 
                     track.style.lineStyle === 'dotted' ? '2, 8' : 
                     undefined;

    return {
      color: track.style.color,
      weight: track.style.width,
      opacity: track.style.opacity,
      dashArray,
    };
  };

  const defaultCenter: L.LatLngTuple = [51.505, -0.09];
  const hasVisibleTracks = tracks.some(t => t.visible && t.segments.some(s => s.points.length > 0));

  let initialCenter = defaultCenter;
  let initialZoom = 13;

  if (hasVisibleTracks) {
    const firstVisibleTrack = tracks.find(t => t.visible && t.segments.length > 0);
    if (firstVisibleTrack && firstVisibleTrack.segments[0].points.length > 0) {
      const firstPoint = firstVisibleTrack.segments[0].points[0];
      initialCenter = [firstPoint.lat, firstPoint.lon];
      initialZoom = 13;
    }
  }

  return (
    <div ref={mapContainerRef} className={`w-full h-full ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        ref={(map) => { if (map) mapRef.current = map; }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {tracks.map(track => (
          track.visible && track.segments.map((segment, segmentIndex) => {
            const positions: L.LatLngTuple[] = segment.points.map(point => [point.lat, point.lon]);
            
            return positions.length > 0 ? (
              <Polyline
                key={`${track.id}-${segmentIndex}`}
                positions={positions}
                pathOptions={getPolylineOptions(track)}
              />
            ) : null;
          })
        ))}
        
        {photos && photos.map(photo => (
          photo.visible && photo.location && (
            <Marker
              key={photo.id}
              position={[photo.location.lat, photo.location.lon]}
              icon={cameraIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px] max-w-[300px]">
                  <img 
                    src={photo.thumbnailUrl || photo.dataUrl} 
                    alt={photo.name}
                    className="w-full h-auto rounded mb-2"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                  <p className="text-sm font-medium truncate">{photo.name}</p>
                  {photo.timestamp && (
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }).format(photo.timestamp)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {photo.location.lat.toFixed(6)}, {photo.location.lon.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        
        <MapBoundsUpdater tracks={tracks} photos={photos} />
      </MapContainer>
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;