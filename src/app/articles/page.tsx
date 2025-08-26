// src/app/articles/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesList } from './components/ArticlesList';
import { ArticleFilters } from './components/ArticleFilters';
import { FeaturedArticles } from './components/FeaturedArticles';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Découvrez tous nos articles sur la culture et l\'histoire occitane.',
};

interface ArticlesPageProps {
  searchParams: {
    search?: string;
    category?: string;
    tag?: string;
    page?: string;
  };
}

export default function ArticlesPage({ searchParams }: ArticlesPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
              <p className="text-gray-600">
                Explorez la richesse culturelle et historique de l'Occitanie
              </p>
            </div>
            
            {/* Bouton admin pour créer un article */}
            <div className="mt-4 md:mt-0">
              <Link 
                href="/admin/articles/nouveau"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Nouvel article
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Articles à la une */}
        <section className="mb-12">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-xl" />}>
            <FeaturedArticles />
          </Suspense>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar avec filtres */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-xl" />}>
                <ArticleFilters searchParams={searchParams} />
              </Suspense>
            </div>
          </aside>

          {/* Liste des articles */}
          <main className="lg:col-span-3">
            <Suspense 
              fallback={
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              }
            >
              <ArticlesList searchParams={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
