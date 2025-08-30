// src/services/correctedEventApiService.ts
import { Event } from '@/types/event';

interface OpenDataSoftEvent {
  fields: {
    // Champs de base
    nom_manifestation?: string;
    nom_de_la_manifestation?: string;
    title?: string;
    titre?: string;
    titre_fr?: string;
    description?: string;
    
    // Dates
    debut_manifestation?: string;
    date_de_debut?: string;
    date_debut?: string;
    dates?: string;
    firstdate_begin?: string;
    fin_manifestation?: string;
    date_de_fin?: string;
    date_fin?: string;
    lastdate_end?: string;
    
    // Lieux
    lieu_manifestation?: string;
    lieu_nom?: string;
    lieu?: string;
    adresse?: string;
    ville?: string;
    commune?: string;
    lib_commune?: string;
    location_city?: string;
    location_name?: string;
    location_address?: string;
    
    // Descriptions
    description_fr?: string;
    description_longue_fr?: string;
    longdescription_fr?: string;
    descriptif_court?: string;
    descriptif_long?: string;
    keywords_fr?: string;
    conditions_fr?: string;
    
    // Patrimoine/Musées/Équipements
    nom?: string;
    nom_site?: string;
    nom_musee?: string;
    nom_etablissement?: string;
    nom_equipement?: string;
    denomination?: string;
    intitule?: string;
    
    // Coordonnées
    geo_point_2d?: [number, number];
    geo_point?: { lon: number; lat: number };
    coordinates?: [number, number];
    latitude?: number;
    longitude?: number;
    coord_geo?: [number, number];
    coordonnees?: [number, number];
    geolocalisation?: { lon: number; lat: number };
    googlemap_latitude?: number;
    googlemap_longitude?: number;
    location_coordinates?: { lon: number; lat: number };
    location?: {
      lat: number;
      lon: number;
    } | [number, number];
    geometry?: {
      coordinates: [number, number];
      type: string;
    };
    
    // Types et catégories
    type_manifestation?: string;
    type_de_manifestation?: string;
    category?: string;
    type?: string;
    type_d_animation?: string;
    categorie_de_la_manifestation?: string;
    typologie?: string;
    tags?: string | string[];
    
    // Prix et conditions
    tarif?: string;
    tarif_normal?: string;
    prix?: number;
    gratuit?: boolean | string;
    manifestation_gratuite?: string;
    conditions?: string;
    detail_des_conditions_fr?: string;
    
    // Contact et liens
    organisateur?: string;
    organisme?: string;
    site_web?: string;
    site_internet?: string;
    contact?: string;
    email?: string;
    telephone?: string;
    lien?: string;
    reservation_site_internet?: string;
    
    // Images
    image?: string;
    photo?: string;
    image_url?: string;
    thumbnail?: string;
    
    // Dates et horaires
    ouverture?: string;
    horaires?: string;
    horaires_detailles_fr?: string;
    periode_ouverture?: string;
    daterange?: string;
    daterange_fr?: string;
  };
  geometry?: {
    coordinates: [number, number];
    type: string;
  };
  record?: {
    fields: any;
    geometry?: any;
  };
}

interface ApiConfig {
  url: string;
  category: Event['category'];
  name: string;
  maxItems: number;
}

export class CorrectedEventApiService {
  private static instance: CorrectedEventApiService;
  private debug: boolean = false;
  private eventCounter: number = 0;

  // CORRECTION : Seulement les APIs qui fonctionnent réellement
  private readonly APIS: Record<string, ApiConfig> = {
    // APIs Région Occitanie (vérifiées)
    OCCITANIE_MUSEES: {
      url: 'https://data.laregion.fr/api/explore/v2.1/catalog/datasets/agenda-d-occitanie-musees/records',
      category: 'exposition',
      name: 'Agenda Musées',
      maxItems: 500
    },
    OCCITANIE_SORTIES: {
      url: 'https://data.laregion.fr/api/explore/v2.1/catalog/datasets/agendas-participatif-des-sorties-en-occitanie/records',
      category: 'autre',
      name: 'Sorties Participatives',
      maxItems: 500
    },
    FETE_SCIENCE: {
      url: 'https://data.laregion.fr/api/explore/v2.1/catalog/datasets/programme-de-la-fete-de-la-science-2024-en-occitanie/records',
      category: 'conference',
      name: 'Fête de la Science',
      maxItems: 500
    },
    UNESCO_SITES: {
      url: 'https://data.laregion.fr/api/explore/v2.1/catalog/datasets/site-unesco-en-occitanie/records',
      category: 'exposition',
      name: 'Sites UNESCO',
      maxItems: 100
    },
    MRAC_MUSEES: {
      url: 'https://data.laregion.fr/api/explore/v2.1/catalog/datasets/mrac-et-alentours/records',
      category: 'exposition',
      name: 'Musées MRAC',
      maxItems: 200
    },
    
    // APIs OpenData qui fonctionnent
    OPENAGENDA_PUBLIC: {
      url: 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records',
      category: 'autre',
      name: 'OpenAgenda Événements',
      maxItems: 2000
    },
    
    // API ville qui fonctionne
    TOULOUSE_EVENTS: {
      url: 'https://data.toulouse-metropole.fr/api/explore/v2.1/catalog/datasets/agenda-des-manifestations-culturelles-so-toulouse/records',
      category: 'autre',
      name: 'Événements Toulouse',
      maxItems: 800
    },
    
    // APIs publiques supplémentaires qui existent réellement
    MUSEES_FRANCE: {
      url: 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/musees-de-france/records',
      category: 'exposition',
      name: 'Musées de France',
      maxItems: 1000
    },
    MONUMENTS_HISTORIQUES: {
      url: 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/monuments-historiques/records',
      category: 'exposition',
      name: 'Monuments Historiques',
      maxItems: 1500
    },
    BASES_DE_LOISIRS: {
      url: 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/bases-de-loisirs/records',
      category: 'autre',
      name: 'Bases de Loisirs',
      maxItems: 500
    }
  };

  static getInstance(): CorrectedEventApiService {
    if (!CorrectedEventApiService.instance) {
      CorrectedEventApiService.instance = new CorrectedEventApiService();
    }
    return CorrectedEventApiService.instance;
  }

  constructor() {
    this.debug = typeof window !== 'undefined' && 
                localStorage.getItem('debug_events') === 'true';
    this.eventCounter = 0;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[DEBUG API]', ...args);
    }
  }

  async fetchAllEvents(): Promise<Event[]> {
    console.log('Chargement depuis toutes les APIs...');
    
    this.eventCounter = 0;
    
    const promises = Object.entries(this.APIS).map(([key, config]) =>
      this.fetchFromApi(key, config)
    );

    try {
      const results = await Promise.allSettled(promises);
      const allEvents: Event[] = [];

      results.forEach((result, index) => {
        const apiName = Object.keys(this.APIS)[index];
        const apiConfig = Object.values(this.APIS)[index];
        
        if (result.status === 'fulfilled') {
          allEvents.push(...result.value);
          console.log(`✅ ${apiConfig.name}: ${result.value.length} éléments`);
        } else {
          console.warn(`❌ ${apiConfig.name}: ${result.reason}`);
        }
      });

      console.log(`Total: ${allEvents.length} éléments disponibles`);
      return allEvents;

    } catch (error) {
      console.error('Erreur générale:', error);
      return [];
    }
  }

  private async fetchFromApi(
    apiKey: string, 
    config: ApiConfig
  ): Promise<Event[]> {
    
    this.log(`Chargement: ${config.name} (max ${config.maxItems})`);
    
    try {
      let allResults: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore && allResults.length < config.maxItems) {
        let url = `${config.url}?limit=${limit}&offset=${offset}`;
        
        // Filtres spécifiques pour chaque API
        if (apiKey === 'OCCITANIE_SORTIES') {
          const today = new Date().toISOString().split('T')[0];
          url += `&where=debut_manifestation>="${today}"`;
        } 
        else if (apiKey === 'OPENAGENDA_PUBLIC') {
          // Filtrer par région Occitanie
          url += '&refine=location_region:"Occitanie"';
        }
        else if (apiKey === 'MUSEES_FRANCE') {
          // Filtrer par région Occitanie
          url += '&refine=region:"Occitanie"';
        }
        else if (apiKey === 'MONUMENTS_HISTORIQUES') {
          // Filtrer par région Occitanie
          url += '&refine=region:"Occitanie"';
        }
        else if (apiKey === 'BASES_DE_LOISIRS') {
          // Filtrer par région Occitanie
          url += '&refine=region:"Occitanie"';
        }
        
        this.log(`Requête: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.results || [];
        
        if (results.length === 0) {
          hasMore = false;
          break;
        }
        
        allResults.push(...results);
        
        hasMore = results.length === limit && 
                  allResults.length < (data.total_count || config.maxItems) &&
                  allResults.length < config.maxItems;
        
        offset += limit;
        
        this.log(`${config.name}: ${allResults.length}/${Math.min(data.total_count || 0, config.maxItems)} récupérés`);
        
        if (offset > config.maxItems) {
          console.warn(`Arrêt forcé pour ${config.name} à ${allResults.length} éléments`);
          break;
        }
      }

      return this.transformApiResponse({ results: allResults }, config.category, config.name);

    } catch (error) {
      console.warn(`Erreur ${config.name}:`, error);
      return [];
    }
  }

  private transformApiResponse(
    data: any, 
    defaultCategory: Event['category'],
    sourceName: string
  ): Event[] {
    if (!data || !data.results) {
      return [];
    }

    const events = data.results
      .map((item: any) => {
        // Debug pour les premiers éléments
        if (this.debug && this.eventCounter < 3) {
          console.log(`[DEBUG] Structure de l'item (${sourceName}):`, JSON.stringify(item, null, 2));
        }
        
        const record = item.record || item;
        const fields = record.fields || record || item;
        const geometry = record.geometry || item.geometry;
        
        return this.transformToEvent(fields, geometry, defaultCategory, sourceName);
      })
      .filter((event: Event | null) => event !== null) as Event[];

    this.log(`${sourceName}: ${events.length} éléments transformés`);
    return events;
  }

  private transformToEvent(
    fields: OpenDataSoftEvent['fields'], 
    geometry: any,
    defaultCategory: Event['category'],
    sourceName: string
  ): Event | null {
    
    if (!fields) return null;

    // AMÉLIORATION : Extraction du titre plus robuste
    const title = this.extractTitle(fields);
    if (!title || title.trim().length === 0 || title === 'Élément sans nom') {
      this.log(`Titre invalide pour ${sourceName}:`, Object.keys(fields));
      return null;
    }

    // AMÉLIORATION : Extraction des coordonnées plus robuste
    const coords = this.extractCoordinates(fields, geometry);
    if (!coords) {
      this.log(`Coordonnées invalides pour ${title}:`, {
        fields: Object.keys(fields),
        geometry: geometry ? Object.keys(geometry) : 'null'
      });
      return null;
    }

    const { latitude, longitude } = coords;

    // Vérifier si c'est en Occitanie (limites élargies)
    if (latitude < 41.5 || latitude > 45.5 || longitude < -1.5 || longitude > 5.5) {
      this.log(`Hors Occitanie: ${title}`, { latitude, longitude });
      return null;
    }

    const description = this.extractDescription(fields, sourceName, title);
    const location = this.buildLocation(fields);
    
    if (!location || location.trim().length === 0) {
      this.log(`Lieu manquant pour ${title}`);
      return null;
    }

    const startDate = this.extractStartDate(fields);
    const endDate = this.extractEndDate(fields);
    const category = this.categorizeEvent(fields, sourceName, defaultCategory);
    const price = this.extractPrice(fields);

    return {
      id: this.generateUniqueId(title, startDate, sourceName),
      title: title.substring(0, 200).trim(),
      description: description.substring(0, 500).trim(),
      start_date: startDate,
      end_date: endDate,
      location: location.trim(),
      latitude,
      longitude,
      category,
      organizer: sourceName,
      price,
      website_url: fields.site_web || fields.site_internet || fields.lien || fields.reservation_site_internet || undefined,
      contact_email: fields.contact || fields.email || undefined,
      image_url: fields.image || fields.photo || fields.image_url || fields.thumbnail || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private extractTitle(fields: OpenDataSoftEvent['fields']): string {
    const candidates = [
      fields.titre_fr,
      fields.nom_manifestation,
      fields.nom_de_la_manifestation,
      fields.title,
      fields.titre,
      fields.nom,
      fields.nom_site,
      fields.nom_musee,
      fields.nom_etablissement,
      fields.nom_equipement,
      fields.denomination,
      fields.intitule
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return '';
  }

  private extractCoordinates(fields: OpenDataSoftEvent['fields'], geometry: any): { latitude: number; longitude: number } | null {
    let latitude: number | null = null;
    let longitude: number | null = null;

    // 1. Essayer geometry en premier
    if (geometry?.coordinates && Array.isArray(geometry.coordinates) && geometry.coordinates.length === 2) {
      [longitude, latitude] = geometry.coordinates; // GeoJSON format: [lon, lat]
    }
    // 2. Essayer geo_point_2d
    else if (fields.geo_point_2d && Array.isArray(fields.geo_point_2d) && fields.geo_point_2d.length === 2) {
      [latitude, longitude] = fields.geo_point_2d; // Format: [lat, lon]
    }
    // 3. Essayer geo_point object
    else if (fields.geo_point && typeof fields.geo_point === 'object' && 'lat' in fields.geo_point && 'lon' in fields.geo_point) {
      latitude = fields.geo_point.lat;
      longitude = fields.geo_point.lon;
    }
    // 4. Essayer geolocalisation
    else if (fields.geolocalisation && typeof fields.geolocalisation === 'object' && 'lat' in fields.geolocalisation && 'lon' in fields.geolocalisation) {
      latitude = fields.geolocalisation.lat;
      longitude = fields.geolocalisation.lon;
    }
    // 5. Essayer location_coordinates
    else if (fields.location_coordinates && typeof fields.location_coordinates === 'object' && 'lat' in fields.location_coordinates && 'lon' in fields.location_coordinates) {
      latitude = fields.location_coordinates.lat;
      longitude = fields.location_coordinates.lon;
    }
    // 6. Essayer googlemap coordinates
    else if (fields.googlemap_latitude && fields.googlemap_longitude) {
      latitude = fields.googlemap_latitude;
      longitude = fields.googlemap_longitude;
    }
    // 7. Essayer latitude/longitude séparés
    else if (fields.latitude && fields.longitude) {
      latitude = fields.latitude;
      longitude = fields.longitude;
    }

    // Validation stricte
    if (!latitude || !longitude || 
        isNaN(latitude) || isNaN(longitude) ||
        latitude === 0 || longitude === 0 ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return null;
    }

    return { latitude, longitude };
  }

  private extractDescription(fields: OpenDataSoftEvent['fields'], sourceName: string, title: string): string {
    const candidates = [
      fields.description_longue_fr,
      fields.longdescription_fr,
      fields.descriptif_long,
      fields.description_fr,
      fields.descriptif_court,
      fields.description,
      fields.keywords_fr
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim().length > 10) {
        return candidate.trim();
      }
    }

    return `${sourceName} - ${title}`;
  }

  private extractStartDate(fields: OpenDataSoftEvent['fields']): string {
    const candidates = [
      fields.firstdate_begin,
      fields.debut_manifestation,
      fields.date_de_debut,
      fields.date_debut,
      fields.dates,
      fields.daterange
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string') {
        return candidate;
      }
    }

    return new Date().toISOString();
  }

  private extractEndDate(fields: OpenDataSoftEvent['fields']): string | undefined {
    const candidates = [
      fields.lastdate_end,
      fields.fin_manifestation,
      fields.date_de_fin,
      fields.date_fin
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string') {
        return candidate;
      }
    }

    return undefined;
  }

  private extractPrice(fields: OpenDataSoftEvent['fields']): number | undefined {
    // Vérifier si c'est explicitement gratuit
    if (fields.gratuit === true || fields.gratuit === 'true' || 
        fields.manifestation_gratuite === 'Oui' ||
        fields.detail_des_conditions_fr?.toLowerCase().includes('entrée libre')) {
      return 0;
    }
    
    if (typeof fields.prix === 'number') {
      return fields.prix;
    }
    
    // Extraire le prix des champs tarif
    if (fields.tarif_normal) {
      const match = fields.tarif_normal.match(/(\d+(?:,\d+)?)/);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }
    
    if (fields.conditions_fr || fields.conditions) {
      const conditions = (fields.conditions_fr || fields.conditions || '').toLowerCase();
      if (conditions.includes('gratuit') || conditions.includes('libre') || conditions.includes('free')) {
        return 0;
      }
    }

    return undefined;
  }

  private buildLocation(fields: OpenDataSoftEvent['fields']): string {
    const parts = [
      fields.lieu_nom || fields.lieu_manifestation || fields.lieu || fields.location_name,
      fields.adresse || fields.location_address,
      fields.ville || fields.commune || fields.lib_commune || fields.location_city
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  private categorizeEvent(
    fields: OpenDataSoftEvent['fields'], 
    sourceName: string, 
    defaultCategory: Event['category']
  ): Event['category'] {
    
    const tags = fields.tags ? (Array.isArray(fields.tags) ? fields.tags.join(' ') : fields.tags) : '';
    const keywords = fields.keywords_fr || '';
    const type = fields.type_manifestation || fields.type_de_manifestation || fields.type || fields.type_d_animation || '';
    const categorie = fields.categorie_de_la_manifestation || '';
    const allText = `${tags} ${keywords} ${type} ${categorie}`.toLowerCase();
    
    if (allText.includes('festival')) return 'festival';
    if (allText.includes('concert') || allText.includes('musique') || allText.includes('spectacle')) return 'concert';
    if (allText.includes('exposition') || allText.includes('musée') || allText.includes('art')) return 'exposition';
    if (allText.includes('conférence') || allText.includes('colloque') || allText.includes('débat')) return 'conference';
    if (allText.includes('atelier') || allText.includes('formation') || allText.includes('stage')) return 'atelier';
    
    if (sourceName.includes('Science')) return 'conference';
    if (sourceName.includes('Sport') || sourceName.includes('Équipement')) return 'autre';
    if (sourceName.includes('Musée') || sourceName.includes('UNESCO')) return 'exposition';
    
    return defaultCategory;
  }

  private generateUniqueId(title: string, date: string, source: string): string {
    this.eventCounter++;
    
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 15);
    
    const sourcePrefix = source.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 3);
    const timestamp = Date.now();
    
    return `${sourcePrefix}-${cleanTitle}-${this.eventCounter}-${timestamp.toString().slice(-6)}`;
  }

  enableDebug() {
    this.debug = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_events', 'true');
    }
    console.log('Debug activé');
  }

  disableDebug() {
    this.debug = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug_events');
    }
    console.log('Debug désactivé');
  }

  getEventStats(events: Event[]): {
    total: number;
    byCategory: Record<string, number>;
    byCities: Record<string, number>;
    bySource: Record<string, number>;
    free: number;
    paid: number;
  } {
    const stats = {
      total: events.length,
      byCategory: {} as Record<string, number>,
      byCities: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      free: 0,
      paid: 0
    };

    events.forEach(event => {
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
      
      const locationParts = event.location.split(',');
      const city = locationParts[locationParts.length - 1]?.trim() || 'Autre';
      stats.byCities[city] = (stats.byCities[city] || 0) + 1;
      
      stats.bySource[event.organizer] = (stats.bySource[event.organizer] || 0) + 1;
      
      if (event.price === 0) {
        stats.free++;
      } else if (event.price !== undefined && event.price > 0) {
        stats.paid++;
      }
    });

    return stats;
  }

  async testSingleApi(apiName: string): Promise<any> {
    const config = this.APIS[apiName];
    
    if (!config) {
      throw new Error(`API ${apiName} non trouvée`);
    }
    
    console.log(`Test: ${config.name}`);
    console.log(`URL: ${config.url}`);
    
    try {
      const response = await fetch(`${config.url}?limit=5`);
      const data = await response.json();
      
      console.log('Réponse:', {
        status: response.status,
        totalRecords: data.total_count,
        resultsCount: data.results?.length,
        firstResult: data.results?.[0]
      });
      
      if (data.results?.[0]) {
        console.log('Structure du premier résultat:', JSON.stringify(data.results[0], null, 2));
      }
      
      return data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }
}