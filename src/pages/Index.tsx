import React, { useState } from 'react';
import { TransitMap } from '@/components/TransitMap';
import { StopSchedule } from '@/components/StopSchedule';
import { StopSearch } from '@/components/StopSearch';
import { FavoriteStops } from '@/components/FavoriteStops';
import { TransitStop } from '@/services/winnipegtransit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, MapPin, Clock, Navigation, Search } from 'lucide-react';

const Index = () => {
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [locateUser, setLocateUser] = useState<() => void>(() => {});

  const handleStopSelect = (stop: TransitStop) => {
    setSelectedStop(stop);
    setShowSchedule(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
    setSelectedStop(null);
  };

  return (
    <div className="min-h-screen bg-background">
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
      </header>

      <div className="container mx-auto p-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Search and Schedule Panel */}
          <div className="lg:col-span-1 space-y-4">
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
            <FavoriteStops onStopSelect={handleStopSelect} />

            {/* Schedule Display */}
            {showSchedule && selectedStop ? (
              <StopSchedule
                stop={selectedStop}
                onClose={handleCloseSchedule}
              />
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

            {/* Quick Info */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-xs text-muted-foreground">Service Hours</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">Live</div>
                    <div className="text-xs text-muted-foreground">Real-time Data</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="shadow-card h-full">
              <CardContent className="p-0 h-full">
                <TransitMap
                  onStopSelect={handleStopSelect}
                  selectedStop={selectedStop || undefined}
                  className="h-full min-h-[400px] lg:min-h-full"
                  onLocateUser={setLocateUser}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
