'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import CriarContatoEmailModal from '@/components/CriarContatoEmailModal';
import EditarContatoEmailModal from '@/components/EditarContatoEmailModal';
import ConfirmarExclusaoContatoEmailModal from '@/components/ConfirmarExclusaoContatoEmailModal';
import { Plus, Mail, Pencil, Trash2 } from 'lucide-react';

interface ContatoEmail {
  id: string;
  nome: string;
  email: string;
  createdAt: string | null;
}

export default function ContatosEmailPage() {
  const { isOpen, isMobile } = useSidebar();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [contatosEmail, setContatosEmail] = useState<ContatoEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contatoEmailEditando, setContatoEmailEditando] = useState<ContatoEmail | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [contatoEmailExcluindo, setContatoEmailExcluindo] = useState<ContatoEmail | null>(null);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    fetchContatosEmail();
  }, []);

  const fetchContatosEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/contatos-email');
      const data = await response.json();

      if (data.success) {
        setContatosEmail(data.contatosEmail || []);
      } else {
        setError(data.error || 'Erro ao carregar contatos email');
      }
    } catch (err) {
      console.error('Erro ao buscar contatos email:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!contatoEmailExcluindo) return;

    setExcluindo(true);
    try {
      const response = await fetch(`/api/contatos-email/${contatoEmailExcluindo.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setModalExcluirAberto(false);
        setContatoEmailExcluindo(null);
        fetchContatosEmail();
      } else {
        setError(data.error || 'Erro ao excluir contato email');
      }
    } catch (err) {
      console.error('Erro ao excluir contato email:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setExcluindo(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Contatos de Email
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  {loading
                    ? 'Carregando...'
                    : contatosEmail.length === 0
                    ? 'Nenhum contato email encontrado'
                    : `${contatosEmail.length} ${contatosEmail.length === 1 ? 'contato encontrado' : 'contatos encontrados'}`}
                </p>
              </div>
              <button
                onClick={() => setModalCriarAberto(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Adicionar Contato Email
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando contatos email...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchContatosEmail}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && contatosEmail.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhum contato email ainda
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Adicione seu primeiro contato email para começar.
              </p>
            </div>
          )}

          {/* Lista de Contatos Email */}
          {!loading && !error && contatosEmail.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {contatosEmail.map((contato) => {
                  const primeiraLetra = contato.nome
                    ? contato.nome.charAt(0).toUpperCase()
                    : contato.email.charAt(0).toUpperCase();

                  // Cores do avatar baseadas na primeira letra
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
                  const corAvatar = cores[primeiraLetra.charCodeAt(0) % cores.length];

                  return (
                    <div
                      key={contato.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {/* Avatar */}
                      <div
                        className={`${corAvatar} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}
                      >
                        {primeiraLetra}
                      </div>

                      {/* Nome e Email */}
                      <div className="flex-1 flex items-center justify-between gap-4 min-w-0 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-base truncate">
                            {contato.nome}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 relative">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 transition-transform duration-300 ease-in-out group-hover:-translate-x-20">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm truncate">{contato.email}</span>
                          </div>
                          {/* Botões de ação (aparecem no hover) */}
                          <div className="flex items-center gap-2 absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContatoEmailEditando(contato);
                                setModalEditarAberto(true);
                              }}
                              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              aria-label="Editar contato"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContatoEmailExcluindo(contato);
                                setModalExcluirAberto(true);
                              }}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              aria-label="Excluir contato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Criar Contato Email */}
      <CriarContatoEmailModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onSuccess={() => {
          fetchContatosEmail();
        }}
      />

      {/* Modal Editar Contato Email */}
      <EditarContatoEmailModal
        contatoEmail={contatoEmailEditando}
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setContatoEmailEditando(null);
        }}
        onSuccess={() => {
          fetchContatosEmail();
        }}
      />

      {/* Modal Confirmar Exclusão */}
      <ConfirmarExclusaoContatoEmailModal
        isOpen={modalExcluirAberto}
        onClose={() => {
          setModalExcluirAberto(false);
          setContatoEmailExcluindo(null);
        }}
        onConfirm={handleExcluir}
        nomeContato={contatoEmailExcluindo?.nome || ''}
        emailContato={contatoEmailExcluindo?.email || ''}
        excluindo={excluindo}
      />
    </div>
  );
}

