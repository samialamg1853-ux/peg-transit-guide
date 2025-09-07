import React, { useEffect, useRef, useState } from 'react';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TransitStop, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { toastError } from '@/hooks/use-toast';

// Fix default marker icons
// @ts-expect-error Leaflet's typings omit this method
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom transit stop icon
const transitStopIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#0ea5e9" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="#0ea5e9"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface TransitMapProps {
  onStopSelect?: (stop: TransitStop) => void;
  selectedStop?: TransitStop;
  className?: string;
  onLocateUser?: (locateFn: () => void) => void;
  tripPaths?: { path: [number, number][]; color?: string }[];
}

export function TransitMap({
  onStopSelect,
  selectedStop,
  className,
  onLocateUser,
  tripPaths,
}: TransitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [currentCenter, setCurrentCenter] = useState<[number, number]>([49.8951, -97.1384]); // Winnipeg center

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentCenter,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layers
    const stopsLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;
    stopsLayerRef.current = stopsLayer;

    mapRef.current = map;

    // Ensure map sizes correctly after mount and on resize
    setTimeout(() => map.invalidateSize(), 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    // Initial stops load
    loadNearbyStops(currentCenter[0], currentCenter[1], 2000);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      stopsLayerRef.current = null;
      routeLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: Load nearby stops and render markers
  const loadNearbyStops = async (lat: number, lng: number, distance = 1000) => {
    try {
      const stops = await winnipegTransitAPI.getStopsNear(lat, lng, distance);
      renderStops(stops);
    } catch (e) {
      console.error('Failed to load nearby stops', e);
    }
  };

  const renderStops = (stops: TransitStop[]) => {
    const map = mapRef.current;
    const layer = stopsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    stops.forEach((stop) => {
      const marker = L.marker([stop.geographic.latitude, stop.geographic.longitude], {
        icon: transitStopIcon,
        title: stop.name,
      });

      const popupHtml = `
        <div style="min-width:200px">
          <h3 style="margin:0 0 4px 0;font-weight:600;color:var(--foreground)">${stop.name}</h3>
          <p style="margin:0 0 8px 0;color:var(--muted-foreground);font-size:12px">
            Stop #${stop.number} • ${stop.direction} ${stop.side}
          </p>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onStopSelect?.(stop));
      marker.addTo(layer);
    });
  };

  // Locate user and fetch nearby stops
  const locateUser = () => {
    if (!mapRef.current) return;
    if (!navigator.geolocation) {
      toastError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCenter([latitude, longitude]);
        mapRef.current!.setView([latitude, longitude], 15, { animate: true });

        // User marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          userMarkerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current!);
          userMarkerRef.current.bindPopup('<div style="text-align:center"><b>Your Location</b></div>');
        }

        await loadNearbyStops(latitude, longitude, 1000);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toastError(
            'Location access was denied. Please enable location permissions in your browser settings.',
            'Permission Denied'
          );
        } else {
          toastError(err.message || 'Failed to retrieve your location.', 'Geolocation Error');
        }
      },
      { enableHighAccuracy: true }
    );
  };

  // Expose locate function to parent
  useEffect(() => {
    onLocateUser?.(locateUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLocateUser]);

  // Center on selected stop
  useEffect(() => {
    if (!selectedStop || !mapRef.current) return;
    mapRef.current.setView(
      [selectedStop.geographic.latitude, selectedStop.geographic.longitude],
      16,
      { animate: true }
    );
  }, [selectedStop]);

  // Draw planned trip paths
  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!tripPaths || !tripPaths.length) return;
    tripPaths.forEach((p) => {
      if (!p.path.length) return;
      L.polyline(p.path, { color: p.color || "#0ea5e9", weight: 4 }).addTo(layer);
    });
    if (map) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [tripPaths]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] rounded-lg" />
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={locateUser}
          size="sm"
          variant="secondary"
          className="shadow-card bg-card/90 backdrop-blur-sm hover:bg-card"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-md shadow-card">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Tap a stop to view schedule</span>
        </div>
      </div>
    </div>
  );
}
