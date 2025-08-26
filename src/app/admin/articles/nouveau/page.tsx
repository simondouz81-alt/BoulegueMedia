'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Video,
  Link2,
  Bold,
  Italic,
  List,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';

interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featured: boolean;
  image_url: string;
  featured_image_alt: string;
  video_url: string;
  meta_description: string;
}

const CATEGORIES = [
  { value: 'culture', label: 'Culture' },
  { value: 'histoire', label: 'Histoire' },
  { value: 'patrimoine', label: 'Patrimoine' },
  { value: 'actualite', label: 'Actualité' },
  { value: 'tradition', label: 'Tradition' },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState<ArticleForm>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'culture',
    tags: [],
    status: 'draft',
    featured: false,
    image_url: '',
    featured_image_alt: '',
    video_url: '',
    meta_description: '',
  });

  useEffect(() => {
    checkUserPermissions();
  }, []);

  useEffect(() => {
    // Auto-générer le slug à partir du titre
    if (form.title) {
      setForm(prev => ({
        ...prev,
        slug: slugify(form.title)
      }));
    }
  }, [form.title]);

  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'editor'].includes(profile.role)) {
        router.push('/');
        return;
      }

      setUser({ ...user, role: profile.role });
    } catch (error) {
      console.error('Erreur de permissions:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ArticleForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      handleInputChange('image_url', publicUrl);
    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...form.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', form.tags.filter(tag => tag !== tagToRemove));
  };

  const insertAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = form.content.substring(0, start) + text + form.content.substring(end);
    handleInputChange('content', newContent);
    
    // Restaurer la position du curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const addFormattingToContent = (type: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    
    switch (type) {
      case 'bold':
        insertAtCursor(textarea, '**texte en gras**');
        break;
      case 'italic':
        insertAtCursor(textarea, '*texte en italique*');
        break;
      case 'quote':
        insertAtCursor(textarea, '[QUOTE:Votre citation ici]');
        break;
      case 'list':
        insertAtCursor(textarea, '\n- Point 1\n- Point 2\n- Point 3\n');
        break;
      case 'image':
        const imageUrl = prompt('URL de l\'image:');
        if (imageUrl) {
          insertAtCursor(textarea, `[IMAGE:${imageUrl}]`);
        }
        break;
      case 'link':
        const url = prompt('URL du lien:');
        const linkText = prompt('Texte du lien:');
        if (url && linkText) {
          insertAtCursor(textarea, `[LINK:${url}|${linkText}]`);
        }
        break;
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Veuillez remplir au minimum le titre et le contenu');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .insert({
          ...form,
          status,
          author_id: user.id,
        });

      if (error) throw error;

      router.push('/admin/articles');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvel Article</h1>
            <p className="text-gray-600">Créer un nouvel article pour Boulegue</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Éditer' : 'Aperçu'}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Brouillon
            </Button>
            
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              {saving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Publier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Informations principales</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Titre de votre article"
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug URL
                  </label>
                  <Input
                    value={form.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="slug-automatique"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL de l'article : /articles/{form.slug}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Résumé/Extrait *
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Résumé de l'article affiché dans les listes et métadonnées"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.excerpt.length}/300 caractères
                  </p>
                </div>
              </div>
            </Card>

            {/* Contenu */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contenu de l'article *</h2>
                
                {/* Barre d'outils de formatage */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('bold')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Gras"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('italic')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Italique"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('quote')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Citation"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('list')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('image')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Insérer image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addFormattingToContent('link')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Insérer lien"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {previewMode ? (
                <div className="prose prose-lg max-w-none border rounded-lg p-4 min-h-96">
                  {/* Aperçu du contenu formaté */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: form.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\[QUOTE:(.*?)\]/g, '<blockquote class="border-l-4 border-orange-500 pl-4 italic">$1</blockquote>')
                        .replace(/\[IMAGE:(.*?)\]/g, '<img src="$1" alt="Image" class="w-full rounded-lg my-4" />')
                        .replace(/\[LINK:(.*?)\|(.*?)\]/g, '<a href="$1" class="text-orange-600 underline">$2</a>')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              ) : (
                <textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Rédigez votre article ici...

Utilisez ces balises pour enrichir votre contenu :
- **gras** ou *italique*
- [QUOTE:Votre citation]
- [IMAGE:url_de_votre_image]
- [LINK:url|texte du lien]"
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                  rows={20}
                />
              )}

              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div>
                  <span>{form.content.length} caractères</span>
                  <span className="mx-2">•</span>
                  <span>~{Math.ceil(form.content.split(' ').length / 200)} min de lecture</span>
                </div>
                <div>
                  Utilisez Ctrl+B pour gras, Ctrl+I pour italique
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image principale */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Image principale</h3>
              
              {form.image_url ? (
                <div className="relative">
                  <img
                    src={form.image_url}
                    alt="Image principale"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleInputChange('image_url', '')}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingImage ? (
                      <LoadingSpinner className="w-8 h-8 mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Upload...' : 'Choisir une image'}
                    </span>
                  </label>
                </div>
              )}

              {form.image_url && (
                <div className="mt-4">
                  <Input
                    value={form.featured_image_alt}
                    onChange={(e) => handleInputChange('featured_image_alt', e.target.value)}
                    placeholder="Texte alternatif de l'image"
                    className="text-sm"
                  />
                </div>
              )}
            </Card>

            {/* Vidéo YouTube */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Video className="w-4 h-4 mr-2" />
                Vidéo YouTube
              </h3>
              <Input
                value={form.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-2">
                La vidéo sera intégrée au début de l'article
              </p>
            </Card>

            {/* Catégorie */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Catégorie</h3>
              <select
                value={form.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Tags</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-orange-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nouveau tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Options */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Article à la une</span>
                </label>
              </div>
            </Card>

            {/* SEO */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">SEO</h3>
              <textarea
                value={form.meta_description}
                onChange={(e) => handleInputChange('meta_description', e.target.value)}
                placeholder="Description pour les moteurs de recherche"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.meta_description.length}/160 caractères recommandés
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}