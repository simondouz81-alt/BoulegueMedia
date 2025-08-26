'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { Article } from '@/types/article';

interface ShareButtonsProps {
  article: Article;
}

export function ShareButtons({ article }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`;
  const shareText = `${article.title} - ${article.excerpt}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: article.title,
              text: article.excerpt,
              url: shareUrl,
            });
          }
        }}
        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
        title="Partager"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        title="Partager sur Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
        title="Partager sur Twitter"
      >
        <Twitter className="w-5 h-5" />
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-400 hover:text-blue-700 transition-colors"
        title="Partager sur LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </a>

      <button
        onClick={handleCopyLink}
        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
        title="Copier le lien"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Link2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}