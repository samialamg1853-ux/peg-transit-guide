import React, { useState } from 'react';
import { StopSearch } from './StopSearch';
import { TransitStop, TripPlan, winnipegTransitAPI } from '@/services/winnipegtransit';
import { Button } from '@/components/ui/button';

interface TripPlannerProps {
  onTripPlanned?: (trip: TripPlan | null) => void;
}

export function TripPlanner({ onTripPlanned }: TripPlannerProps) {
  const [origin, setOrigin] = useState<TransitStop | null>(null);
  const [destination, setDestination] = useState<TransitStop | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const trip = await winnipegTransitAPI.planTrip(origin.key, destination.key);
      onTripPlanned?.(trip);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <StopSearch onStopSelect={setOrigin} className="mb-2" />
      <StopSearch onStopSelect={setDestination} className="mb-2" />
      <Button onClick={handlePlan} disabled={!origin || !destination || loading} className="w-full">
        {loading ? 'Planning...' : 'Plan Trip'}
      </Button>
    </div>
  );
}

export default TripPlanner;
