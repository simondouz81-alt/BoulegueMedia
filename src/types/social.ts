import { User } from "./user"; 

export interface Post {
  id: string;
  content: string;
  author_id: string;
  author?: User;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author_id: string;
  author?: User;
  created_at: string;
}