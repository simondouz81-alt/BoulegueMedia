// src/app/carte/page.tsx 
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, MapPin, RefreshCw, AlertCircle, BarChart3, Bug, TestTube } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Event } from '@/types/event';
import { useCorrectedMapEvents } from '@/hooks/useCorrectedEvents';
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

const categories = [
  { key: 'all', label: 'Tous les éléments', icon: '🎯' },
  { key: 'festival', label: 'Festivals', icon: '🎭' },
  { key: 'concert', label: 'Concerts', icon: '🎵' },
  { key: 'exposition', label: 'Expositions & Musées', icon: '🎨' },
  { key: 'conference', label: 'Conférences', icon: '🎤' },
  { key: 'atelier', label: 'Ateliers', icon: '🛠️' },
  { key: 'autre', label: 'Autres', icon: '📍' },
];

const locations = [
  { key: 'all', label: 'Toutes les villes' },
  { key: 'toulouse', label: 'Toulouse' },
  { key: 'montpellier', label: 'Montpellier' },
  { key: 'carcassonne', label: 'Carcassonne' },
  { key: 'albi', label: 'Albi' },
  { key: 'nimes', label: 'Nîmes' },
  { key: 'perpignan', label: 'Perpignan' },
  { key: 'beziers', label: 'Béziers' },
];

export default function CartePage() {
  const {
    events,
    allEvents,
    loading,
    error,
    lastUpdate,
    stats,
    totalEvents,
    mappableEvents,
    loadEvents,
    enableDebug,
    disableDebug,
    testApi,
    refreshEvents
  } = useCorrectedMapEvents();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // CORRECTION: Filtrage avec useMemo pour éviter les re-rendus inutiles
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.organizer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, selectedCategory, selectedLocation, searchTerm]);

  // Vérifier si le debug est activé (une seule fois)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugMode(localStorage.getItem('debug_events') === 'true');
    }
  }, []);

  // CORRECTION: Fonctions de comptage avec useMemo
  const getCategoryCount = useCallback((categoryKey: string) => {
    if (categoryKey === 'all') return events.length;
    return events.filter(event => event.category === categoryKey).length;
  }, [events]);

  const formatEventDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  }, []);

  // CORRECTION: Fonctions de debug stabilisées avec useCallback
  const toggleDebug = useCallback(() => {
    if (debugMode) {
      disableDebug();
      setDebugMode(false);
    } else {
      enableDebug();
      setDebugMode(true);
    }
  }, [debugMode, enableDebug, disableDebug]);

  const testAllApis = useCallback(async () => {
    console.log('🧪 Test de toutes les APIs...');
    const apis = [
      // APIs Région Occitanie
      'OCCITANIE_MUSEES',
      'OCCITANIE_SORTIES', 
      'FETE_SCIENCE',
      'UNESCO_SITES',
      'MRAC_MUSEES',
      // APIs OpenData vérifiées
      'OPENAGENDA_PUBLIC',
      'TOULOUSE_EVENTS',
      'OSM_PATRIMOINE_HISTORIQUE',
      'OSM_BIBLIOTHEQUES',
      'OSM_INSTALLATIONS_SPORTIVES',
      'OSM_SERVICES_PUBLICS',
      'PARKINGS_FRANCE'
    ];
    
    for (const api of apis) {
      try {
        console.log(`\n🔍 Test ${api}:`);
        await testApi(api);
      } catch (error) {
        console.error(`❌ ${api} échoué:`, error);
      }
    }
  }, [testApi]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec informations */}
      <div className="bg-white shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carte Interactive Occitanie</h1>
              <div className="mt-2 flex items-center space-x-4">
                <p className="text-gray-600">
                  {loading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Chargement des données...
                    </span>
                  ) : (
                    `${filteredEvents.length} élément${filteredEvents.length > 1 ? 's' : ''} affiché${filteredEvents.length > 1 ? 's' : ''}`
                  )}
                </p>
                {totalEvents > 0 && (
                  <span className="text-sm text-gray-500">
                    ({mappableEvents}/{totalEvents} géolocalisés)
                  </span>
                )}
                {lastUpdate && (
                  <p className="text-sm text-gray-500">
                    MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Boutons de debug */}
              {debugMode && (
                <>
                  <Button
                    variant="outline"
                    onClick={testAllApis}
                    className="flex items-center space-x-2 text-purple-600 border-purple-300"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>Test APIs</span>
                  </Button>
                </>
              )}

              <Button
                variant={debugMode ? "default" : "outline"}
                onClick={toggleDebug}
                className={`flex items-center space-x-2 ${debugMode ? 'bg-purple-600 text-white' : 'text-purple-600 border-purple-300'}`}
              >
                <Bug className="w-4 h-4" />
                <span>Debug</span>
              </Button>

              {stats && (
                <Button
                  variant="outline"
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Stats</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={refreshEvents}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>

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

          {/* Bannière d'information sur les sources */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">12 sources de données vérifiées</h4>
                <p className="text-blue-800 text-sm mt-1">
                  Région Occitanie + OpenDataSoft + OpenStreetMap • APIs réellement fonctionnelles
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">18 sources de données Occitanie + OpenData</h4>
                <p className="text-blue-800 text-sm mt-1">
                  Événements • Patrimoine • Musées • Sport • Festivals • Monuments • Bibliothèques • 100% gratuit
                </p>
              </div>
            </div>
          </div>

          {/* Message d'erreur avec debug */}
          {error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium">Attention</p>
                  <p className="text-yellow-700 text-sm mt-1">{error}</p>
                  {!debugMode && (
                    <button
                      onClick={toggleDebug}
                      className="text-yellow-800 text-sm underline mt-2 hover:no-underline"
                    >
                      Activer le mode debug pour plus d'infos
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panneau de debug */}
          {debugMode && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Bug className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-purple-900">Mode Debug Activé</h4>
                  <p className="text-purple-800 text-sm mt-1">
                    Consultez la console (F12) pour les logs détaillés des APIs
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={testAllApis}
                      className="bg-purple-600 text-white text-xs px-3 py-1 rounded hover:bg-purple-700"
                    >
                      Tester toutes les APIs
                    </button>
                    <button
                      onClick={() => console.log('Stats complètes:', stats)}
                      className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded hover:bg-purple-200"
                    >
                      Afficher stats complètes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Panneau de filtres */}
            <div className={`w-80 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Recherche */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-gray-500 mt-2">
                      {filteredEvents.length} résultat{filteredEvents.length > 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Catégories */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Catégories</h3>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const count = getCategoryCount(category.key);
                        return (
                          <button
                            key={category.key}
                            onClick={() => setSelectedCategory(category.key)}
                            disabled={count === 0}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedCategory === category.key
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : count === 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span>{category.icon}</span>
                                <span>{category.label}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                count === 0 
                                  ? 'bg-gray-100 text-gray-400' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {count}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Villes */}
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

              {/* Informations sources */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Sources de données</h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="font-medium text-gray-800 mb-2">Région Occitanie (5)</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Agenda Musées</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Sorties Participatives</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full" />
                      <span>Fête de la Science</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Sites UNESCO</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>Musées MRAC</span>
                    </div>
                    
                    <div className="font-medium text-gray-800 mb-2 mt-3">OpenDataSoft (6)</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <span>OpenAgenda Événements</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                      <span>Patrimoine Historique OSM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span>Bibliothèques OSM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full" />
                      <span>Installations Sportives OSM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span>Services Publics OSM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full" />
                      <span>Parkings France</span>
                    </div>
                    
                    <div className="font-medium text-gray-800 mb-2 mt-3">Ville (1)</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full" />
                      <span>Toulouse Métropole</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      12 APIs vérifiées et fonctionnelles
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte */}
            <div className="flex-1 min-w-0">
              <Card>
                <CardContent className="p-0">
                  <div className="h-96 md:h-[600px] rounded-lg overflow-hidden relative z-0">
                    {loading ? (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-center">
                          <LoadingSpinner size="lg" className="mb-4" />
                          <p className="text-gray-600">Chargement depuis 10 APIs vérifiées...</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Événements, musées, monuments, loisirs
                          </p>
                          {debugMode && (
                            <p className="text-purple-600 text-xs mt-2">
                              Mode debug: consultez la console
                            </p>
                          )}
                        </div>
                      </div>
                    ) : filteredEvents.length === 0 && !error ? (
                      <div className="flex items-center justify-center h-full bg-gray-50">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">Aucun élément trouvé</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Essayez de modifier vos filtres ou{' '}
                            <button 
                              onClick={toggleDebug}
                              className="text-purple-600 underline hover:no-underline"
                            >
                              activez le debug
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <InteractiveMap 
                        events={filteredEvents}
                        selectedCategory={selectedCategory}
                        selectedLocation={selectedLocation}
                        onEventSelect={setSelectedEvent}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal statistiques */}
      {stats && (
        <Modal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          title="Statistiques des données"
          className="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-800">Total éléments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.free}</div>
                <div className="text-sm text-green-800">Gratuits</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Par catégorie</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 capitalize">{category}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Principales villes</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCities)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([city, count]) => (
                      <div key={city} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{city}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sources de données</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(stats.bySource)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{source}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal détail événement */}
      <Modal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        title="Détails"
        className="max-w-2xl relative z-50"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.image_url && (
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
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
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Date</div>
                  <div className="text-sm text-gray-600">
                    {formatEventDate(selectedEvent.start_date)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Lieu</div>
                  <div className="text-sm text-gray-600">
                    {selectedEvent.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">
                  {selectedEvent.price === undefined ? 'N/A' : 
                   selectedEvent.price === 0 ? 'Gratuit' : `${selectedEvent.price}€`}
                </div>
                <div className="text-sm text-gray-600">Prix</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {categories.find(c => c.key === selectedEvent.category)?.icon} {selectedEvent.category}
                </div>
                <div className="text-sm text-gray-600">Type</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedEvent.organizer}
                </div>
                <div className="text-sm text-gray-600">Source</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {selectedEvent.website_url && (
                <Button
                  className="flex-1"
                  onClick={() => window.open(selectedEvent.website_url, '_blank')}
                >
                  Site web
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.location)}`;
                  window.open(googleMapsUrl, '_blank');
                }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Itinéraire
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}