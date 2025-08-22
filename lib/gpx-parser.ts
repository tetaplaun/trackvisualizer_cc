import { Track, TrackPoint, TrackSegment, TrackStats } from '@/types/track';

interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

interface GPXTrack {
  name?: string;
  points: GPXPoint[];
}

interface GPXRoute {
  name?: string;
  points: GPXPoint[];
}

interface GPXWaypoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

// GPXParser library types - the library doesn't have proper TypeScript definitions
interface GPXParserInstance {
  parse: (gpxText: string) => void;
  tracks?: GPXTrack[];
  routes?: GPXRoute[];
  waypoints?: GPXWaypoint[];
}

// Use unknown instead of any for better type safety
type GPXParserConstructor = new() => GPXParserInstance;

declare global {
  interface Window {
    gpxParser: GPXParserConstructor;
  }
}

export async function parseGPXFile(file: File): Promise<Track[]> {
  const text = await file.text();
  return await parseGPXString(text, file.name);
}

export async function parseGPXString(gpxText: string, fileName?: string): Promise<Track[]> {
  let GPXParser: GPXParserConstructor | null = null;
  
  if (typeof window !== 'undefined') {
    // Dynamic import for client-side
    const gpxModule = await import('gpxparser');
    // Double assertion through unknown because the library doesn't have proper types
    GPXParser = (gpxModule.default || gpxModule) as unknown as GPXParserConstructor;
  }
  
  if (!GPXParser) {
    throw new Error('GPX Parser not available');
  }

  const gpx = new GPXParser();
  gpx.parse(gpxText);

  const tracks: Track[] = [];

  if (gpx.tracks && gpx.tracks.length > 0) {
    gpx.tracks.forEach((gpxTrack: GPXTrack, trackIndex: number) => {
      const segments: TrackSegment[] = [];
      
      gpxTrack.points.forEach((point: GPXPoint) => {
        const trackPoint: TrackPoint = {
          lat: point.lat,
          lon: point.lon,
          ele: point.ele,
          time: point.time ? new Date(point.time) : undefined,
        };
        
        if (segments.length === 0) {
          segments.push({ points: [] });
        }
        segments[segments.length - 1].points.push(trackPoint);
      });

      const stats = calculateTrackStats(segments);
      
      tracks.push({
        id: `track-${Date.now()}-${trackIndex}`,
        name: gpxTrack.name || fileName || `Track ${trackIndex + 1}`,
        segments,
        style: {
          color: '#E53E3E',
          width: 3,
          opacity: 1,
          lineStyle: 'solid',
        },
        visible: true,
        stats,
      });
    });
  }

  if (gpx.routes && gpx.routes.length > 0) {
    gpx.routes.forEach((route: GPXRoute, routeIndex: number) => {
      const segments: TrackSegment[] = [{ points: [] }];
      
      route.points.forEach((point: GPXPoint) => {
        const trackPoint: TrackPoint = {
          lat: point.lat,
          lon: point.lon,
          ele: point.ele,
        };
        segments[0].points.push(trackPoint);
      });

      const stats = calculateTrackStats(segments);
      
      tracks.push({
        id: `route-${Date.now()}-${routeIndex}`,
        name: route.name || `Route ${routeIndex + 1}`,
        segments,
        style: {
          color: '#E53E3E',
          width: 3,
          opacity: 1,
          lineStyle: 'solid',
        },
        visible: true,
        stats,
      });
    });
  }

  if (gpx.waypoints && gpx.waypoints.length > 0 && tracks.length === 0) {
    const segments: TrackSegment[] = [{ points: [] }];
    
    gpx.waypoints.forEach((waypoint: GPXWaypoint) => {
      const trackPoint: TrackPoint = {
        lat: waypoint.lat,
        lon: waypoint.lon,
        ele: waypoint.ele,
      };
      segments[0].points.push(trackPoint);
    });

    const stats = calculateTrackStats(segments);
    
    tracks.push({
      id: `waypoints-${Date.now()}`,
      name: fileName || 'Waypoints',
      segments,
      style: {
        color: '#E53E3E',
        width: 3,
        opacity: 1,
        lineStyle: 'solid',
      },
      visible: true,
      stats,
    });
  }

  if (tracks.length === 0) {
    throw new Error('No tracks, routes, or waypoints found in GPX file');
  }

  return tracks;
}

function calculateTrackStats(segments: TrackSegment[]): TrackStats {
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let startTime: Date | undefined;
  let endTime: Date | undefined;

  segments.forEach(segment => {
    for (let i = 0; i < segment.points.length; i++) {
      const point = segment.points[i];
      
      if (point.ele !== undefined) {
        minElevation = Math.min(minElevation, point.ele);
        maxElevation = Math.max(maxElevation, point.ele);
      }

      if (point.time) {
        if (!startTime || point.time < startTime) {
          startTime = point.time;
        }
        if (!endTime || point.time > endTime) {
          endTime = point.time;
        }
      }

      if (i > 0) {
        const prevPoint = segment.points[i - 1];
        
        const distance = calculateDistance(
          prevPoint.lat, prevPoint.lon,
          point.lat, point.lon
        );
        totalDistance += distance;

        if (point.ele !== undefined && prevPoint.ele !== undefined) {
          const elevDiff = point.ele - prevPoint.ele;
          if (elevDiff > 0) {
            elevationGain += elevDiff;
          } else {
            elevationLoss += Math.abs(elevDiff);
          }
        }
      }
    }
  });

  const duration = startTime && endTime 
    ? (endTime.getTime() - startTime.getTime()) / 1000
    : undefined;

  return {
    distance: totalDistance,
    elevationGain,
    elevationLoss,
    minElevation: minElevation === Infinity ? 0 : minElevation,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation,
    duration,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}