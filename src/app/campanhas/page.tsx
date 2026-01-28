'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import WhatsAppCampaignsSection from '@/components/WhatsAppCampaignsSection';
import EmailCampaignsSection from '@/components/EmailCampaignsSection';
import Slider from 'react-slick';
import DatePicker from 'react-datepicker';
import { HiComputerDesktop } from 'react-icons/hi2';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import 'react-datepicker/dist/react-datepicker.css';

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export default function CampanhasPage() {
  const { isOpen, isMobile } = useSidebar();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const [postDescription, setPostDescription] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [editEmojiPickerOpen, setEditEmojiPickerOpen] = useState(false);
  const [postMode, setPostMode] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loadingScheduledPosts, setLoadingScheduledPosts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState<Date | null>(null);
  const [editScheduledTime, setEditScheduledTime] = useState<Date | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const editEmojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
    fetchScheduledPosts();
    
    // Atualiza o timer a cada segundo para atualizar os contadores visuais
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
      if (editEmojiPickerRef.current && !editEmojiPickerRef.current.contains(event.target as Node)) {
        setEditEmojiPickerOpen(false);
      }
    };

    if (menuOpen || emojiPickerOpen || editEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, emojiPickerOpen, editEmojiPickerOpen]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cloudinary/images');
      const data = await response.json();

      if (data.success) {
        setImages(data.images || []);
      } else {
        setError(data.error || 'Erro ao carregar imagens');
      }
    } catch (err) {
      console.error('Erro ao buscar imagens:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      setLoadingScheduledPosts(true);
      const response = await fetch('/api/feedposts');
      const data = await response.json();

      if (data.success) {
        // Filtra apenas posts agendados (statusPost = false)
        const scheduled = (data.posts || []).filter((post: any) => !post.statusPost);
        setScheduledPosts(scheduled);
      }
    } catch (err) {
      console.error('Erro ao buscar posts agendados:', err);
    } finally {
      setLoadingScheduledPosts(false);
    }
  };

  const getTimeRemaining = (scheduledDate: string) => {
    const scheduled = new Date(scheduledDate);
    const now = currentTime;
    const diff = scheduled.getTime() - now.getTime();

    if (diff <= 0) {
      return { expired: true, text: 'Aguardando publicação...' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
    } else if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m ${seconds}s` };
    } else if (minutes > 0) {
      return { expired: false, text: `${minutes}m ${seconds}s` };
    } else {
      return { expired: false, text: `${seconds}s` };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      const response = await fetch(`/api/feedposts/${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove o post da lista
        setScheduledPosts((prev) => prev.filter((post) => post._id !== postId));
        setDeleteConfirmModal(null);
      } else {
        alert('Erro ao deletar post: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao deletar post:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleEditPost = (post: any) => {
    setPostToEdit(post);
    setEditDescription(post.descricao || '');
    
    // Preenche data e horário
    const postDate = new Date(post.dataPublicacao);
    setEditScheduledDate(postDate);
    
    // Cria um objeto Date apenas com horário para o time picker
    const timeDate = new Date();
    timeDate.setHours(postDate.getHours());
    timeDate.setMinutes(postDate.getMinutes());
    setEditScheduledTime(timeDate);
    
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!postToEdit) return;

    try {
      setSavingEdit(true);

      // Combina data e horário
      const scheduledDateTime = new Date(editScheduledDate!);
      const time = new Date(editScheduledTime!);
      scheduledDateTime.setHours(time.getHours());
      scheduledDateTime.setMinutes(time.getMinutes());
      scheduledDateTime.setSeconds(0);
      scheduledDateTime.setMilliseconds(0);

      const response = await fetch(`/api/feedposts/${postToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descricao: editDescription,
          dataPublicacao: scheduledDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualiza a lista
        fetchScheduledPosts();
        setEditModalOpen(false);
        setPostToEdit(null);
        setEditDescription('');
        setEditScheduledDate(null);
        setEditScheduledTime(null);
        setEditEmojiPickerOpen(false);
      } else {
        alert('Erro ao atualizar post: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao atualizar post:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSavingEdit(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0'; // No mobile, sidebar fica sobreposto quando aberto
    }
    return isOpen ? 'ml-64' : 'ml-20'; // Desktop: 256px quando aberto, 80px quando fechado
  };

  const handleDeleteClick = (publicId: string) => {
    setImageToDelete(publicId);
    setMenuOpen(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/cloudinary/images/${encodeURIComponent(imageToDelete)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove a imagem da lista
        setImages((prev) => prev.filter((img) => img.public_id !== imageToDelete));
        setConfirmModalOpen(false);
        setImageToDelete(null);
      } else {
        setError(data.error || 'Erro ao deletar imagem');
        setConfirmModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      setError('Erro ao deletar imagem');
      setConfirmModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleImageClick = (image: CloudinaryImage) => {
    setSelectedImage(image);
    setPostDescription('');
    setPostMode('now');
    setScheduledDate(null);
    setScheduledTime(null);
    setPostModalOpen(true);
  };

  const handleEmojiClick = (emoji: string) => {
    setPostDescription((prev) => prev + emoji);
    setEmojiPickerOpen(false);
  };

  // Emojis organizados por categoria
  const emojiCategories = {
    'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
    'Gestos': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍'],
    'Corações': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🩹'],
    'Símbolos': ['✨', '⭐', '🌟', '💫', '🔥', '💯', '✅', '❌', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎖', '🏅', '🎗', '🎟'],
    'Natureza': ['🌱', '🌿', '🍀', '🌾', '🌺', '🌸', '🌻', '🌷', '🌹', '🌼', '🌲', '🌳', '🌴', '🌵', '🌊', '☀️', '🌙', '⭐', '🌟', '🌈'],
    'Comida': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒'],
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setUploadError('Por favor, insira um link de imagem');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Adiciona a nova imagem à lista
        setImages((prev) => [data.image, ...prev]);
        setImageUrl('');
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(data.error || 'Erro ao adicionar imagem');
      }
    } catch (err) {
      console.error('Erro ao adicionar imagem:', err);
      setUploadError('Erro ao conectar com o servidor');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida se é uma imagem
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    // Valida tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 10MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Adiciona a nova imagem à lista
        setImages((prev) => [data.image, ...prev]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(data.error || 'Erro ao fazer upload da imagem');
      }
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      setUploadError('Erro ao conectar com o servidor');
    } finally {
      setUploading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Configurações do carrossel
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: isMobile ? 1 : 3,
    slidesToScroll: 1,
    autoplay: false,
    pauseOnHover: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Instagram
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Banco de Imagens
            </p>
          </div>

          {/* Carrossel */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando imagens...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchImages}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Faça upload de imagens no Cloudinary para vê-las aqui.
              </p>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="mb-6">
              <Slider {...sliderSettings} className="carousel-container">
                {images.map((image) => (
                  <div key={image.public_id} className="px-2">
                    <div 
                      className="relative group overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={image.secure_url}
                          alt={image.public_id}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Botão de configuração no hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="relative" ref={menuOpen === image.public_id ? menuRef : null}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setMenuOpen(menuOpen === image.public_id ? null : image.public_id);
                            }}
                            className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            aria-label="Configurações"
                          >
                            <svg
                              className="w-5 h-5 text-slate-700 dark:text-slate-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>

                          {/* Menu dropdown */}
                          {menuOpen === image.public_id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteClick(image.public_id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Remover imagem
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <p className="text-sm font-medium truncate">{image.public_id.split('/').pop()}</p>
                          <p className="text-xs text-white/80 mt-1">
                            {image.width} × {image.height}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          )}

          {/* Seção de Geração de Imagens */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Gerar imagens para publicidade
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-6 max-w-4xl leading-relaxed">
              Gere imagens para publicar em suas redes sociais, use as imagens do seu dispositivo ou informe o link das imagens para serem adicionadas ao banco de imagens. A partir daqui você consegue publicar em suas redes sociais, agendar publicações e monitorá-las para alcançar o máximo de público. Gerencie seu marketing de forma rápida e clara.
            </p>
            
            {/* Botões de IA */}
            <div className="flex flex-wrap gap-4">
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.59 3.683c-.169-.245-.426-.423-.721-.504-.295-.084-.61-.063-.895.058L.675 12.238c-.51.22-.86.71-.86 1.262 0 .552.35 1.042.86 1.262l3.83 1.67v6.158c0 .552.35 1.042.86 1.262.17.074.355.11.54.11.35 0 .695-.12.97-.34l2.83-2.47 6.91 3.02c.102.044.21.075.32.093v-9.3l-6.69-2.92v-2.3l8.98 3.92 2.57 1.12c.17.074.355.11.54.11.35 0 .695-.12.97-.34.51-.22.86-.71.86-1.262V4.445c0-.552-.35-1.042-.86-1.262z"/>
                </svg>
                Chat GPT
              </a>
              
              <a
                href="https://www.bing.com/images/create?cc=br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Microsoft Dall-e
              </a>
              
              <a
                href="https://gemini.google.com/app?hl=pt-BR"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Gemini Imagine
              </a>
              
              <a
                href="https://grok.com/imagine"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium hover:from-orange-700 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Grok Imagine
              </a>
            </div>

            {/* Seção de Adicionar Imagem por Link */}
            <div className="mt-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Adicionar imagem por link
                </h3>
                <form onSubmit={handleAddImage} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={uploading}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={uploading || !imageUrl.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adicionando...
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Adicionar Imagem
                        </>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      disabled={uploading}
                      className="px-6 py-2.5 bg-gradient-to-r from-slate-600 to-slate-500 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]"
                    >
                      <HiComputerDesktop size={20} />
                      Upload no Dispositivo
                    </button>
                  </div>
                </form>
                
                {uploadError && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{uploadError}</p>
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ Imagem adicionada com sucesso!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Posts Agendados */}
          <div className="mt-12 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Posts Agendados
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {scheduledPosts.length === 0
                    ? 'Nenhum post agendado'
                    : `${scheduledPosts.length} ${scheduledPosts.length === 1 ? 'post agendado' : 'posts agendados'}`}
                </p>
              </div>
            </div>

            {loadingScheduledPosts ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">Carregando posts agendados...</p>
                </div>
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Nenhum post agendado
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Agende posts para vê-los aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => {
                  const timeRemaining = getTimeRemaining(post.dataPublicacao);
                  return (
                    <div
                      key={post._id}
                      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                    >
                      <div className="flex gap-4 p-4">
                        {/* Imagem */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                          <img
                            src={post.imagem}
                            alt="Post agendado"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Descrição */}
                              {post.descricao ? (
                                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2">
                                  {post.descricao}
                                </p>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic mb-2">
                                  Sem descrição
                                </p>
                              )}

                              {/* Informações */}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                {/* Data e Hora */}
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>{formatDateTime(post.dataPublicacao)}</span>
                                </div>

                                {/* Timer */}
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className={`w-3.5 h-3.5 ${
                                      timeRemaining.expired
                                        ? 'text-yellow-500'
                                        : 'text-blue-500 animate-pulse'
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span
                                    className={`font-semibold ${
                                      timeRemaining.expired
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`}
                                  >
                                    {timeRemaining.text}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Badge de Status e Botão de Deletar */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  timeRemaining.expired
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {timeRemaining.expired ? 'Aguardando' : 'Agendado'}
                              </span>
                              <button
                                onClick={() => handleEditPost(post)}
                                disabled={deletingPostId === post._id}
                                className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Editar post agendado"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmModal(post._id)}
                                disabled={deletingPostId === post._id}
                                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remover post agendado"
                              >
                                {deletingPostId === post._id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {deleteConfirmModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Confirmar remoção
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    Tem certeza que deseja remover este post agendado? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setDeleteConfirmModal(null)}
                      disabled={deletingPostId !== null}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeletePost(deleteConfirmModal)}
                      disabled={deletingPostId !== null}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deletingPostId && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {deletingPostId ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção de Campanhas WhatsApp */}
          <WhatsAppCampaignsSection />

          {/* Seção de Campanhas Email */}
          <EmailCampaignsSection />

          {/* Modal de Edição de Post */}
          {editModalOpen && postToEdit && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Editar Post Agendado
                  </h3>
                  <button
                    onClick={() => {
                      setEditModalOpen(false);
                      setPostToEdit(null);
                      setEditDescription('');
                      setEditScheduledDate(null);
                      setEditScheduledTime(null);
                      setEditEmojiPickerOpen(false);
                    }}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Imagem */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Imagem do post
                      </h4>
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        <img
                          src={postToEdit.imagem}
                          alt="Post agendado"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Descrição do post
                        </h4>
                        <div className="relative" ref={editEmojiPickerRef}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditEmojiPickerOpen(!editEmojiPickerOpen);
                            }}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            type="button"
                          >
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
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>

                          {/* Seletor de Emojis */}
                          {editEmojiPickerOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-20 max-h-96 overflow-y-auto">
                              {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category} className="mb-4 last:mb-0">
                                  <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                                    {category}
                                  </h5>
                                  <div className="grid grid-cols-10 gap-1">
                                    {emojis.map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setEditDescription((prev) => prev + emoji);
                                          setEditEmojiPickerOpen(false);
                                        }}
                                        className="p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        type="button"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Escreva uma legenda para seu post..."
                        className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {editDescription.length} caracteres
                      </p>
                    </div>
                  </div>
                </div>

                {/* Data e Horário */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Data e horário de publicação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Data
                      </label>
                      <DatePicker
                        selected={editScheduledDate}
                        onChange={(date) => setEditScheduledDate(date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Selecione a data"
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        wrapperClassName="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Horário
                      </label>
                      <DatePicker
                        selected={editScheduledTime}
                        onChange={(time) => setEditScheduledTime(time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Horário"
                        dateFormat="HH:mm"
                        placeholderText="Selecione o horário"
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        wrapperClassName="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setEditModalOpen(false);
                      setPostToEdit(null);
                      setEditDescription('');
                      setEditScheduledDate(null);
                      setEditScheduledTime(null);
                      setEditEmojiPickerOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editScheduledDate || !editScheduledTime}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingEdit ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Criação de Post */}
          {postModalOpen && selectedImage && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Criar Post no Instagram
                  </h3>
                  <button
                    onClick={() => {
                      setPostModalOpen(false);
                      setSelectedImage(null);
                      setPostDescription('');
                      setPostMode('now');
                      setScheduledDate(null);
                      setScheduledTime(null);
                    }}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Imagem */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Imagem selecionada
                      </h4>
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        <img
                          src={selectedImage.secure_url}
                          alt={selectedImage.public_id}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Descrição do post
                        </h4>
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEmojiPickerOpen(!emojiPickerOpen);
                            }}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            type="button"
                          >
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
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>

                          {/* Seletor de Emojis */}
                          {emojiPickerOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-20 max-h-96 overflow-y-auto">
                              {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category} className="mb-4 last:mb-0">
                                  <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                                    {category}
                                  </h5>
                                  <div className="grid grid-cols-10 gap-1">
                                    {emojis.map((emoji, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleEmojiClick(emoji);
                                        }}
                                        className="p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        type="button"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={postDescription}
                        onChange={(e) => setPostDescription(e.target.value)}
                        placeholder="Escreva uma legenda para seu post..."
                        className="w-full h-64 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {postDescription.length} caracteres
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opções de Postagem */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setPostMode('now')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        postMode === 'now'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Postar Agora
                      </div>
                    </button>
                    <button
                      onClick={() => setPostMode('schedule')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        postMode === 'schedule'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Agendar Post
                      </div>
                    </button>
                  </div>

                  {/* Date/Time Picker para Agendamento */}
                  {postMode === 'schedule' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Data
                        </label>
                        <DatePicker
                          selected={scheduledDate}
                          onChange={(date) => setScheduledDate(date)}
                          minDate={new Date()}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Selecione a data"
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          wrapperClassName="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Horário
                        </label>
                        <DatePicker
                          selected={scheduledTime}
                          onChange={(time) => setScheduledTime(time)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Horário"
                          dateFormat="HH:mm"
                          placeholderText="Selecione o horário"
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          wrapperClassName="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setPostModalOpen(false);
                      setSelectedImage(null);
                      setPostDescription('');
                      setPostMode('now');
                      setScheduledDate(null);
                      setScheduledTime(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedImage) return;

                      try {
                        setSavingPost(true);

                        // Determina a data de publicação
                        let dataPublicacao: Date;
                        if (postMode === 'now') {
                          dataPublicacao = new Date();
                        } else {
                          if (!scheduledDate || !scheduledTime) return;
                          
                          // Combina data e horário
                          const scheduledDateTime = new Date(scheduledDate);
                          const time = new Date(scheduledTime);
                          scheduledDateTime.setHours(time.getHours());
                          scheduledDateTime.setMinutes(time.getMinutes());
                          scheduledDateTime.setSeconds(0);
                          scheduledDateTime.setMilliseconds(0);
                          
                          dataPublicacao = scheduledDateTime;
                        }

                        // Determina o status do post
                        // Se for "Postar Agora", statusPost = true (já postado)
                        // Se for "Agendar Post", statusPost = false (ainda não postado)
                        const statusPost = postMode === 'now';

                        // Salva no banco de dados
                        const response = await fetch('/api/feedposts', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            imagem: selectedImage.secure_url,
                            dataPublicacao: dataPublicacao.toISOString(),
                            statusPost,
                            descricao: postDescription,
                          }),
                        });

                        const data = await response.json();

                        if (data.success) {
                          console.log('Post salvo com sucesso:', data.post);
                          
                          // Se for "Postar Agora" e foi postado no Instagram, mostra modal de sucesso
                          if (postMode === 'now' && data.instagramPostId) {
                            setPostModalOpen(false);
                            setSuccessModalOpen(true);
                          } else {
                            // Se for agendado, apenas fecha o modal e atualiza a lista
                            setPostModalOpen(false);
                            fetchScheduledPosts(); // Atualiza a lista de posts agendados
                          }
                          
                          // Limpa os estados
                          setSelectedImage(null);
                          setPostDescription('');
                          setPostMode('now');
                          setScheduledDate(null);
                          setScheduledTime(null);
                        } else {
                          console.error('Erro ao salvar post:', data.error);
                          alert('Erro ao salvar post: ' + (data.error || 'Erro desconhecido'));
                        }
                      } catch (err) {
                        console.error('Erro ao salvar post:', err);
                        alert('Erro ao conectar com o servidor');
                      } finally {
                        setSavingPost(false);
                      }
                    }}
                    disabled={(postMode === 'schedule' && (!scheduledDate || !scheduledTime)) || savingPost}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingPost ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      postMode === 'now' ? 'Postar Agora' : 'Agendar Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Sucesso */}
          {successModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
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
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Post publicado com sucesso!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                    Sua imagem foi publicada no feed do Instagram com sucesso.
                  </p>
                  <button
                    onClick={() => setSuccessModalOpen(false)}
                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmação */}
          {confirmModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Confirmar remoção
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  Tem certeza que deseja remover esta imagem? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setConfirmModalOpen(false);
                      setImageToDelete(null);
                    }}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {deleting ? 'Removendo...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

