const API_BASE_URL = 'https://api.winnipegtransit.com/v4';
const API_KEY = 'DY2gOwNs7l1TAws1iRKQ';

// Type definitions for Winnipeg Transit API responses
export interface TransitStop {
  key: number;
  name: string;
  number: number;
  direction?: string;
  side?: string;
  geographic: {
    latitude: number;
    longitude: number;
  };
  distances?: {
    direct?: number;
    walking?: number;
  };
}

export interface RouteSchedule {
  key: number;
  number: string;
  name: string;
  badge_label: string;
  badge_style: {
    "background-color": string;
    color: string;
  };
  times: {
    departure: {
      scheduled: string;
      estimated?: string;
    };
    arrival: {
      scheduled: string;
      estimated?: string;
    };
  }[];
}

export interface StopSchedule {
  stop: TransitStop;
  "route-schedules": RouteSchedule[];
}

export interface TripSegment {
  type: string;
  route?: { number: string; name: string };
  from?: { name?: string };
  to?: { name?: string };
  times?: { start?: string; end?: string; departure?: string; arrival?: string };
  shape?: { points?: string };
  path?: [number, number][];
  color?: string;
}

export interface TripPlan {
  segments: TripSegment[];
}
// Helper to normalize API stop shape into our TransitStop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStop(raw: any): TransitStop {
  const geographic = raw.centre?.geographic || raw.geographic || { latitude: 0, longitude: 0 };
  const direct = raw.distances?.direct ?? undefined;
  const walking = direct !== undefined ? Math.round(direct * 1.25) : undefined;
  return {
    key: Number(raw.key),
    name: raw.name,
    number: Number(raw.number),
    direction: raw.direction,
    side: raw.side,
    geographic: {
      latitude: Number(geographic.latitude),
      longitude: Number(geographic.longitude),
    },
    distances: direct !== undefined ? { direct, walking } : undefined,
  };
}

// API service functions
export const winnipegTransitAPI = {
  // Get stops near a location
  async getStopsNear(lat: number, lng: number, distance = 500): Promise<TransitStop[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/stops.json?lat=${lat}&lon=${lng}&distance=${distance}&api-key=${API_KEY}`
      );
      const data = await response.json();
      return (data.stops || []).map(normalizeStop);
    } catch (error) {
      console.error('Error fetching nearby stops:', error);
      return [];
    }
  },

  // Get stop schedule
  async getStopSchedule(stopId: number): Promise<StopSchedule | null> {
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `${API_BASE_URL}/stops/${stopId}/schedule.json?max-results-per-route=10&start=${encodeURIComponent(now)}&api-key=${API_KEY}`
      );
      const data = await response.json();
      return data["stop-schedule"] || null;
    } catch (error) {
      console.error('Error fetching stop schedule:', error);
      return null;
    }
  },

  // Search stops by name or number; API requires location context. Includes robust fallback.
  async searchStops(
    query: string,
    opts?: { lat?: number; lon?: number; distance?: number; route?: string }
  ): Promise<TransitStop[]> {
    try {
      const lat = opts?.lat ?? 49.8951; // Winnipeg centre
      const lon = opts?.lon ?? -97.1384;
      const distance = opts?.distance ?? 6000;
      const routeParam = opts?.route ? `&route=${encodeURIComponent(opts.route)}` : '';
      const url = `${API_BASE_URL}/stops.json?name=${encodeURIComponent(query)}${routeParam}&lat=${lat}&lon=${lon}&distance=${distance}&api-key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        let stops: TransitStop[] = (data.stops || []).map(normalizeStop);

      // Fallback: broaden search if no results
      if (!stops.length) {
        const wide = await fetch(`${API_BASE_URL}/stops.json?lat=49.8951&lon=-97.1384&distance=15000${routeParam}&api-key=${API_KEY}`);
        const wideData = await wide.json();
        const all = (wideData.stops || []).map(normalizeStop);
        const q = query.toLowerCase();
        stops = all
          .filter((s: TransitStop) =>
            s.name.toLowerCase().includes(q) || String(s.number).includes(query)
          )
          .slice(0, 20);
      }

      return stops;
    } catch (error) {
      console.error('Error searching stops:', error);
      return [];
    }
  },

  // Plan trip between two stops
  async planTrip(originId: number, destId: number): Promise<TripPlan | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/trips.json?origin=${originId}&destination=${destId}&api-key=${API_KEY}`);
      const data = await response.json();
      const trip = data.trips?.[0];
      if (!trip) return null;
        const segments: TripSegment[] = (trip.segments || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (seg: any) => {
        const pts: string | undefined = seg.shape?.points;
        const path = pts
          ? pts
              .trim()
              .split(/\s+/)
              .map((p: string) => {
                const [lon, lat] = p.split(',').map(Number);
                return [lat, lon] as [number, number];
              })
          : [];
        const color =
          seg.route?.badge_style?.['background-color'] ||
          (seg.type === 'walk' ? '#6b7280' : '#0ea5e9');
        return {
          type: seg.type,
          route: seg.route ? { number: seg.route.number, name: seg.route.name } : undefined,
          from: seg.from,
          to: seg.to,
          times: {
            start: seg.times?.start || seg.times?.departure,
            end: seg.times?.end || seg.times?.arrival,
          },
          shape: seg.shape,
          path,
          color,
        } as TripSegment;
      });
      return { segments };
    } catch (error) {
      console.error('Error planning trip:', error);
      return null;
    }
  },
  // Get stop information by ID
  async getStop(stopId: number): Promise<TransitStop | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/stops/${stopId}.json?api-key=${API_KEY}`
      );
      const data = await response.json();
      return data.stop ? normalizeStop(data.stop) : null;
    } catch (error) {
      console.error('Error fetching stop:', error);
      return null;
    }
  }
};