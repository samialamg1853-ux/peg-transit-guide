import React from 'react';
import { TripSegment } from '@/services/winnipegtransit';
import { Bus, Clock, Footprints } from 'lucide-react';

interface RouteTimelineProps {
  segments: TripSegment[];
}

function formatTime(time?: string): string {
  if (!time) return '';
  try {
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
}

function getLegType(seg: TripSegment): 'bus' | 'walk' | 'wait' {
  if (seg.type === 'walk') return 'walk';
  if (seg.type === 'ride') return 'bus';
  return 'wait';
}

const iconMap = {
  bus: <Bus className="w-4 h-4" />,
  walk: <Footprints className="w-4 h-4" />,
  wait: <Clock className="w-4 h-4" />,
};

const colorMap = {
  bus: 'border-blue-500 bg-blue-50 text-blue-700',
  walk: 'border-green-500 bg-green-50 text-green-700',
  wait: 'border-yellow-500 bg-yellow-50 text-yellow-700',
};

export function RouteTimeline({ segments }: RouteTimelineProps) {
  return (
    <div className="space-y-2">
      {segments.map((seg, idx) => {
        const legType = getLegType(seg);
        const icon = iconMap[legType];
        const color = colorMap[legType];
        const start = formatTime(seg.times?.start);
        const end = formatTime(seg.times?.end);
        const timeStr = start && end ? `${start} - ${end}` : start || end;
        let label = '';
        if (legType === 'bus') {
          label = seg.route ? `Route ${seg.route.number} ${seg.route.name}` : 'Bus';
        } else if (legType === 'walk') {
          label = seg.to?.name ? `Walk to ${seg.to.name}` : 'Walk';
        } else {
          label = 'Wait';
        }
        return (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded border-l-4 ${color}`}
          >
            {icon}
            <div className="flex-1 text-sm">
              <p className="font-medium">{label}</p>
              {timeStr && <p className="text-xs opacity-75">{timeStr}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RouteTimeline;
