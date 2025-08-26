'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Tag, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface FilterProps {
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  };
}

export function ArticleFilters({ searchParams }: FilterProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.search || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      // Récupérer les catégories
      const { data: categoriesData } = await supabase
        .from('articles')
        .select('category')
        .eq('status', 'published');

      // Récupérer les tags
      const { data: tagsData } = await supabase
        .from('articles')
        .select('tags')
        .eq('status', 'published');

      const uniqueCategories = [...new Set(categoriesData?.map(item => item.category))]
        .filter(Boolean)
        .sort();

      const allTags = tagsData?.flatMap(item => item.tags || []) || [];
      const uniqueTags = [...new Set(allTags)].filter(Boolean).sort();

      setCategories(uniqueCategories);
      setTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching filters data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset page when changing filters
    if (key !== 'page') {
      params.delete('page');
    }
    
    router.push(`/articles?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams('search', searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    router.push('/articles');
  };

  const hasActiveFilters = searchParams.search || searchParams.category || searchParams.tag;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Filter className="w-5 h-5 mr-2 text-gray-700" />
        <h3 className="font-semibold text-lg">Filtres</h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="ml-auto text-orange-600 hover:text-orange-700"
          >
            Effacer
          </Button>
        )}
      </div>

      {/* Recherche */}
      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-1" />
          Rechercher
        </label>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Titre, contenu, auteur..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Rechercher
          </Button>
        </div>
      </form>

      {/* Catégories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          Catégories
        </label>
        <div className="space-y-2">
          <button
            onClick={() => updateSearchParams('category', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !searchParams.category 
                ? 'bg-orange-100 text-orange-700' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => updateSearchParams('category', category)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                searchParams.category === category
                  ? 'bg-orange-100 text-orange-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags populaires
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <button
              key={tag}
              onClick={() => updateSearchParams('tag', tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                searchParams.tag === tag
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      )}
    </div>
  );
}