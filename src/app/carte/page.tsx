// src/app/carte/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { Search, Filter, MapPin, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Event } from '@/types/event';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const InteractiveMap = dynamic(
  () => import('@/components/layout/carte/InteractiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    )
  }
);

// Données fictives d'événements
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Festival de Musique Occitane',
    description: 'Grand festival de musique traditionnelle occitane avec des artistes locaux et internationaux. Découvrez les sonorités authentiques de notre région dans un cadre exceptionnel.',
    start_date: '2024-07-15T18:00:00Z',
    end_date: '2024-07-17T22:00:00Z',
    location: 'Place du Capitole, Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    category: 'festival' as const,
    organizer: 'Ville de Toulouse',
    price: 25,
    website_url: 'https://festival-toulouse.fr',
    contact_email: 'contact@festival-toulouse.fr',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    title: 'Exposition "L\'Héritage Cathare"',
    description: 'Plongez dans l\'histoire fascinante des Cathares en Occitanie. Une exposition interactive avec des objets d\'époque et des reconstitutions.',
    start_date: '2024-08-01T10:00:00Z',
    end_date: '2024-08-31T18:00:00Z',
    location: 'Musée de la Cité, Carcassonne',
    latitude: 43.2130,
    longitude: 2.3491,
    category: 'exposition' as const,
    organizer: 'Musée de Carcassonne',
    price: 12,
    website_url: 'https://musee-carcassonne.fr',
    contact_email: 'info@musee-carcassonne.fr',
    image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T16:00:00Z',
  },
  {
    id: '3',
    title: 'Concert de Cornemuses Traditionnelles',
    description: 'Soirée musicale dédiée aux cornemuses occitanes. Un voyage sonore à travers les traditions musicales de notre région.',
    start_date: '2024-08-20T20:00:00Z',
    end_date: '2024-08-20T23:00:00Z',
    location: 'Opéra Comédie, Montpellier',
    latitude: 43.6110,
    longitude: 3.8767,
    category: 'concert' as const,
    organizer: 'Association Musicale du Languedoc',
    price: 15,
    website_url: 'https://concert-montpellier.fr',
    contact_email: 'contact@concert-montpellier.fr',
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop',
    created_at: '2024-01-12T11:00:00Z',
    updated_at: '2024-01-19T13:45:00Z',
  },
  {
    id: '4',
    title: 'Conférence "Langue Occitane Aujourd\'hui"',
    description: 'Table ronde sur l\'état actuel de la langue occitane et ses perspectives d\'avenir. Avec des linguistes et des acteurs culturels.',
    start_date: '2024-09-05T14:00:00Z',
    end_date: '2024-09-05T17:00:00Z',
    location: 'Université Paul Valéry, Montpellier',
    latitude: 43.6319,
    longitude: 3.8570,
    category: 'conference' as const,
    organizer: 'Université Paul Valéry',
    price: 0,
    website_url: 'https://univ-montpellier3.fr',
    contact_email: 'conferences@univ-montpellier3.fr',
    image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    created_at: '2024-01-08T15:00:00Z',
    updated_at: '2024-01-22T10:15:00Z',
  },
  {
    id: '5',
    title: 'Atelier de Cuisine Traditionnelle',
    description: 'Apprenez à cuisiner les spécialités occitanes avec un chef local. De la cassoulet au pastel de nata, découvrez nos saveurs.',
    start_date: '2024-09-12T10:00:00Z',
    end_date: '2024-09-12T16:00:00Z',
    location: 'École Culinaire, Albi',
    latitude: 43.9297,
    longitude: 2.1480,
    category: 'atelier' as const,
    organizer: 'École Culinaire d\'Albi',
    price: 45,
    website_url: 'https://ecole-culinaire-albi.fr',
    contact_email: 'ateliers@ecole-culinaire-albi.fr',
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
    created_at: '2024-01-20T12:30:00Z',
    updated_at: '2024-01-25T09:20:00Z',
  },
];

const categories = [
  { key: 'all', label: 'Tous les événements', count: mockEvents.length },
  { key: 'festival', label: 'Festivals', count: mockEvents.filter(e => e.category === 'festival').length },
  { key: 'concert', label: 'Concerts', count: mockEvents.filter(e => e.category === 'concert').length },
  { key: 'exposition', label: 'Expositions', count: mockEvents.filter(e => e.category === 'exposition').length },
  { key: 'conference', label: 'Conférences', count: mockEvents.filter(e => e.category === 'conference').length },
  { key: 'atelier', label: 'Ateliers', count: mockEvents.filter(e => e.category === 'atelier').length },
];

const locations = [
  { key: 'all', label: 'Toutes les villes' },
  { key: 'toulouse', label: 'Toulouse' },
  { key: 'montpellier', label: 'Montpellier' },
  { key: 'carcassonne', label: 'Carcassonne' },
  { key: 'albi', label: 'Albi' },
  { key: 'nimes', label: 'Nîmes' },
  { key: 'perpignan', label: 'Perpignan' },
];

export default function CartePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = mockEvents.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || 
      event.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesLocation && matchesSearch;
  });

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe avec z-index approprié */}
      <div className="bg-white shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carte Interactive</h1>
              <p className="mt-2 text-gray-600">
                Explorez {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} culturel{filteredEvents.length > 1 ? 's' : ''} en Occitanie
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal avec z-index correct */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Panneau de filtres - largeur fixe */}
            <div className={`w-80 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Recherche */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Rechercher</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Rechercher un événement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Filtres par catégorie */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Catégories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => setSelectedCategory(category.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.key
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.label}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Filtres par lieu */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Villes</h3>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <button
                        key={location.key}
                        onClick={() => setSelectedLocation(location.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedLocation === location.key
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {location.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte - prend le reste de l'espace */}
            <div className="flex-1 min-w-0">
              <Card>
                <CardContent className="p-0">
                  <div className="h-96 md:h-[600px] rounded-lg overflow-hidden relative z-0">
                    <InteractiveMap 
                      events={filteredEvents}
                      selectedCategory={selectedCategory}
                      selectedLocation={selectedLocation}
                      onEventSelect={setSelectedEvent}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal détail événement avec z-index élevé */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Détails de l'événement"
        className="max-w-2xl relative z-50"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.image_url && (
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedEvent.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-b">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">Date et heure</div>
                  <div className="text-sm text-gray-600">
                    {formatEventDate(selectedEvent.start_date)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">Lieu</div>
                  <div className="text-sm text-gray-600">
                    {selectedEvent.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-lg text-gray-900">
                  {selectedEvent.price === 0 ? 'Gratuit' : `${selectedEvent.price}€`}
                </div>
                <div className="text-xs text-gray-600">Prix</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-lg text-gray-900 capitalize">
                  {selectedEvent.category}
                </div>
                <div className="text-xs text-gray-600">Catégorie</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-lg text-gray-900">
                  {selectedEvent.organizer}
                </div>
                <div className="text-xs text-gray-600">Organisateur</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {selectedEvent.website_url && (
                <Button
                  className="flex-1"
                  onClick={() => window.open(selectedEvent.website_url, '_blank')}
                >
                  Visiter le site web
                </Button>
              )}
              
              {selectedEvent.contact_email && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`mailto:${selectedEvent.contact_email}`, '_blank')}
                >
                  Contacter l'organisateur
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}