import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TransitStop, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom transit stop icon
const transitStopIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
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
}

// Component to handle map interactions
function MapController({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap();

  const locateUser = () => {
    map.locate({ setView: true, maxZoom: 16 });
  };

  useEffect(() => {
    map.on('locationfound', (e) => {
      onLocationFound(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.off('locationfound');
    };
  }, [map, onLocationFound]);

  return (
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
  );
}

export function TransitMap({ onStopSelect, selectedStop, className }: TransitMapProps) {
  const [stops, setStops] = useState<TransitStop[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([49.8951, -97.1384]); // Winnipeg center

  const handleLocationFound = async (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    setMapCenter([lat, lng]);
    
    // Fetch nearby stops
    const nearbyStops = await winnipegTransitAPI.getStopsNear(lat, lng, 1000);
    setStops(nearbyStops);
  };

  useEffect(() => {
    // Load some initial stops around Winnipeg downtown
    winnipegTransitAPI.getStopsNear(49.8951, -97.1384, 2000).then(setStops);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController onLocationFound={handleLocationFound} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Transit stop markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.key}
            position={[stop.geographic.latitude, stop.geographic.longitude]}
            icon={transitStopIcon}
            eventHandlers={{
              click: () => onStopSelect?.(stop),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-foreground mb-1">{stop.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Stop #{stop.number} • {stop.direction} {stop.side}
                </p>
                {stop.distances && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {Math.round(stop.distances.walking)}m walking distance
                  </p>
                )}
                <Button 
                  size="sm" 
                  onClick={() => onStopSelect?.(stop)}
                  className="w-full"
                >
                  View Schedule
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}