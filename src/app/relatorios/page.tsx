'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowTrendingUp,
  HiOutlineCube,
} from 'react-icons/hi2';
import { RiRobotLine } from 'react-icons/ri';

interface RelatoriosData {
  periodo: string;
  metricas: {
    totalContatos: number;
    totalContatosWhatsApp: number;
    totalContatosInstagram: number;
    contatosAtivos: number;
    totalMensagensRecebidas: number;
    totalMensagensEnviadas: number;
    taxaConversao: number;
  };
  funil: {
    distribuicao: Record<string, number>;
    conversaoPorEtapa: {
      novoContatoParaTriagem?: number;
      triagemParaTriagemJuridica?: number;
      triagemJuridicaParaUrgente?: number;
      urgenteParaEncaminhado?: number;
    };
  };
  mensagens: {
    porStatus: Record<string, number>;
    temporal: Array<{
      data: string;
      recebidas: number;
      enviadas: number;
    }>;
  };
  produtos: {
    topProdutos: Array<{ nome: string; contatos: number }>;
    desconhecidos: number;
  };
  tags: Record<string, number>;
  canais: {
    WhatsApp: number;
    Instagram: number;
  };
}

export default function RelatoriosPage() {
  const { isOpen, isMobile } = useSidebar();
  const [data, setData] = useState<RelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  useEffect(() => {
    fetchRelatorios();
  }, [periodo]);

  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/relatorios?periodo=${periodo}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar relatórios');
      }
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  // Cores para status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Aberta: 'bg-green-500',
      Qualificação: 'bg-yellow-500',
      Proposta: 'bg-blue-500',
      Negociação: 'bg-purple-500',
      Fechamento: 'bg-teal-500',
      Perdida: 'bg-red-500',
    };
    return colors[status] || 'bg-slate-500';
  };

  // Formata data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Relatórios
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Análise completa do seu CRM
              </p>
            </div>

            {/* Seletor de Período */}
            <div className="flex gap-2">
              {(['hoje', 'semana', 'mes', 'todos'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    periodo === p
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando relatórios...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchRelatorios}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && data && (
            <>
              {/* Cards de Métricas Principais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total de Contatos
                    </h3>
                    <HiOutlineUserGroup className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data.metricas.totalContatos}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {data.metricas.totalContatosWhatsApp} WhatsApp + {data.metricas.totalContatosInstagram} Instagram
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Contatos Ativos
                    </h3>
                    <HiOutlineArrowTrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data.metricas.contatosAtivos}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Últimos 7 dias
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Taxa de Conversão
                    </h3>
                    <HiOutlineChartBar className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {(data.metricas.taxaConversao ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Fechamentos / Total
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Mensagens
                    </h3>
                    <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-teal-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data.metricas.totalMensagensRecebidas + data.metricas.totalMensagensEnviadas}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {data.metricas.totalMensagensRecebidas} recebidas / {data.metricas.totalMensagensEnviadas} enviadas
                  </p>
                </div>
              </div>

              {/* Funil de Vendas */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Funil de Vendas
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(data.funil.distribuicao).map(([status, count]) => {
                    const total = Object.values(data.funil.distribuicao).reduce((a, b) => a + b, 0);
                    const porcentagem = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {count}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-500 w-12 text-right">
                              {(porcentagem ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(status)} transition-all duration-500`}
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Taxa de Conversão por Etapa */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Taxa de Conversão por Etapa
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                        Novo Contato → Triagem
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {((data.funil.conversaoPorEtapa?.novoContatoParaTriagem ?? 0) || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                        Triagem → Triagem Jurídica
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {((data.funil.conversaoPorEtapa?.triagemParaTriagemJuridica ?? 0) || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                        Triagem Jurídica → Urgente
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {((data.funil.conversaoPorEtapa?.triagemJuridicaParaUrgente ?? 0) || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                        Urgente → Encaminhado
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {((data.funil.conversaoPorEtapa?.urgenteParaEncaminhado ?? 0) || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Mensagens */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Mensagens ao Longo do Tempo
                </h2>
                
                <div className="h-64 flex items-end gap-1">
                  {data.mensagens.temporal.map((item, index) => {
                    const maxValue = Math.max(
                      ...data.mensagens.temporal.map((i) => i.recebidas + i.enviadas)
                    );
                    const alturaRecebidas = maxValue > 0 ? (item.recebidas / maxValue) * 100 : 0;
                    const alturaEnviadas = maxValue > 0 ? (item.enviadas / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full flex gap-0.5 items-end justify-center h-full">
                          <div
                            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 group-hover:opacity-90"
                            style={{ height: `${alturaRecebidas}%` }}
                            title={`Recebidas: ${item.recebidas}`}
                          />
                          <div
                            className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 group-hover:opacity-90"
                            style={{ height: `${alturaEnviadas}%` }}
                            title={`Enviadas: ${item.enviadas}`}
                          />
                        </div>
                        {index % 5 === 0 && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 transform -rotate-45 origin-top-left">
                            {formatDate(item.data)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-4">
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

              {/* Top Produtos e Distribuição */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Produtos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <HiOutlineCube className="w-5 h-5 text-purple-500" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Top Produtos
                    </h2>
                  </div>
                  
                  {data.produtos.topProdutos.length > 0 ? (
                    <div className="space-y-3">
                      {data.produtos.topProdutos.slice(0, 5).map((produto, index) => {
                        const maxContatos = Math.max(
                          ...data.produtos.topProdutos.map((p) => p.contatos)
                        );
                        const porcentagem = maxContatos > 0 ? (produto.contatos / maxContatos) * 100 : 0;
                        
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {produto.nome}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {produto.contatos}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${porcentagem}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      Nenhum produto com interesse identificado
                    </p>
                  )}
                  
                  {data.produtos.desconhecidos > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {data.produtos.desconhecidos} contatos com interesse desconhecido
                      </p>
                    </div>
                  )}
                </div>

                {/* Distribuição por Tags */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Distribuição por Tags
                  </h2>
                  
                  {Object.keys(data.tags).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(data.tags)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([tag, count]) => {
                          const total = Object.values(data.tags).reduce((a, b) => a + b, 0);
                          const porcentagem = total > 0 ? ((count as number) / total) * 100 : 0;
                          
                          return (
                            <div key={tag}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {tag}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {count as number}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                                  style={{ width: `${porcentagem}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      Nenhuma tag atribuída
                    </p>
                  )}
                </div>
              </div>

              {/* Contatos por Canal */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Contatos por Canal
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        WhatsApp
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.canais.WhatsApp}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            data.metricas.totalContatos > 0
                              ? (data.canais.WhatsApp / data.metricas.totalContatos) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Instagram
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.canais.Instagram}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${
                            data.metricas.totalContatos > 0
                              ? (data.canais.Instagram / data.metricas.totalContatos) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

