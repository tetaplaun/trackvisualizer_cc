'use client';

import React from 'react';
import { Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Track, TrackStyle } from '@/types/track';
import { formatDistance, formatDuration } from '@/lib/gpx-parser';

interface TrackCustomizerProps {
  tracks: Track[];
  onUpdateTrackStyle: (trackId: string, style: Partial<TrackStyle>) => void;
  onToggleVisibility: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
}

const PRESET_COLORS = [
  { label: 'Red', value: '#E53E3E' },
  { label: 'Orange', value: '#FC4C02' },
  { label: 'Blue', value: '#3182CE' },
  { label: 'Green', value: '#38A169' },
  { label: 'Purple', value: '#805AD5' },
  { label: 'Pink', value: '#D53F8C' },
  { label: 'Yellow', value: '#D69E2E' },
  { label: 'Gray', value: '#4A5568' },
];

export function TrackCustomizer({
  tracks,
  onUpdateTrackStyle,
  onToggleVisibility,
  onRemoveTrack,
}: TrackCustomizerProps) {
  const [expandedTrack, setExpandedTrack] = React.useState<string | null>(null);

  const toggleExpanded = (trackId: string) => {
    setExpandedTrack(expandedTrack === trackId ? null : trackId);
  };

  if (tracks.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500 text-center">
          No tracks loaded. Upload a GPX file to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <Card key={track.id} className="overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: track.style.color }}
                />
                <span className="text-sm font-medium truncate">{track.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleVisibility(track.id)}
                  className="h-8 w-8 p-0"
                >
                  {track.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(track.id)}
                  className="h-8 w-8 p-0"
                >
                  {expandedTrack === track.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveTrack(track.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {track.stats && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>Distance: {formatDistance(track.stats.distance)}</div>
                <div>Duration: {formatDuration(track.stats.duration)}</div>
                {track.stats.elevationGain > 0 && (
                  <>
                    <div>↑ {track.stats.elevationGain.toFixed(0)}m</div>
                    <div>↓ {track.stats.elevationLoss.toFixed(0)}m</div>
                  </>
                )}
              </div>
            )}
          </div>

          {expandedTrack === track.id && (
            <div className="border-t p-4 space-y-4 bg-gray-50/50">
              <div className="space-y-2">
                <Label htmlFor={`color-${track.id}`} className="text-xs">
                  Color
                </Label>
                <Select
                  value={track.style.color}
                  onValueChange={(value) => onUpdateTrackStyle(track.id, { color: value })}
                >
                  <SelectTrigger id={`color-${track.id}`} className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={`width-${track.id}`} className="text-xs">
                    Width
                  </Label>
                  <span className="text-xs text-gray-500">{track.style.width}px</span>
                </div>
                <Slider
                  id={`width-${track.id}`}
                  min={1}
                  max={10}
                  step={1}
                  value={[track.style.width]}
                  onValueChange={([value]) => onUpdateTrackStyle(track.id, { width: value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={`opacity-${track.id}`} className="text-xs">
                    Opacity
                  </Label>
                  <span className="text-xs text-gray-500">
                    {Math.round(track.style.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  id={`opacity-${track.id}`}
                  min={0}
                  max={100}
                  step={5}
                  value={[track.style.opacity * 100]}
                  onValueChange={([value]) => onUpdateTrackStyle(track.id, { opacity: value / 100 })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`style-${track.id}`} className="text-xs">
                  Line Style
                </Label>
                <Select
                  value={track.style.lineStyle}
                  onValueChange={(value: 'solid' | 'dashed' | 'dotted') => 
                    onUpdateTrackStyle(track.id, { lineStyle: value })
                  }
                >
                  <SelectTrigger id={`style-${track.id}`} className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}