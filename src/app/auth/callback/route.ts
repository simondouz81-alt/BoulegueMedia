import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${requestUrl.origin}/?error=auth_error`);
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error);
      return NextResponse.redirect(`${requestUrl.origin}/?error=unexpected_error`);
    }
  }

  // Rediriger vers la page d'accueil après la connexion réussie
  return NextResponse.redirect(`${requestUrl.origin}/?auth=success`);
}