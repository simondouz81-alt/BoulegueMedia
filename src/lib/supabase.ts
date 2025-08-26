// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour les tables Supabase
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
          published: boolean;
          created_at: string;
          updated_at: string;
          view_count: number;
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