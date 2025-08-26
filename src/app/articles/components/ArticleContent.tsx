// src/app/articles/components/ArticleContent.tsx (avec marked)
'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { parseMarkdownSimple } from '@/lib/markdown'; // Utilise la version simple

interface ArticleContentProps {
  content: string;
  videoUrl?: string;
}

export function ArticleContent({ content, videoUrl }: ArticleContentProps) {
  return (
    <div className="article-content">
      {/* Vidéo YouTube si présente */}
      {videoUrl && (
        <div className="mb-8">
          <YouTubeEmbed url={videoUrl} />
        </div>
      )}

      {/* Contenu de l'article */}
      <div
        className="prose prose-lg prose-orange max-w-none"
        dangerouslySetInnerHTML={{
          __html: parseMarkdownSimple(content)
        }}
      />
    </div>
  );
}

// Composant pour intégrer une vidéo YouTube
interface YouTubeEmbedProps {
  url: string;
}

function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);
  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden group">
      {!isLoaded ? (
        <>
          <img
            src={thumbnailUrl}
            alt="Miniature de la vidéo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all">
            <button
              onClick={() => setIsLoaded(true)}
              className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl"
              aria-label="Lire la vidéo"
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </button>
          </div>
        </>
      ) : (
        <iframe
          src={embedUrl}
          title="Vidéo YouTube"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}