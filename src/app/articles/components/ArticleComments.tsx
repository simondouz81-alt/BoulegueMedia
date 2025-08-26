'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Reply, Trash2, Flag, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  article_id: string;
  author_id: string;
  parent_id: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface ArticleCommentsProps {
  articleId: string;
}

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [articleId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUser(profile);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('article_comments')
        .select(`
          *,
          author:profiles(id, username, full_name, avatar_url)
        `)
        .eq('article_id', articleId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organiser les commentaires avec leurs réponses
      const organizedComments = organizeComments(data || []);
      setComments(organizedComments);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeComments = (allComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Créer une map de tous les commentaires
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Organiser la hiérarchie
    allComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('article_comments')
        .insert({
          content: newComment.trim(),
          article_id: articleId,
          author_id: user.id,
          parent_id: parentId || null,
        });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      fetchComments(); // Recharger les commentaires
    } catch (error) {
      console.error('Erreur lors de la publication du commentaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      try {
        const { error } = await supabase
          .from('article_comments')
          .delete()
          .eq('id', commentId)
          .eq('author_id', user.id);

        if (error) throw error;
        fetchComments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const toggleExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center mb-6">
        <MessageCircle className="w-6 h-6 mr-2 text-gray-700" />
        <h2 className="text-xl font-semibold text-gray-900">
          Commentaires ({comments.length})
        </h2>
      </div>

      {/* Formulaire de nouveau commentaire */}
      <div className="mb-8">
        {user ? (
          <form onSubmit={(e) => handleSubmitComment(e)} className="space-y-4">
            <div className="flex items-start space-x-3">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre point de vue sur cet article..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {newComment.length}/1000
                  </span>
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      'Publier'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">
              Connectez-vous pour participer à la discussion
            </p>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
            >
              Se connecter
            </Button>
          </div>
        )}
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun commentaire pour le moment.</p>
            <p className="text-sm">Soyez le premier à partager votre avis !</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              articleId={articleId}
              onReply={(commentId) => setReplyTo(commentId)}
              onDelete={handleDeleteComment}
              onSubmitReply={handleSubmitComment}
              isExpanded={expandedComments.has(comment.id)}
              onToggleExpanded={() => toggleExpanded(comment.id)}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Composant pour un commentaire individuel
interface CommentItemProps {
  comment: Comment;
  user: any;
  articleId: string;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
}

function CommentItem({
  comment,
  user,
  articleId,
  onReply,
  onDelete,
  onSubmitReply,
  isExpanded,
  onToggleExpanded,
  replyTo,
  setReplyTo
}: CommentItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReply(true);
    try {
      await onSubmitReply(e, comment.id);
      setReplyContent('');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        {comment.author?.avatar_url ? (
          <Image
            src={comment.author.avatar_url}
            alt={comment.author.full_name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {comment.author?.full_name?.[0] || 'U'}
            </span>
          </div>
        )}

        {/* Contenu du commentaire */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {comment.author?.full_name}
                </span>
                <span className="text-sm text-gray-500">
                  @{comment.author?.username}
                </span>
                <span className="text-sm text-gray-400">
                  {formatDate(comment.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {user && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                    title="Répondre"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                )}

                {user?.id === comment.author?.id && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Signaler"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Formulaire de réponse */}
          {replyTo === comment.id && user && (
            <form onSubmit={handleReplySubmit} className="mt-3 ml-4">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {user.full_name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Répondre à ${comment.author?.full_name}...`}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={2}
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!replyContent.trim() || isSubmittingReply}
                    >
                      {isSubmittingReply ? (
                        <LoadingSpinner className="w-3 h-3" />
                      ) : (
                        'Répondre'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12">
          <button
            onClick={onToggleExpanded}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            {isExpanded ? 'Masquer' : 'Voir'} {comment.replies.length} réponse{comment.replies.length > 1 ? 's' : ''}
          </button>

          {isExpanded && (
            <div className="space-y-4 border-l-2 border-gray-200 pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  user={user}
                  articleId={articleId}
                  onReply={onReply}
                  onDelete={onDelete}
                  onSubmitReply={onSubmitReply}
                  isExpanded={false}
                  onToggleExpanded={() => {}}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}