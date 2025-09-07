import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransitStop, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Search, MapPin, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StopSearchProps {
  onStopSelect: (stop: TransitStop) => void;
  className?: string;
}

export function StopSearch({ onStopSelect, className }: StopSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TransitStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchStops = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const stops = await winnipegTransitAPI.searchStops(query.trim());
        setResults(stops.slice(0, 10)); // Limit to 10 results
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchStops, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleStopSelect = (stop: TransitStop) => {
    setQuery(stop.name);
    setShowResults(false);
    onStopSelect(stop);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search stops by name or number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 shadow-card"
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
      </div>

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
                          Stop #{stop.number} • {stop.direction} {stop.side}
                        </p>
                        {stop.distances && (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(stop.distances.walking)}m away
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
    </div>
  );
}