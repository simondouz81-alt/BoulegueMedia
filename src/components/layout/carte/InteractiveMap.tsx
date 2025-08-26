// src/components/layout/carte/InteractiveMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { Calendar, MapPin, Euro, ExternalLink } from 'lucide-react';
import { Event } from '@/types/event';

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== 'undefined') {
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Créer des icônes colorées avec DivIcon
const createCategoryIcon = (category: string, color: string) => {
  const iconEmojis = {
    festival: '🎭',
    concert: '🎵',
    exposition: '🎨',
    conference: '🎤',
    atelier: '🛠️',
    autre: '📍',
  };

  return new DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">
        ${iconEmojis[category as keyof typeof iconEmojis] || iconEmojis.autre}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Icônes personnalisées par catégorie avec couleurs
const categoryIcons = {
  festival: createCategoryIcon('festival', '#8b5cf6'),
  concert: createCategoryIcon('concert', '#3b82f6'),
  exposition: createCategoryIcon('exposition', '#10b981'),
  conference: createCategoryIcon('conference', '#f59e0b'),
  atelier: createCategoryIcon('atelier', '#ec4899'),
  autre: createCategoryIcon('autre', '#6b7280'),
};

interface InteractiveMapProps {
  events: Event[];
  selectedCategory?: string;
  selectedLocation?: string;
  onEventSelect?: (event: Event) => void;
}

export default function InteractiveMap({ 
  events, 
  selectedCategory, 
  selectedLocation, 
  onEventSelect 
}: InteractiveMapProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  // Position centrée sur l'Occitanie
  const defaultCenter: [number, number] = [43.6047, 1.4442]; // Toulouse
  const defaultZoom = 8;

  useEffect(() => {
    let filtered = events;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedLocation && selectedLocation !== 'all') {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedCategory, selectedLocation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      festival: 'bg-purple-500',
      concert: 'bg-blue-500',
      exposition: 'bg-green-500',
      conference: 'bg-amber-500',
      atelier: 'bg-pink-500',
      autre: 'bg-gray-500',
    };
    return colors[category as keyof typeof colors] || colors.autre;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      festival: 'Festival',
      concert: 'Concert',
      exposition: 'Exposition',
      conference: 'Conférence',
      atelier: 'Atelier',
      autre: 'Autre',
    };
    return labels[category as keyof typeof labels] || 'Autre';
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={categoryIcons[event.category] || categoryIcons.autre}
            eventHandlers={{
              click: () => {
                onEventSelect?.(event);
              },
            }}
          >
            <Popup 
              className="custom-leaflet-popup" 
              maxWidth={320}
              minWidth={280}
              closeButton={true}
              autoClose={false}
              closeOnClick={false}
            >
              <div className="p-2">
                {/* Image de l'événement */}
                {event.image_url && (
                  <div className="mb-3">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-28 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Header avec titre et catégorie */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-base text-gray-900 pr-2 flex-1 leading-tight">
                    {event.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getCategoryColor(event.category)} whitespace-nowrap`}>
                    {getCategoryLabel(event.category)}
                  </span>
                </div>
                
                {/* Description courte */}
                <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2">
                  {event.description}
                </p>
                
                {/* Informations essentielles */}
                <div className="space-y-2 text-sm mb-3">
                  {/* Date */}
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium text-xs">
                      {formatDate(event.start_date)} à {formatTime(event.start_date)}
                    </span>
                  </div>
                  
                  {/* Lieu */}
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium text-xs">{event.location}</span>
                  </div>
                  
                  {/* Prix */}
                  {event.price !== null && event.price !== undefined && (
                    <div className="flex items-center text-gray-700">
                      <Euro className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-medium text-xs">
                        {event.price === 0 ? 'Gratuit' : `${event.price}€`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onEventSelect?.(event)}
                    className="flex-1 bg-orange-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Voir détails
                  </button>
                  
                  {event.website_url && (
                    <a
                      href={event.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-50 transition-colors text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Site web
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">Catégories</h4>
        <div className="space-y-1">
          {Object.entries(categoryIcons).map(([category, icon]) => (
            <div key={category} className="flex items-center text-xs">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
              </div>
              <span className="capitalize font-medium text-xs">
                {getCategoryLabel(category)}
              </span>
              <span className="ml-1 text-xs text-gray-500">
                ({filteredEvents.filter(e => e.category === category).length})
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          Total: {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}