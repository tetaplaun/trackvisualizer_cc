export interface PhotoLocation {
  lat: number;
  lon: number;
}

export interface Photo {
  id: string;
  name: string;
  dataUrl: string;
  thumbnailUrl?: string | null;
  location: PhotoLocation | null;
  timestamp?: Date;
  visible: boolean;
  size: number;
}

export interface PhotoMetadata {
  location: PhotoLocation | null;
  timestamp?: Date;
  camera?: string;
  orientation?: number;
}