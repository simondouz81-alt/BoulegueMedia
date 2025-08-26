'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User } from 'lucide-react';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface RelatedArticlesProps {
  currentArticleId: string;
  category: string;
  tags: string[];
}

export function RelatedArticles({ currentArticleId, category, tags }: RelatedArticlesProps) {
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedArticles();
  }, [currentArticleId, category, tags]);

  const fetchRelatedArticles = async () => {
    try {
      // Chercher d'abord par tags similaires
      let { data: tagRelated } = await supabase
        .from('articles_with_author')
        .select('*')
        .neq('id', currentArticleId)
        .eq('status', 'published')
        .overlaps('tags', tags || [])
        .order('created_at', { ascending: false })
        .limit(3);

      // Si pas assez d'articles avec des tags similaires, chercher par catégorie
      if (!tagRelated || tagRelated.length < 3) {
        const { data: categoryRelated } = await supabase
          .from('articles_with_author')
          .select('*')
          .neq('id', currentArticleId)
          .eq('status', 'published')
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(3 - (tagRelated?.length || 0));

        tagRelated = [...(tagRelated || []), ...(categoryRelated || [])];
      }

      setRelatedArticles(tagRelated || []);
    } catch (error) {
      console.error('Error fetching related articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Articles similaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedArticles.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Articles similaires</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`}>
            <article className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              {article.image_url && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {article.author_username}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>{article.reading_time} min</span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}