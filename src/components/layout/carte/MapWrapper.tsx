// src/components/carte/MapWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '@/types/event';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const InteractiveMap = dynamic(
  () => import('./InteractiveMap'),
  {
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

interface MapWrapperProps {
  events: Event[];
  selectedCategory?: string;
  selectedLocation?: string;
  onEventSelect?: (event: Event) => void;
}

export function MapWrapper({ 
  events, 
  selectedCategory, 
  selectedLocation, 
  onEventSelect 
}: MapWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Initialisation de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <InteractiveMap
      events={events}
      selectedCategory={selectedCategory}
      selectedLocation={selectedLocation}
      onEventSelect={onEventSelect}
    />
  );
}