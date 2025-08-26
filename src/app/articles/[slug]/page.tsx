// src/app/articles/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  Eye, 
  Share2, 
  Bookmark, 
  ArrowLeft,
  Tag,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { ArticleContent } from '../components/ArticleContent';
import { ArticleComments } from '../components/ArticleComments';
import { RelatedArticles } from '../components/RelatedArticles';
import { ShareButtons } from '../components/ShareButtons';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

// Fonction pour récupérer l'article
async function getArticle(slug: string) {
  const { data: article, error } = await supabase
    .from('articles_with_author')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !article) {
    return null;
  }

  // Incrémenter le compteur de vues
  await supabase
    .from('articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id);

  return article;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Article non trouvé',
    };
  }

  return {
    title: article.title,
    description: article.meta_description || article.excerpt,
    keywords: article.tags?.join(', '),
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.image_url ? [article.image_url] : [],
      type: 'article',
      publishedTime: article.created_at,
      authors: [article.author_full_name],
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/articles" className="text-gray-500 hover:text-gray-700">
              Articles
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate">
              {article.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Header de l'article */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/articles"
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux articles
        </Link>

        {/* Catégorie */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            article.category === 'culture' ? 'bg-purple-100 text-purple-700' :
            article.category === 'histoire' ? 'bg-amber-100 text-amber-700' :
            article.category === 'actualite' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {article.category}
          </span>
        </div>

        {/* Titre */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
          {article.excerpt}
        </p>

        {/* Métadonnées */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-8 border-b">
          <div className="flex items-center space-x-6 mb-4 sm:mb-0">
            {/* Auteur */}
            <div className="flex items-center">
              {article.author_avatar_url ? (
                <Image
                  src={article.author_avatar_url}
                  alt={article.author_full_name}
                  width={40}
                  height={40}
                  className="rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">
                    {article.author_full_name?.[0] || 'A'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{article.author_full_name}</p>
                <p className="text-sm text-gray-500">@{article.author_username}</p>
              </div>
            </div>

            {/* Date et temps de lecture */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(article.created_at, 'long')}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {article.reading_time} min de lecture
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {article.view_count} vues
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <ShareButtons article={article} />
            <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Tag className="w-4 h-4 text-gray-400 mt-1" />
            {article.tags.map((tag: string)=> (
              <Link
                key={tag}
                href={`/articles?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 text-sm rounded-full transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Image principale */}
      {article.image_url && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <Image
              src={article.image_url}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          {article.featured_image_alt && (
            <p className="text-sm text-gray-500 text-center mt-2 italic">
              {article.featured_image_alt}
            </p>
          )}
        </div>
      )}

      {/* Contenu de l'article */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <ArticleContent 
            content={article.content} 
            videoUrl={article.video_url}
          />
        </div>

        {/* Footer de l'article */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">Partager cet article :</span>
              <ShareButtons article={article} />
            </div>
            <div className="flex items-center text-gray-500">
              <MessageCircle className="w-5 h-5 mr-2" />
              <span>{article.comments_count} commentaire{article.comments_count > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Informations sur l'auteur */}
          <div className="bg-gray-50 rounded-xl p-6 mb-12">
            <div className="flex items-start space-x-4">
              {article.author_avatar_url ? (
                <Image
                  src={article.author_avatar_url}
                  alt={article.author_full_name}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {article.author_full_name?.[0] || 'A'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {article.author_full_name}
                </h3>
                <p className="text-gray-600 mb-3">
                  Passionné de culture occitane et contributeur régulier sur Boulegue.
                  {/* TODO: Ajouter une vraie bio d'auteur */}
                </p>
                <Link
                  href={`/auteurs/${article.author_username}`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Voir tous les articles de {article.author_full_name} →
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Section commentaires */}
        <section className="mb-12">
          <ArticleComments articleId={article.id} />
        </section>
      </div>

      {/* Articles similaires */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RelatedArticles 
            currentArticleId={article.id}
            category={article.category}
            tags={article.tags}
          />
        </div>
      </section>
    </article>
  );
}