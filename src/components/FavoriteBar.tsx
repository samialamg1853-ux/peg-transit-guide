import React, { useEffect, useState } from 'react';
import { FavoriteStop, getFavorites } from '@/lib/favorites';
import { Button } from '@/components/ui/button';
import { TransitStop } from '@/services/winnipegtransit';
import { cn } from '@/lib/utils';

interface FavoriteBarProps {
  onStopSelect: (stop: TransitStop) => void;
  className?: string;
}

export function FavoriteBar({ onStopSelect, className }: FavoriteBarProps) {
  const [favorites, setFavorites] = useState<FavoriteStop[]>([]);

  useEffect(() => {
    const load = () => setFavorites(getFavorites());
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  if (!favorites.length) return null;

  const handleSelect = (fav: FavoriteStop) => {
    const stop: TransitStop = {
      ...fav,
      geographic: { latitude: 0, longitude: 0 },
    };
    onStopSelect(stop);
  };

  return (
    <div className={cn('border-b bg-background', className)}>
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-2">
          {favorites.map((stop) => (
            <Button
              key={stop.key}
              size="sm"
              variant="secondary"
              className="flex-shrink-0 whitespace-nowrap"
              onClick={() => handleSelect(stop)}
            >
              {stop.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

