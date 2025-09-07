import React, { useEffect, useState } from 'react';
import { FavoriteStop, getFavorites } from '@/lib/favorites';
import { TransitStop } from '@/services/winnipegtransit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star } from 'lucide-react';

interface FavoriteStopsProps {
  onStopSelect: (stop: TransitStop) => void;
  className?: string;
}

export function FavoriteStops({ onStopSelect, className }: FavoriteStopsProps) {
  const [favorites, setFavorites] = useState<FavoriteStop[]>([]);

  useEffect(() => {
    const load = () => setFavorites(getFavorites());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const handleSelect = (fav: FavoriteStop) => {
    const stop: TransitStop = {
      ...fav,
      geographic: { latitude: 0, longitude: 0 },
    };
    onStopSelect(stop);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="w-5 h-5 text-primary" />
          Favorite Stops
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {favorites.length ? (
          <div className="divide-y divide-border">
            {favorites.map((stop) => (
              <Button
                key={stop.key}
                variant="ghost"
                className="w-full justify-start h-auto p-3 rounded-none"
                onClick={() => handleSelect(stop)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stop #{stop.number}
                      {stop.direction ? ` • ${stop.direction}` : ''}
                      {stop.side ? ` ${stop.side}` : ''}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-4">No favorite stops yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default FavoriteStops;
