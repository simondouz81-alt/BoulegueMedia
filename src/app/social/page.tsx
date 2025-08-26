import { Metadata } from 'next';
import { PostForm } from './components/PostForm';
import { Timeline } from './components/Timeline';

export const metadata: Metadata = {
  title: 'Espace Social',
  description: 'Partagez et découvrez les actualités culturelles de l\'Occitanie avec la communauté.',
};

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Social</h1>
          <p className="text-gray-600">
            Partagez vos découvertes culturelles et échangez avec la communauté occitane.
          </p>
        </div>

        {/* Formulaire de création de post */}
        <div className="mb-8">
          <PostForm />
        </div>

        {/* Timeline des posts */}
        <Timeline />
      </div>
    </div>
  );
}