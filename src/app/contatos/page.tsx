'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import EditarContatoModal from '@/components/EditarContatoModal';
import CriarContatoModal from '@/components/CriarContatoModal';
import { Settings, Search, X, Filter, Star, Archive, Phone, Plus } from 'lucide-react';

interface Contato {
  id: string;
  contato: string;
  contatoNome: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string | null;
  status?: 'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  nota?: string;
  favorito?: boolean;
  arquivar?: boolean;
  produtoInteresse?: string;
  informacoesCaso?: string;
  inicialConcluido?: boolean;
  createdAt: string | null;
}

export default function ContatosPage() {
  const { isOpen, isMobile } = useSidebar();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contatoEditando, setContatoEditando] = useState<Contato | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContatos();
  }, []);

  // Fecha filtros ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filtersOpen]);

  const fetchContatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/contatos');
      const data = await response.json();

      if (data.success) {
        setContatos(data.contatos || []);
      } else {
        setError(data.error || 'Erro ao carregar contatos');
      }
    } catch (err) {
      console.error('Erro ao buscar contatos:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  // Filtra os contatos
  const contatosFiltrados = contatos.filter((contato) => {
    // Filtro de busca (nome ou número)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nomeMatch = contato.contatoNome?.toLowerCase().includes(searchLower);
      const numeroMatch = contato.contato?.toLowerCase().includes(searchLower);
      if (!nomeMatch && !numeroMatch) return false;
    }

    // Filtro de status
    if (selectedStatus && contato.status !== selectedStatus) {
      return false;
    }

    // Filtro de tags
    if (selectedTags.length > 0) {
      const hasAnyTag = selectedTags.some((tag) => contato.tags?.includes(tag as any));
      if (!hasAnyTag) return false;
    }

    // Filtro de favoritos
    if (showFavoritesOnly && !contato.favorito) {
      return false;
    }

    // Filtro de arquivados
    if (showArchivedOnly && !contato.arquivar) {
      return false;
    }

    return true;
  });

  // Obtém todas as tags únicas dos contatos
  const todasTags = Array.from(
    new Set(contatos.flatMap((c) => c.tags || []))
  ) as Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;

  // Obtém todos os status únicos
  const todosStatus = Array.from(
    new Set(contatos.map((c) => c.status).filter(Boolean))
  ) as Array<'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida'>;

  // Conta filtros ativos
  const filtrosAtivos =
    (searchTerm ? 1 : 0) +
    (selectedStatus ? 1 : 0) +
    selectedTags.length +
    (showFavoritesOnly ? 1 : 0) +
    (showArchivedOnly ? 1 : 0);

  // Limpa todos os filtros
  const limparFiltros = () => {
    setSearchTerm('');
    setSelectedStatus(null);
    setSelectedTags([]);
    setShowFavoritesOnly(false);
    setShowArchivedOnly(false);
  };

  // Cores do avatar
  const getAvatarColor = (letra: string) => {
    const cores = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-red-500 to-red-600',
    ];
    return cores[letra.charCodeAt(0) % cores.length];
  };

  // Cores das tags
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Urgente':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Importante':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Seguimento':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Cliente':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Prospecto':
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600';
    }
  };

  // Cores do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aberta':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Qualificação':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Proposta':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Negociação':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Fechamento':
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'Perdida':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Contatos
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              {loading
                ? 'Carregando...'
                : contatosFiltrados.length === 0
                ? 'Nenhum contato encontrado'
                : `${contatosFiltrados.length} ${contatosFiltrados.length === 1 ? 'contato encontrado' : 'contatos encontrados'}`}
              {contatos.length !== contatosFiltrados.length && (
                <span className="text-slate-500 dark:text-slate-500">
                  {' '}de {contatos.length} total
                </span>
              )}
            </p>
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="mb-6 space-y-4">
            {/* Barra de Busca e Botão Adicionar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou número..."
                  className="w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setModalCriarAberto(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Adicionar Contato
              </button>
            </div>

            {/* Filtros Rápidos e Botão de Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtros Rápidos */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  showFavoritesOnly
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Favoritos
              </button>

              <button
                onClick={() => setShowArchivedOnly(!showArchivedOnly)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  showArchivedOnly
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Archive className="w-4 h-4" />
                Arquivados
              </button>

              {/* Botão de Filtros Avançados */}
              <div className="relative" ref={filtersRef}>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    filtrosAtivos > 0
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {filtrosAtivos > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-white/20 dark:bg-white/10 rounded-full text-xs font-bold">
                      {filtrosAtivos}
                    </span>
                  )}
                </button>

                {/* Dropdown de Filtros */}
                {filtersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                    <div className="space-y-4">
                      {/* Filtro de Status */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {todosStatus.map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                setSelectedStatus(selectedStatus === status ? null : status)
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                selectedStatus === status
                                  ? getStatusColor(status) + ' border-2'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtro de Tags */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {todasTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                if (selectedTags.includes(tag)) {
                                  setSelectedTags(selectedTags.filter((t) => t !== tag));
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                                selectedTags.includes(tag)
                                  ? getTagColor(tag) + ' border-2'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Botão Limpar Filtros */}
                      {filtrosAtivos > 0 && (
                        <button
                          onClick={limparFiltros}
                          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando contatos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchContatos}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && contatosFiltrados.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {contatos.length === 0 ? 'Nenhum contato ainda' : 'Nenhum contato encontrado'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {contatos.length === 0
                  ? 'Quando você receber mensagens do WhatsApp, os contatos aparecerão aqui.'
                  : 'Tente ajustar os filtros ou a busca.'}
              </p>
              {filtrosAtivos > 0 && (
                <button
                  onClick={limparFiltros}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          )}

          {/* Grid de Contatos */}
          {!loading && !error && contatosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contatosFiltrados.map((contato) => {
                const primeiraLetra = contato.contatoNome
                  ? contato.contatoNome.charAt(0).toUpperCase()
                  : contato.contato.charAt(contato.contato.length - 1);
                const nomeExibido = contato.contatoNome || contato.contato;

                return (
                  <div
                    key={contato.id}
                    onClick={() => {
                      setContatoEditando(contato);
                      setModalEditarAberto(true);
                    }}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    {/* Header do Card */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div
                        className={`${getAvatarColor(primeiraLetra)} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 relative`}
                      >
                        {primeiraLetra}
                        {contato.favorito && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                            <Star className="w-3 h-3 fill-yellow-600 text-yellow-600" />
                          </div>
                        )}
                      </div>

                      {/* Nome e Botão de Editar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate mb-1">
                              {nomeExibido}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="w-3 h-3" />
                              <span className="truncate">{contato.contato}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContatoEditando(contato);
                              setModalEditarAberto(true);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            aria-label="Editar contato"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tags e Status */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {contato.tags && contato.tags.length > 0 && (
                        <>
                          {contato.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {contato.tags.length > 2 && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                              +{contato.tags.length - 2}
                            </span>
                          )}
                        </>
                      )}
                      {contato.status && contato.status !== 'Aberta' && (
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${getStatusColor(contato.status)}`}
                        >
                          {contato.status}
                        </span>
                      )}
                    </div>

                    {/* Efeito hover sutil */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Editar Contato Modal */}
      <EditarContatoModal
        contato={contatoEditando}
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setContatoEditando(null);
        }}
        onUpdate={() => {
          fetchContatos();
        }}
      />

      {/* Criar Contato Modal */}
      <CriarContatoModal
        isOpen={modalCriarAberto}
        onClose={() => {
          setModalCriarAberto(false);
        }}
        onSuccess={() => {
          fetchContatos();
        }}
      />
    </div>
  );
}

