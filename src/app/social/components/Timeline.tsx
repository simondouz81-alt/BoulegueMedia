'use client';

import { useState, useEffect } from 'react';
import { PostCard } from './PostCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Post } from '@/types/social';

// Données fictives pour la démo
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'Magnifique festival de musique traditionnelle occitane à Toulouse ce week-end ! Les cornemuses résonnent dans toute la ville 🎵',
    author_id: 'user1',
    author: {
      id: 'user1',
      username: 'marie_occitane',
      full_name: 'Marie Dubois',
      email: 'marie@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b2-1?w=100&h=100&fit=crop&crop=face',
      role: 'user',
      created_at: '2024-01-01',
    },
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    likes_count: 24,
    comments_count: 8,
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    content: 'Découverte incroyable dans les archives de Carcassonne ! Un manuscrit du 13ème siècle en langue occitane qui raconte les légendes cathares. 📜',
    author_id: 'user2',
    author: {
      id: 'user2',
      username: 'pierre_historien',
      full_name: 'Pierre Martin',
      email: 'pierre@example.com',
      role: 'user',
      created_at: '2024-01-01',
    },
    likes_count: 42,
    comments_count: 15,
    created_at: '2024-01-19T14:15:00Z',
    updated_at: '2024-01-19T14:15:00Z',
  },
];

export function Timeline() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des posts
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun post pour le moment.</p>
          <p className="text-gray-400 text-sm mt-2">
            Soyez le premier à partager quelque chose !
          </p>
        </div>
      )}
    </div>
  );
}