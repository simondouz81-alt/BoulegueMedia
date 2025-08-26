'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, Calendar } from 'lucide-react';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export function FeaturedArticles() {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  const fetchFeaturedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles_with_author')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setFeaturedArticles(data || []);
    } catch (error) {
      console.error('Error fetching featured articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (featuredArticles.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">À la une</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuredArticles.map((article, index) => (
          <Link key={article.id} href={`/articles/${article.slug}`}>
            <article className={`group cursor-pointer ${
              index === 0 ? 'md:col-span-2 md:row-span-2' : ''
            }`}>
              <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                {article.image_url && (
                  <div className={`relative overflow-hidden ${
                    index === 0 ? 'h-64 md:h-96' : 'h-48'
                  }`}>
                    <Image
                      src={article.image_url}
                      alt={article.featured_image_alt || article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                )}
                
                <div className={`p-6 ${article.image_url && index === 0 ? 'absolute bottom-0 left-0 right-0 text-white' : ''}`}>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      article.category === 'culture' ? 'bg-purple-100 text-purple-700' :
                      article.category === 'histoire' ? 'bg-amber-100 text-amber-700' :
                      article.category === 'actualite' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {article.category}
                    </span>
                  </div>
                  
                  <h3 className={`font-bold mb-3 group-hover:text-orange-600 transition-colors ${
                    index === 0 ? 'text-xl md:text-2xl' : 'text-lg'
                  } ${article.image_url && index === 0 ? 'text-white' : 'text-gray-900'}`}>
                    {article.title}
                  </h3>
                  
                  <p className={`mb-4 ${
                    index === 0 ? 'text-base' : 'text-sm'
                  } ${article.image_url && index === 0 ? 'text-gray-200' : 'text-gray-600'}`}>
                    {article.excerpt}
                  </p>
                  
                  <div className={`flex items-center space-x-4 text-sm ${
                    article.image_url && index === 0 ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {article.author_full_name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.reading_time} min
                    </div>
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