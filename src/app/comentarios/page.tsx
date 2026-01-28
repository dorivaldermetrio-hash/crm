'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Heart, MessageCircle } from 'lucide-react';

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count: number;
  comments_count: number;
}

export default function ComentariosPage() {
  const { isOpen, isMobile } = useSidebar();
  const [textareaContent, setTextareaContent] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/instagram/posts');
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      } else {
        setError(data.error || 'Erro ao carregar posts do Instagram');
      }
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simula salvamento (backend será implementado depois)
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    // TODO: Implementar salvamento no backend
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Comentários
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Configure o comportamento do agente ao responder comentários do Instagram
            </p>
          </div>

          {/* Card Principal */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 sm:p-8">
            {/* Seção do Textarea */}
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Comportamento do Agente
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Este campo define como o agente de inteligência artificial deve se comportar ao responder comentários no Instagram. 
                  Você pode especificar o tom de voz, estilo de resposta, diretrizes de comunicação e qualquer instrução especial 
                  que o agente deve seguir ao interagir com os comentários dos seus posts.
                </p>
              </div>

              <textarea
                value={textareaContent}
                onChange={(e) => setTextareaContent(e.target.value)}
                placeholder="Exemplo: Responda de forma amigável e profissional. Sempre agradeça comentários positivos e responda dúvidas de forma clara e objetiva. Use emojis moderadamente..."
                className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none scrollbar-elegant"
              />

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Salvar
                  </>
                )}
              </button>
            </div>

            {/* Divisor */}
            <div className="border-t border-slate-200 dark:border-slate-700 my-8" />

            {/* Seção do Toggle */}
            <div className="flex items-start gap-4">
              {/* Toggle Switch */}
              <div className="flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReplyEnabled}
                    onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500 shadow-lg peer-checked:shadow-blue-500/50"></div>
                </label>
              </div>

              {/* Texto Explicativo */}
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Habilite respostas automáticas para seu Instagram geradas por uma inteligência Artificial
                  </span>
                  <br />
                  <span className="text-slate-500 dark:text-slate-400 mt-1 block">
                    Quando ativado, o sistema responderá automaticamente aos comentários dos seus posts usando inteligência artificial, 
                    seguindo o comportamento definido acima.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Posts do Instagram */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Suas Postagens do Instagram
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Gerencie e monitore os comentários das suas postagens
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">Carregando postagens...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                <button
                  onClick={fetchPosts}
                  className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Nenhuma postagem encontrada
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Suas postagens do Instagram aparecerão aqui quando estiverem disponíveis.
                </p>
              </div>
            )}

            {/* Lista de Posts */}
            {!loading && !error && posts.length > 0 && (
              <div className="space-y-3">
                {posts.map((post) => {
                  const imageUrl = post.media_url || post.thumbnail_url;
                  const isVideo = post.media_type === 'VIDEO';

                  return (
                    <a
                      key={post.id}
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 p-4"
                    >
                      {/* Mídia */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={post.caption || 'Post do Instagram'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-10 h-10 bg-white/90 dark:bg-slate-800/90 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-slate-900 dark:text-white ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        {/* Caption */}
                        <div className="mb-2">
                          {post.caption ? (
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                              {post.caption}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                              Sem legenda
                            </p>
                          )}
                        </div>

                        {/* Stats e Data */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {/* Likes */}
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Heart className="w-4 h-4" />
                              <span className="font-medium text-sm">{post.like_count.toLocaleString('pt-BR')}</span>
                            </div>

                            {/* Comentários */}
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-medium text-sm">{post.comments_count.toLocaleString('pt-BR')}</span>
                            </div>
                          </div>

                          {/* Data */}
                          <span className="text-xs text-slate-500 dark:text-slate-500 flex-shrink-0">
                            {formatDate(post.timestamp)}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

