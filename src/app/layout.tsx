// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/hooks/useAuth';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Boulegue - Média Culturel Occitan',
    default: 'Boulegue - Média Culturel Occitan',
  },
  description: 'Découvrez la richesse culturelle de l\'Occitanie : articles, événements, documentaires et patrimoine historique.',
  keywords: ['Occitanie', 'culture', 'patrimoine', 'événements', 'histoire', 'tradition'],
  authors: [{ name: 'Boulegue Media' }],
  creator: 'Boulegue Media',
  publisher: 'Boulegue Media',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'Boulegue - Média Culturel Occitan',
    description: 'Découvrez la richesse culturelle de l\'Occitanie',
    siteName: 'Boulegue',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boulegue - Média Culturel Occitan',
    description: 'Découvrez la richesse culturelle de l\'Occitanie',
    creator: '@boulegue_media',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}