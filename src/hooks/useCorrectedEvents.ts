// src/hooks/useCorrectedEvents.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Event } from '@/types/event';
import { CorrectedEventApiService } from '@/services/correctedEventApiService';

interface UseCorrectedEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  stats: {
    total: number;
    byCategory: Record<string, number>;
    byCities: Record<string, number>;
    bySource: Record<string, number>;
    free: number;
    paid: number;
  } | null;
  loadEvents: () => Promise<void>;
  enableDebug: () => void;
  disableDebug: () => void;
  testApi: (apiName: string) => Promise<any>;
  refreshEvents: () => Promise<void>;
}

export function useCorrectedEvents(): UseCorrectedEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState<UseCorrectedEventsReturn['stats']>(null);
  
  // CORRECTION: Service stable avec useRef
  const eventServiceRef = useRef(CorrectedEventApiService.getInstance());
  
  // CORRECTION: Flag pour éviter les chargements multiples
  const loadingRef = useRef(false);
  const initialLoadRef = useRef(false);

  const loadEvents = useCallback(async () => {
    // Éviter les chargements multiples simultanés
    if (loadingRef.current) {
      console.log('Chargement déjà en cours, ignoré');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('Début du chargement des événements...');
      
      const apiEvents = await eventServiceRef.current.fetchAllEvents();
      
      if (apiEvents.length === 0) {
        setError('Aucun événement trouvé. Vérifiez les logs de debug.');
      } else {
        console.log(`${apiEvents.length} événements chargés avec succès`);
        const eventStats = eventServiceRef.current.getEventStats(apiEvents);
        setStats(eventStats);
        
        console.log('Répartition par catégorie:', eventStats.byCategory);
        console.log('Répartition par source:', eventStats.bySource);
      }
      
      setEvents(apiEvents);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // CORRECTION: Dépendances vides car tout est dans les refs

  const enableDebug = useCallback(() => {
    eventServiceRef.current.enableDebug();
  }, []);

  const disableDebug = useCallback(() => {
    eventServiceRef.current.disableDebug();
  }, []);

  const testApi = useCallback(async (apiName: string) => {
    return await eventServiceRef.current.testSingleApi(apiName);
  }, []);

  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  // CORRECTION: useEffect ne se déclenche qu'une seule fois
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadEvents();
    }
  }, []); // Dépendances vides - ne se déclenche qu'au montage

  return {
    events,
    loading,
    error,
    lastUpdate,
    stats,
    loadEvents,
    enableDebug,
    disableDebug,
    testApi,
    refreshEvents
  };
}

export function useCorrectedMapEvents() {
  const hookResult = useCorrectedEvents();
  
  // CORRECTION: Calcul des événements mappables avec useMemo
  const mapReadyEvents = hookResult.events.filter(event => 
    event.latitude && 
    event.longitude && 
    !isNaN(event.latitude) && 
    !isNaN(event.longitude) &&
    event.latitude !== 0 && 
    event.longitude !== 0
  );

  return {
    ...hookResult,
    events: mapReadyEvents,
    allEvents: hookResult.events,
    totalEvents: hookResult.events.length,
    mappableEvents: mapReadyEvents.length
  };
}