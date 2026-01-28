'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ContatoCard from '@/components/ContatoCard';
import ChatModal from '@/components/ChatModal';
import EditarContatoModal from '@/components/EditarContatoModal';
import { useSidebar } from '@/contexts/SidebarContext';
import { useServerEvents, ServerEvent } from '@/hooks/useServerEvents';

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

export default function ConversasPage() {
  const { isOpen, isMobile } = useSidebar();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contatoSelecionado, setContatoSelecionado] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [contatoEditando, setContatoEditando] = useState<Contato | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  useEffect(() => {
    fetchContatos();
  }, []);

  // Escuta o evento de contato deletado
  useEffect(() => {
    const handleContatoDeletado = () => {
      fetchContatos();
      // Fecha o modal se estiver aberto
      setModalAberto(false);
      setContatoSelecionado(null);
    };

    window.addEventListener('contatoDeletado', handleContatoDeletado);
    return () => {
      window.removeEventListener('contatoDeletado', handleContatoDeletado);
    };
  }, []);

  // Conecta ao Server-Sent Events para atualizações em tempo real
  useServerEvents({
    onNovaMensagem: (event: ServerEvent) => {
      console.log('📨 Nova mensagem recebida:', event);
      // Atualiza a lista de contatos quando recebe nova mensagem (sem mostrar loading)
      fetchContatosSilently();
    },
    onMensagemEnviada: (event: ServerEvent) => {
      console.log('📤 Mensagem enviada:', event);
      // Atualiza a lista de contatos quando envia mensagem (sem mostrar loading)
      fetchContatosSilently();
    },
  });

  // Função para atualizar contatos sem mostrar loading (atualização silenciosa)
  const fetchContatosSilently = async () => {
    try {
      const response = await fetch('/api/contatos');
      const data = await response.json();

      if (data.success) {
        setContatos(data.contatos || []);
      }
    } catch (err) {
      console.error('Erro ao atualizar contatos:', err);
      // Não mostra erro em atualizações silenciosas
    }
  };

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
      return 'ml-0'; // No mobile, sidebar fica sobreposto quando aberto
    }
    return isOpen ? 'ml-64' : 'ml-20'; // Desktop: 256px quando aberto, 80px quando fechado
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Conversas
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              {loading
                ? 'Carregando...'
                : contatos.length === 0
                ? 'Nenhuma conversa ainda'
                : `${contatos.length} ${contatos.length === 1 ? 'conversa' : 'conversas'}`}
            </p>
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
          {!loading && !error && contatos.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhuma conversa ainda
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Quando você receber mensagens do WhatsApp, elas aparecerão aqui.
              </p>
            </div>
          )}

          {/* Grid de Cards */}
          {!loading && !error && contatos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contatos.map((contato) => (
                <ContatoCard
                  key={contato.id}
                  id={contato.id}
                  contato={contato.contato}
                  contatoNome={contato.contatoNome}
                  ultimaMensagem={contato.ultimaMensagem}
                  dataUltimaMensagem={contato.dataUltimaMensagem}
                  status={contato.status}
                  tags={contato.tags}
                  favorito={contato.favorito}
                  arquivar={contato.arquivar}
                  onEdit={(e) => {
                    e?.stopPropagation();
                    setContatoEditando(contato);
                    setModalEditarAberto(true);
                  }}
                  onClick={() => {
                    setContatoSelecionado(contato.id);
                    setModalAberto(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Chat Modal */}
      <ChatModal
        contatoId={contatoSelecionado}
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setContatoSelecionado(null);
        }}
      />

      {/* Editar Contato Modal */}
      <EditarContatoModal
        contato={contatoEditando}
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setContatoEditando(null);
        }}
        onUpdate={() => {
          fetchContatosSilently();
        }}
      />
    </div>
  );
}

