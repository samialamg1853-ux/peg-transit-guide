import React, { useEffect, useMemo, useState } from 'react';
import { TransitStop, StopSchedule as StopScheduleType, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, RefreshCw, Bus, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';

interface StopScheduleProps {
  stop: TransitStop;
  onClose?: () => void;
}

function formatTime(timeString: string): string {
  try {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return timeString;
  }
}

function getTimeUntil(timeString: string): string {
  try {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = time.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 0) return 'Departed';
    if (diffMins === 0) return 'Now';
    if (diffMins === 1) return '1 min';
    return `${diffMins} mins`;
  } catch {
    return 'Unknown';
  }
}

export function StopSchedule({ stop, onClose }: StopScheduleProps) {
  const [schedule, setSchedule] = useState<StopScheduleType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const scheduleData = await winnipegTransitAPI.getStopSchedule(stop.key);
      setSchedule(scheduleData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [stop.key]);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            {stop.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No schedule data available</p>
          <Button onClick={fetchSchedule} className="mt-4 w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const routeSchedules = Array.isArray(schedule["route-schedules"]) ? schedule["route-schedules"] : [];
  const hasRouteSchedules = Array.isArray(schedule["route-schedules"]);

  return (
    <Card className="w-full max-w-md shadow-card bg-gradient-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bus className="w-5 h-5 text-primary" />
              {stop.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              Stop #{stop.number} • {stop.direction} {stop.side}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isFavorite(stop.key)) {
                  removeFavorite(stop.key);
                } else {
                  addFavorite({ key: stop.key, name: stop.name, number: stop.number, direction: stop.direction, side: stop.side });
                }
              }}
              title="Toggle favorite"
            >
              <Star className={`w-4 h-4 ${isFavorite(stop.key) ? 'text-accent' : 'text-muted-foreground'}`} />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} title="Close">
                ×
              </Button>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSchedule}
          className="w-full mt-2"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasRouteSchedules ? (
          <p className="text-muted-foreground text-center py-4">
            Schedule information unavailable
          </p>
        ) : routeSchedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No buses scheduled at this time
          </p>
        ) : (
          <div className="space-y-4">
            {routeSchedules.map((route: any) => {
              const badgeStyle = route.badge_style || route["badge-style"] || {};
              const badgeBg = badgeStyle["background-color"] || 'hsl(var(--primary))';
              const badgeColor = badgeStyle.color || 'hsl(var(--primary-foreground))';
              const badgeLabel = route.badge_label || route["badge-label"] || route.number || 'Route';
              const routeName = route.name || route.route?.name || `Route ${route.number || ''}`;

              const times = Array.isArray(route.times)
                ? route.times
                : Array.isArray(route["scheduled-stops"]) 
                  ? route["scheduled-stops"].map((s: any) => s.times).filter(Boolean)
                  : [];

              return (
                <div key={route.key || route.route?.key || routeName} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-xs px-2 py-1"
                      style={{ backgroundColor: badgeBg, color: badgeColor }}
                    >
                      {badgeLabel}
                    </Badge>
                    <span className="font-medium text-sm">{routeName}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {times.slice(0, 3).map((time: any, index: number) => {
                      const isEstimated = !!time?.departure?.estimated;
                      const departureTime = time?.departure?.estimated || time?.departure?.scheduled;
                      
                      if (!departureTime) return null;
                      return (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatTime(departureTime)}
                            </span>
                            {isEstimated && (
                              <Badge variant="secondary" className="text-xs">
                                Live
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {getTimeUntil(departureTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
