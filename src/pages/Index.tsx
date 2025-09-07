import React, { useState } from 'react';
import { TransitMap } from '@/components/TransitMap';
import { StopSchedule } from '@/components/StopSchedule';
import { StopSearch } from '@/components/StopSearch';
import { FavoriteStops } from '@/components/FavoriteStops';
import { TripPlanner } from '@/components/TripPlanner';
import { RouteTimeline } from '@/components/RouteTimeline';
import { TripPlan, TransitStop } from '@/services/winnipegtransit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Clock, Navigation, Search, MapPin } from 'lucide-react';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { BottomSheet } from '@/components/ui/BottomSheet';

const Index = () => {
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [locateUser, setLocateUser] = useState<() => void>(() => {});
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);

  const handleStopSelect = (stop: TransitStop) => {
    setSelectedStop(stop);
    setShowSchedule(true);
    setSheetOpen(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
    setSelectedStop(null);
  };

  const handleTripPlanned = (t: TripPlan | null) => {
    setTrip(t);
    setSheetOpen(true);
  };

  const handleMapClick = () => {
    setSheetOpen(false);
    setShowSchedule(false);
    setSelectedStop(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg backdrop-blur-sm">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Winnipeg Transit</h1>
                <p className="text-primary-foreground/80 text-sm">Live bus schedules & navigation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={locateUser}
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Map with Bottom Sheet */}
      <div className="relative flex-1">
        <TransitMap
          tripPaths={trip ? trip.segments.map((s) => s.path || []) : undefined}
          onStopSelect={handleStopSelect}
          selectedStop={selectedStop || undefined}
          className="absolute inset-0"
          onLocateUser={setLocateUser}
          onMapClick={handleMapClick}
        />

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <div className="space-y-4">
            {/* Trip Planner */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Plan a Trip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TripPlanner onTripPlanned={handleTripPlanned} />
              </CardContent>
            </Card>

            {/* Search */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5 text-primary" />
                  Find a Stop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StopSearch onStopSelect={handleStopSelect} />
              </CardContent>
            </Card>

            {/* Favorite Stops */}
            <FavoriteStops onStopSelect={handleStopSelect} className="shadow-card" />

            {trip && (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Trip Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <RouteTimeline segments={trip.segments} />
                </CardContent>
              </Card>
            )}

            {/* Schedule Display */}
            {showSchedule && selectedStop ? (
              <StopSchedule stop={selectedStop} onClose={handleCloseSchedule} />
            ) : (
              <Card className="shadow-card bg-gradient-card">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Real-time Schedules</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Select a stop on the map or search above to view live bus arrival times
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-transit-blue rounded-full"></div>
                      <span>Regular Route</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-transit-green rounded-full"></div>
                      <span>Express Route</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
};

export default Index;
