'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { useServerEvents, ServerEvent } from '@/hooks/useServerEvents';
import {
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineFire,
  HiOutlinePlus,
  HiOutlineMegaphone,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
} from 'react-icons/hi2';
import { RiRobotLine, RiWhatsappLine, RiInstagramLine } from 'react-icons/ri';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  metricas: {
    totalContatos: number;
    contatosAtivos: number;
    mensagensHoje: number;
    variacaoMensagens: number;
    oportunidadesQuentes: number;
    novosContatosHoje: number;
  };
  atividadesRecentes: Array<{
    id: string;
    tipo: 'whatsapp' | 'instagram';
    nome: string;
    contato: string;
    ultimaMensagem: string;
    dataUltimaMensagem: string | null;
    status: string;
  }>;
  contatosFollowUp: Array<{
    id: string;
    tipo: 'whatsapp' | 'instagram';
    nome: string;
    contato: string;
    dataUltimaMensagem: string | null;
    status: string;
  }>;
  tendencia: Array<{
    data: string;
    recebidas: number;
    enviadas: number;
  }>;
  topContatos: Array<{
    id: string;
    tipo: 'whatsapp' | 'instagram';
    nome: string;
    contato: string;
    status: string;
    favorito: boolean;
    tags: string[];
    dataUltimaMensagem: string | null;
  }>;
  funilResumo: Record<string, number>;
  statusSistema: {
    whatsapp: string;
    instagram: string;
    ia: string;
  };
}

export default function DashboardPage() {
  const { isOpen, isMobile } = useSidebar();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar dashboard');
      }
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Conecta ao Server-Sent Events para atualizações em tempo real
  useServerEvents({
    onNovaMensagem: () => {
      fetchDashboard();
    },
    onMensagemEnviada: () => {
      fetchDashboard();
    },
    onContatoAtualizado: () => {
      fetchDashboard();
    },
  });

  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'Data inválida';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Novo Contato': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'Triagem em Andamento': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Triagem Jurídica Concluída': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'Caso Urgente': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'Encaminhado para Atendimento Humano': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Não é caso Jurídico': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
              Dashboard
          </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base">
              Visão geral do seu CRM
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchDashboard}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && data && (
            <>
              {/* Cards de Métricas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase truncate">
                      Total Contatos
                    </h3>
                    <HiOutlineUserGroup className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {data.metricas.totalContatos}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
                    {data.metricas.contatosAtivos} ativos
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase truncate">
                      Mensagens Hoje
                    </h3>
                    <HiOutlineChatBubbleLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {data.metricas.mensagensHoje}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {data.metricas.variacaoMensagens >= 0 ? (
                      <HiOutlineArrowTrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <HiOutlineArrowTrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <p
                      className={`text-[10px] sm:text-xs truncate ${
                        data.metricas.variacaoMensagens >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {Math.abs(data.metricas.variacaoMensagens).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase truncate">
                      Conversas Ativas
                    </h3>
                    <HiOutlineArrowTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {data.metricas.contatosAtivos}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
                    Últimos 7 dias
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase truncate">
                      Oportunidades
                    </h3>
                    <HiOutlineFire className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {data.metricas.oportunidadesQuentes}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
                    Caso Urgente + Encaminhado
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 uppercase truncate">
                      Novos Hoje
                    </h3>
                    <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {data.metricas.novosContatosHoje}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
                    Contatos novos
                  </p>
                </div>
              </div>

              {/* Gráfico de Tendência e Ações Rápidas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Gráfico de Tendência */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0 overflow-hidden">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                    Tendência (7 dias)
                  </h2>
                  <div className="h-32 sm:h-40 md:h-48 flex items-end gap-1 sm:gap-2 min-w-0">
                    {data.tendencia.map((item, index) => {
                      const maxValue = Math.max(
                        ...data.tendencia.map((i) => i.recebidas + i.enviadas),
                        1
                      );
                      const alturaRecebidas = (item.recebidas / maxValue) * 100;
                      const alturaEnviadas = (item.enviadas / maxValue) * 100;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                          <div className="w-full flex gap-0.5 items-end justify-center h-full min-w-0">
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 min-h-[2px]"
                              style={{ height: `${alturaRecebidas}%` }}
                              title={`Recebidas: ${item.recebidas}`}
                            />
                            <div
                              className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 min-h-[2px]"
                              style={{ height: `${alturaEnviadas}%` }}
                              title={`Enviadas: ${item.enviadas}`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 truncate w-full text-center">
                            {formatDate(item.data)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Recebidas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Enviadas</span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                    Ações Rápidas
                  </h2>
                  <div className="space-y-2">
                    <Link
                      href="/campanhas"
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all min-w-0"
                    >
                      <HiOutlineMegaphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        Nova Campanha
                      </span>
                    </Link>
                    <Link
                      href="/contatos"
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all min-w-0"
                    >
                      <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        Criar Contato
                      </span>
                    </Link>
                    <Link
                      href="/templates"
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all min-w-0"
                    >
                      <HiOutlineDocumentText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        Criar Template
                      </span>
                    </Link>
                    <Link
                      href="/conversas"
                      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 hover:from-teal-100 hover:to-teal-200 dark:hover:from-teal-900/30 dark:hover:to-teal-800/30 transition-all min-w-0"
                    >
                      <HiOutlineChatBubbleLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        Ver Conversas
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alertas e Top Contatos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Alertas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <HiOutlineBell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      Alertas
                    </h2>
                  </div>
                  
                  {data.contatosFollowUp.length > 0 ? (
                    <div className="space-y-3">
                      {data.contatosFollowUp.slice(0, 5).map((contato) => (
                        <Link
                          key={contato.id}
                          href={`/conversas?contato=${contato.id}`}
                          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-800 min-w-0"
                        >
                          <div className="flex-shrink-0">
                            {contato.tipo === 'whatsapp' ? (
                              <RiWhatsappLine className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            ) : (
                              <RiInstagramLine className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                              {contato.nome}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 truncate">
                              Sem resposta há {formatTimeAgo(contato.dataUltimaMensagem)}
                            </p>
                          </div>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap ${getStatusColor(contato.status)}`}
                            title={contato.status}
                          >
                            <span className="hidden sm:inline">{contato.status}</span>
                            <span className="sm:hidden">{contato.status.length > 15 ? contato.status.substring(0, 12) + '...' : contato.status}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <HiOutlineCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Nenhum contato precisa de follow-up
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Contatos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                    Top Contatos
                  </h2>
                  
                  {data.topContatos.length > 0 ? (
                    <div className="space-y-3">
                      {data.topContatos.map((contato) => (
                        <Link
                          key={contato.id}
                          href={`/conversas?contato=${contato.id}`}
                          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-w-0"
                        >
                          <div className="flex-shrink-0">
                            {contato.tipo === 'whatsapp' ? (
                              <RiWhatsappLine className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            ) : (
                              <RiInstagramLine className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                                {contato.nome}
                              </p>
                              {contato.favorito && (
                                <span className="text-yellow-500 flex-shrink-0">★</span>
                              )}
                              {contato.tags.includes('Urgente') && (
                                <span className="px-1 sm:px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex-shrink-0">
                                  Urgente
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 truncate">
                              {formatTimeAgo(contato.dataUltimaMensagem)}
                            </p>
                          </div>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap ${getStatusColor(contato.status)}`}
                            title={contato.status}
                          >
                            <span className="hidden sm:inline">{contato.status}</span>
                            <span className="sm:hidden">{contato.status.length > 15 ? contato.status.substring(0, 12) + '...' : contato.status}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <HiOutlineUserGroup className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        Nenhum contato prioritário
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo do Funil e Status do Sistema */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Resumo do Funil */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                    Resumo do Funil
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {Object.entries(data.funilResumo).map(([status, count]) => (
                      <Link
                        key={status}
                        href={`/contatos?status=${status}`}
                        className="p-2 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center min-w-0"
                      >
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                          {count}
                        </p>
                        <p className={`text-[10px] sm:text-xs font-medium mt-1 ${getStatusColor(status)} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block break-words line-clamp-2 text-center w-full`}>
                          {status}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Status do Sistema */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                    Status do Sistema
                  </h2>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <RiWhatsappLine className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          WhatsApp
                        </span>
                      </div>
                      {data.statusSistema.whatsapp === 'conectado' ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400 flex-shrink-0">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Conectado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
                          <HiOutlineXCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Desconectado</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <RiInstagramLine className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          Instagram
                        </span>
                      </div>
                      {data.statusSistema.instagram === 'conectado' ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400 flex-shrink-0">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Conectado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
                          <HiOutlineXCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Desconectado</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <RiRobotLine className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          Atendimento IA
                        </span>
                      </div>
                      {data.statusSistema.ia === 'ativa' ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400 flex-shrink-0">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Ativa</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 dark:text-slate-500 flex-shrink-0">
                          <HiOutlineXCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-medium">Inativa</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Atividades Recentes */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 truncate">
                  Atividades Recentes
                </h2>
                
                {data.atividadesRecentes.length > 0 ? (
                  <div className="space-y-2">
                    {data.atividadesRecentes.map((atividade) => (
                      <Link
                        key={atividade.id}
                        href={`/conversas?contato=${atividade.id}`}
                        className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors min-w-0"
                      >
                        <div className="flex-shrink-0">
                          {atividade.tipo === 'whatsapp' ? (
                            <RiWhatsappLine className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : (
                            <RiInstagramLine className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                            {atividade.nome}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 truncate">
                            {atividade.ultimaMensagem || 'Sem mensagem'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${getStatusColor(atividade.status)}`}
                            title={atividade.status}
                          >
                            <span className="hidden sm:inline">{atividade.status}</span>
                            <span className="sm:hidden">{atividade.status.length > 15 ? atividade.status.substring(0, 12) + '...' : atividade.status}</span>
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {formatTimeAgo(atividade.dataUltimaMensagem)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <HiOutlineClock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      Nenhuma atividade recente
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
