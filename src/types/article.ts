// src/types/article.ts - Mis à jour selon votre schéma exact
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url?: string;
  author_id: string;
  category: string;
  tags: string[];
  published: boolean;  // Votre schéma utilise 'published', pas 'status'
  view_count: number;
  created_at: string;
  updated_at: string;
  
  // Nouvelles colonnes ajoutées
  featured_image_alt?: string;
  video_url?: string;
  reading_time?: number;
  meta_description?: string;
  featured?: boolean;
  comments_count?: number;
  
  // Données de l'auteur (depuis la vue articles_with_author)
  author_username?: string;
  author_full_name?: string;
  author_avatar_url?: string;
  author?: User;
}

// src/types/user.ts - Conforme à votre schéma
export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'editor' | 'user';
  created_at: string;
  updated_at: string;
}

// src/types/comment.ts - Nouveau type pour les commentaires d'articles
export interface ArticleComment {
  id: string;
  content: string;
  article_id: string;
  author_id: string;
  parent_id?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: ArticleComment[];
}

// src/lib/supabase.ts - Types mis à jour pour Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour les tables Supabase selon votre schéma
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
        };
        Update: {
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          image_url: string | null;
          author_id: string;
          category: string;
          tags: string[];
          published: boolean;  // boolean dans votre schéma
          view_count: number;
          created_at: string;
          updated_at: string;
          featured_image_alt: string | null;
          video_url: string | null;
          reading_time: number | null;
          meta_description: string | null;
          featured: boolean | null;
          comments_count: number | null;
        };
        Insert: {
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          image_url?: string | null;
          author_id: string;
          category: string;
          tags?: string[];
          published?: boolean;
          featured_image_alt?: string | null;
          video_url?: string | null;
          meta_description?: string | null;
          featured?: boolean;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string;
          image_url?: string | null;
          category?: string;
          tags?: string[];
          published?: boolean;
          updated_at?: string;
          featured_image_alt?: string | null;
          video_url?: string | null;
          meta_description?: string | null;
          featured?: boolean;
        };
      };
      article_comments: {
        Row: {
          id: string;
          content: string;
          article_id: string;
          author_id: string;
          parent_id: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          article_id: string;
          author_id: string;
          parent_id?: string | null;
          is_approved?: boolean;
        };
        Update: {
          content?: string;
          is_approved?: boolean;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          start_date: string;
          end_date: string | null;
          location: string;
          latitude: number;
          longitude: number;
          category: string;
          price: number | null;
          organizer: string;
          website_url: string | null;
          contact_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description: string;
          image_url?: string | null;
          start_date: string;
          end_date?: string | null;
          location: string;
          latitude: number;
          longitude: number;
          category: string;
          price?: number | null;
          organizer: string;
          website_url?: string | null;
          contact_email?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          image_url?: string | null;
          start_date?: string;
          end_date?: string | null;
          location?: string;
          latitude?: number;
          longitude?: number;
          category?: string;
          price?: number | null;
          organizer?: string;
          website_url?: string | null;
          contact_email?: string | null;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          content: string;
          author_id: string;
          image_url: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          author_id: string;
          image_url?: string | null;
        };
        Update: {
          content?: string;
          image_url?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};