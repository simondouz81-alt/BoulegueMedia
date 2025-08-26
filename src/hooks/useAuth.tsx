'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User as ProfileUser } from '@/types/user';

interface AuthContextType {
  user: ProfileUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session existante
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        if (event === 'SIGNED_IN' && !user) {
          // Nouveau utilisateur ou première connexion
          await fetchOrCreateUserProfile(session.user);
        } else {
          // Utilisateur existant
          await fetchUserProfile(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Si le profil n'existe pas, on le crée
        if (error.code === 'PGRST116') {
          await createUserProfile(authUser);
          return;
        }
        throw error;
      }

      setUser({
        ...profile,
        email: authUser.email || '',
      });
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchOrCreateUserProfile = async (authUser: User) => {
    try {
      // Essayer de récupérer le profil existant
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Le profil n'existe pas, on le crée
        await createUserProfile(authUser);
      } else if (profile) {
        // Le profil existe déjà
        setUser({
          ...profile,
          email: authUser.email || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchOrCreateUserProfile:', error);
    }
  };

  const createUserProfile = async (authUser: User) => {
    try {
      const username = authUser.user_metadata?.username || 
                      authUser.email?.split('@')[0] || 
                      `user_${Date.now()}`;
      
      const fullName = authUser.user_metadata?.full_name || 
                      authUser.user_metadata?.name ||
                      'Utilisateur';

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          username,
          full_name: fullName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          role: 'user',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      setUser({
        ...profile,
        email: authUser.email || '',
      });
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      // Vérifier si le nom d'utilisateur est déjà pris
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: { message: 'Ce nom d\'utilisateur est déjà pris' } };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
        },
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}