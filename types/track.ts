export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface TrackSegment {
  points: TrackPoint[];
}

export interface Track {
  id: string;
  name: string;
  segments: TrackSegment[];
  style: TrackStyle;
  visible: boolean;
  stats?: TrackStats;
}

export interface TrackStyle {
  color: string;
  width: number;
  opacity: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface TrackStats {
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number;
  maxElevation: number;
  duration?: number;
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}