import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransitStop, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Search, MapPin, Clock, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StopSearchProps {
  onStopSelect: (stop: TransitStop) => void;
  className?: string;
}

export function StopSearch({ onStopSelect, className }: StopSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TransitStop[]>([]);
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearby, setNearby] = useState<TransitStop[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Try to get user geolocation once to improve search relevance
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Load nearby stops when idle or location changes
  useEffect(() => {
    const load = async () => {
      setLoadingNearby(true);
      try {
        const [lat, lon] = userLocation ?? [49.8951, -97.1384];
        const stops = await winnipegTransitAPI.getStopsNear(lat, lon, 1500);
        setNearby(stops.slice(0, 12));
      } catch (e) {
        console.error('Nearby load error', e);
        setNearby([]);
      } finally {
        setLoadingNearby(false);
      }
    };
    if (query.trim().length < 2) load();
  }, [userLocation, query]);

  useEffect(() => {
    const searchStops = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const [lat, lon] = userLocation ?? [49.8951, -97.1384]; // Winnipeg centre fallback
        const stops = await winnipegTransitAPI.searchStops(query.trim(), {
          lat,
          lon,
          distance: 6000,
          route: route.trim() || undefined,
        });
        setResults(stops.slice(0, 12)); // Limit to 12 results
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchStops, 350);
    return () => clearTimeout(debounceTimeout);
  }, [query, userLocation, route]);

  const handleStopSelect = (stop: TransitStop) => {
    setQuery(stop.name);
    setShowResults(false);
    onStopSelect(stop);
  };

  const locateNow = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stops by name or number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 shadow-card rounded-xl bg-background/60 backdrop-blur-md"
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
          />
        </div>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by route number (optional)"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="pl-10 pr-4 shadow-card rounded-xl bg-background/60 backdrop-blur-md"
          />
        </div>
      </div>

      {/* Search dropdown results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-elegant max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((stop) => (
                  <Button
                    key={stop.key}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 rounded-none"
                    onClick={() => handleStopSelect(stop)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{stop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stop #{stop.number}
                          {stop.direction ? ` • ${stop.direction}` : ''}
                          {stop.side ? ` ${stop.side}` : ''}
                        </p>
                        {typeof stop.distances?.direct === 'number' && (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(stop.distances!.direct!)}m away
                          </p>
                        )}
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No stops found matching "{query}"</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Nearby stops section */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Nearby stops</p>
          <Button variant="secondary" size="sm" onClick={locateNow}>
            <MapPin className="w-3 h-3 mr-2" /> Use my location
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loadingNearby ? (
              <div className="p-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {nearby.slice(0, 8).map((stop) => (
                  <Button
                    key={stop.key}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 rounded-none"
                    onClick={() => handleStopSelect(stop)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{stop.name}</p>
                        <p className="text-xs text-muted-foreground">Stop #{stop.number}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
