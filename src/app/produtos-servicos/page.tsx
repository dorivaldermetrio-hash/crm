'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import CriarProdutoModal from '@/components/CriarProdutoModal';
import EditarProdutoModal from '@/components/EditarProdutoModal';
import ConfirmarExclusaoModal from '@/components/ConfirmarExclusaoModal';
import { Search, Plus, X, Edit, Trash2 } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descBreve: string;
  descCompleta: string;
  ativado: string;
  valor: string;
  duracao: string;
  createdAt: string | null;
}

export default function ProdutosServicosPage() {
  const { isOpen, isMobile } = useSidebar();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoExcluindo, setProdutoExcluindo] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/produtos');
      const data = await response.json();

      if (data.success) {
        setProdutos(data.produtos || []);
      } else {
        setError(data.error || 'Erro ao carregar produtos');
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  // Filtra os produtos por texto
  const produtosFiltrados = produtos.filter((produto) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      produto.nome.toLowerCase().includes(searchLower) ||
      produto.descBreve.toLowerCase().includes(searchLower) ||
      produto.descCompleta.toLowerCase().includes(searchLower) ||
      produto.valor.toLowerCase().includes(searchLower) ||
      produto.duracao.toLowerCase().includes(searchLower)
    );
  });

  // Cores do avatar baseado na primeira letra
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

  const handleEditar = (produto: Produto) => {
    setProdutoEditando(produto);
  };

  const handleExcluir = (produto: Produto) => {
    setProdutoExcluindo(produto);
  };

  const handleConfirmarExclusao = async () => {
    if (!produtoExcluindo) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/produtos/${produtoExcluindo.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao excluir produto');
      }

      setProdutoExcluindo(null);
      fetchProdutos();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      alert(error.message || 'Erro ao excluir produto. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                  Produtos e Serviços
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 truncate">
                  {loading
                    ? 'Carregando...'
                    : produtosFiltrados.length === 0
                    ? 'Nenhum produto encontrado'
                    : `${produtosFiltrados.length} ${produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
                  {produtos.length !== produtosFiltrados.length && (
                    <span className="text-slate-500 dark:text-slate-500">
                      {' '}de {produtos.length} total
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Busca e Botão Adicionar */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setModalAberto(true)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Adicionar Produto</span>
              <span className="sm:hidden">Adicionar</span>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando produtos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchProdutos}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && produtosFiltrados.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-700 min-w-0">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📦</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {produtos.length === 0 ? 'Nenhum produto ainda' : 'Nenhum produto encontrado'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                {produtos.length === 0
                  ? 'Comece adicionando seu primeiro produto ou serviço.'
                  : 'Tente ajustar o termo de busca.'}
              </p>
              {produtos.length === 0 && (
                <button
                  onClick={() => setModalAberto(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Adicionar Primeiro Produto
                </button>
              )}
            </div>
          )}

          {/* Grid de Produtos */}
          {!loading && !error && produtosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {produtosFiltrados.map((produto) => {
                const primeiraLetra = produto.nome.charAt(0).toUpperCase();

                return (
                  <div
                    key={produto.id}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-w-0"
                  >
                    {/* Header do Card */}
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {/* Avatar */}
                      <div
                        className={`${getAvatarColor(primeiraLetra)} w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0`}
                      >
                        {primeiraLetra}
                      </div>

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate mb-1">
                          {produto.nome}
                        </h3>
                        {produto.ativado && (
                          <span
                            className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] font-medium ${
                              produto.ativado.toLowerCase() === 'sim'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {produto.ativado === 'sim' ? 'Ativado' : 'Desativado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Descrição Breve */}
                    {produto.descBreve && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2">
                        {produto.descBreve}
                      </p>
                    )}

                    {/* Informações */}
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {produto.valor && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                          <span className="font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
                            Valor:
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">{produto.valor}</span>
                        </div>
                      )}
                      {produto.duracao && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                          <span className="font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
                            Duração:
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">{produto.duracao}</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação - sempre visíveis no mobile, hover no desktop */}
                    <div className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700`}>
                      <button
                        onClick={() => handleEditar(produto)}
                        className="flex-1 sm:flex-none px-3 sm:px-2.5 py-2 sm:py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg hover:shadow-xl text-xs sm:text-sm font-medium sm:font-normal"
                        aria-label="Editar produto"
                      >
                        <span className="sm:hidden">Editar</span>
                        <Edit className="hidden sm:block w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleExcluir(produto)}
                        className="flex-1 sm:flex-none px-3 sm:px-2.5 py-2 sm:py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg hover:shadow-xl text-xs sm:text-sm font-medium sm:font-normal"
                        aria-label="Excluir produto"
                      >
                        <span className="sm:hidden">Excluir</span>
                        <Trash2 className="hidden sm:block w-5 h-5" />
                      </button>
                    </div>

                    {/* Efeito hover sutil - apenas desktop */}
                    {!isMobile && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Criar Produto */}
      <CriarProdutoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => {
          fetchProdutos();
        }}
      />

      {/* Modal Editar Produto */}
      <EditarProdutoModal
        isOpen={produtoEditando !== null}
        onClose={() => setProdutoEditando(null)}
        onSuccess={() => {
          fetchProdutos();
        }}
        produto={produtoEditando}
      />

      {/* Modal Confirmar Exclusão */}
      <ConfirmarExclusaoModal
        isOpen={produtoExcluindo !== null}
        onClose={() => setProdutoExcluindo(null)}
        onConfirm={handleConfirmarExclusao}
        nomeProduto={produtoExcluindo?.nome || ''}
        excluindo={excluindo}
      />
    </div>
  );
}

