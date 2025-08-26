// src/components/layout/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const navigation = [
  { name: 'Accueil', href: '/' },
  { name: 'Articles', href: '/articles' },
  { name: 'Social', href: '/social' },
  { name: 'Documentaires', href: '/documentaires' },
  { name: 'Carte', href: '/carte' },
  { name: 'Histoire', href: '/histoire' },
  { name: 'Événements', href: '/evenements' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const openSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                {/* Option 1: Logo image personnalisé */}
                <div className="w-8 h-8 relative">
                  <Image
                    src="/logo.png" 
                    alt="Boulegue Logo"
                    width={32}
                    height={32}
                    className="rounded-full object-contain"
                  />
                </div>
                
                <span className="font-bold text-xl text-gray-900">Boulegue</span>
              </Link>
            </div>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    pathname === item.href
                      ? 'text-orange-600'
                      : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  {item.name}
                  {pathname === item.href && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
                      layoutId="underline"
                      initial={false}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-orange-600 transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {/* Auth Section */}
              {loading ? (
                <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
              ) : user ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={openSignIn}
                    className="text-gray-700 hover:text-orange-600"
                  >
                    Se connecter
                  </Button>
                </div>
              )}

              {/* Menu mobile */}
              <button
                className="md:hidden p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t"
              >
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 text-base font-medium transition-colors ${
                        pathname === item.href
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Auth buttons mobile */}
                  {!user && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          openSignIn();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-center text-gray-700"
                      >
                        Se connecter
                      </Button>
                      <Button
                        onClick={() => {
                          openSignUp();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-center bg-gradient-to-r from-orange-600 to-red-600"
                      >
                        Créer un compte
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}