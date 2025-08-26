'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, Calendar, MessageCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ArticlesListProps {
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  };
}

const ARTICLES_PER_PAGE = 12;

export function ArticlesList({ searchParams }: ArticlesListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const currentPage = parseInt(searchParams.page || '1');
  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  useEffect(() => {
    fetchArticles();
  }, [searchParams]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('articles_with_author')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Filtres
      if (searchParams.search) {
        query = query.or(`title.ilike.%${searchParams.search}%,content.ilike.%${searchParams.search}%,excerpt.ilike.%${searchParams.search}%`);
      }

      if (searchParams.category) {
        query = query.eq('category', searchParams.category);
      }

      if (searchParams.tag) {
        query = query.contains('tags', [searchParams.tag]);
      }

      // Pagination
      const from = (currentPage - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setArticles(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-2 w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun article trouvé
        </h3>
        <p className="text-gray-500 mb-4">
          Essayez de modifier vos critères de recherche ou explorez d'autres catégories.
        </p>
        <Link href="/articles" className="text-orange-600 hover:text-orange-700">
          Voir tous les articles
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête avec nombre de résultats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {searchParams.search || searchParams.category || searchParams.tag 
              ? 'Résultats de recherche' 
              : 'Tous les articles'
            }
          </h2>
          <p className="text-gray-500 text-sm">
            {totalCount} article{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Options de tri */}
        <select 
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          onChange={(e) => {
            // TODO: Implémenter le tri
            console.log('Sort by:', e.target.value);
          }}
        >
          <option value="newest">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="popular">Plus populaires</option>
          <option value="comments">Plus commentés</option>
        </select>
      </div>

      {/* Grille d'articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={searchParams}
        />
      )}
    </div>
  );
}

// Composant pour une carte d'article
function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`}>
      <article className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image */}
        {article.image_url && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                article.category === 'culture' ? 'bg-purple-500 text-white' :
                article.category === 'histoire' ? 'bg-amber-500 text-white' :
                article.category === 'actualite' ? 'bg-blue-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                {article.category}
              </span>
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-gray-400 text-xs">
                  +{article.tags.length - 3} autres
                </span>
              )}
            </div>
          )}

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {article.author_username}
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(article.created_at)}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {article.reading_time} min
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-3 h-3 mr-1" />
                {article.comments_count}
              </div>
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {article.view_count}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Composant de pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  };
}

function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.tag) params.set('tag', searchParams.tag);
    if (page > 1) params.set('page', page.toString());
    
    return `/articles${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const getVisiblePages = () => {
    const delta = 2; // Nombre de pages à afficher de chaque côté
    const pages = [];
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Page {currentPage} sur {totalPages}
      </div>

      <div className="flex items-center space-x-2">
        {/* Bouton précédent */}
        <Link
          href={createPageUrl(Math.max(1, currentPage - 1))}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Première page */}
        {currentPage > 3 && (
          <>
            <Link
              href={createPageUrl(1)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              1
            </Link>
            {currentPage > 4 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}

        {/* Pages visibles */}
        {getVisiblePages().map((page) => (
          <Link
            key={page}
            href={createPageUrl(page)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              page === currentPage
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        ))}

        {/* Dernière page */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <Link
              href={createPageUrl(totalPages)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </Link>
          </>
        )}

        {/* Bouton suivant */}
        <Link
          href={createPageUrl(Math.min(totalPages, currentPage + 1))}
          className={`p-2 rounded-lg border transition-colors ${
            currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}