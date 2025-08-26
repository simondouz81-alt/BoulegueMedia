export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'editor' | 'user';
  created_at: string;
}