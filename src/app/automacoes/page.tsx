'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { HiOutlineCheckCircle } from 'react-icons/hi2';
import TextareaComVariaveis from '@/components/TextareaComVariaveis';

type StatusAutomação = 'Novo Contato' | 'Triagem em Andamento' | 'Validação de Resumo' | 'Urgência Não Definida' | 'Solicitação de Nome' | 'Oferecendo Agendamento' | 'Agendamento Aceito' | 'Agendamento Não Aceito' | 'Atendimento Padrão';

interface AutomacaoItem {
  prompt: string;
  numMaxMsg: number;
}

type SelectedProperty = 'base' | StatusAutomação | 'variaveis' | 'verificadorResumo' | 'validacaoResumoIncorporacao' | 'validacaoUrgencia' | 'validacaoNome' | 'validacaoAgendamento' | 'profissionais';

interface VariaveisAtendimento {
  numMaxMsgHistorico: number;
  agendamentosLivresHoras: number;
  pausarAtendimentoStatus: 'Nenhum' | 'Novo Contato' | 'Triagem em Andamento' | 'Validação de Resumo' | 'Urgência Não Definida' | 'Solicitação de Nome' | 'Oferecendo Agendamento' | 'Agendamento Aceito' | 'Agendamento Não Aceito';
}

export default function AutomacoesPage() {
  const { isOpen, isMobile } = useSidebar();
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty>('base');
  const [automacoes, setAutomacoes] = useState<Record<string, AutomacaoItem>>({});
  const [verificadorResumoPrompt, setVerificadorResumoPrompt] = useState<string>('');
  const [validacaoResumoIncorporacaoPrompt, setValidacaoResumoIncorporacaoPrompt] = useState<string>('');
  const [validacaoUrgenciaPrompt, setValidacaoUrgenciaPrompt] = useState<string>('');
  const [validacaoNomePrompt, setValidacaoNomePrompt] = useState<string>('');
  const [validacaoAgendamentoPrompt, setValidacaoAgendamentoPrompt] = useState<string>('');
  const [variaveis, setVariaveis] = useState<VariaveisAtendimento>({
    numMaxMsgHistorico: 0,
    agendamentosLivresHoras: 0,
    pausarAtendimentoStatus: 'Nenhum',
  });
  const [config, setConfig] = useState({
    numMsgHist: 0,
    duracaoAgendamento: '0:00',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingVariaveis, setSavingVariaveis] = useState(false);
  const [saveVariaveisSuccess, setSaveVariaveisSuccess] = useState(false);
  const [profissionais, setProfissionais] = useState<Array<{
    id: string;
    nome: string;
    areas_atuacao: string[];
    mensagem_autoridade: Record<string, string>;
  }>>([]);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [showProfissionalForm, setShowProfissionalForm] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<{
    id: string;
    nome: string;
    areas_atuacao: string[];
    mensagem_autoridade: Record<string, string>;
  } | null>(null);
  const [profissionalForm, setProfissionalForm] = useState({
    nome: '',
    areas_atuacao: [] as string[],
    mensagem_autoridade: {} as Record<string, string>,
  });
  const [novaArea, setNovaArea] = useState('');
  const [savingProfissional, setSavingProfissional] = useState(false);

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  // Carrega automações salvas da API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/atendimento-ai');
        const result = await response.json();
        
        if (result.success && result.data) {
          setAutomacoes(result.data);
          // Carrega os prompts de validação se existirem
          if (result.data['Verificador de Resumo']) {
            setVerificadorResumoPrompt(result.data['Verificador de Resumo'].prompt || '');
          }
          if (result.data['Validação do Resumo e Incorporação']) {
            setValidacaoResumoIncorporacaoPrompt(result.data['Validação do Resumo e Incorporação'].prompt || '');
          }
          if (result.data['Validação de Urgência']) {
            setValidacaoUrgenciaPrompt(result.data['Validação de Urgência'].prompt || '');
          }
          if (result.data['Validação de Nome']) {
            setValidacaoNomePrompt(result.data['Validação de Nome'].prompt || '');
          }
          if (result.data['Validação de Agendamento']) {
            setValidacaoAgendamentoPrompt(result.data['Validação de Agendamento'].prompt || '');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar automações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Carrega configurações quando selecionar variáveis
  useEffect(() => {
    const fetchConfig = async () => {
      if (selectedProperty === 'variaveis') {
        try {
          const response = await fetch('/api/config');
          const result = await response.json();
          
          if (result.success && result.data) {
            setVariaveis({
              numMaxMsgHistorico: result.data.numMsgHist || 0,
              agendamentosLivresHoras: result.data.duracaoAgendamento || 0,
              pausarAtendimentoStatus: (result.data.pararAtendimento || 'Nenhum') as VariaveisAtendimento['pausarAtendimentoStatus'],
            });
            setConfig({
              numMsgHist: result.data.numMsgHist || 0,
              duracaoAgendamento: result.data.duracaoAgendamento || '0:00',
            });
          }
        } catch (error) {
          console.error('Erro ao carregar configurações:', error);
        }
      }
    };

    fetchConfig();
  }, [selectedProperty]);

  // Carrega config sempre para usar nos tooltips
  useEffect(() => {
    const fetchConfigForTooltips = async () => {
      try {
        const response = await fetch('/api/config');
        const result = await response.json();
        
        if (result.success && result.data) {
          setConfig({
            numMsgHist: result.data.numMsgHist || 0,
            duracaoAgendamento: result.data.duracaoAgendamento || '0:00',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    fetchConfigForTooltips();
  }, []);

  // Carrega profissionais quando selecionar profissionais
  useEffect(() => {
    const fetchProfissionais = async () => {
      if (selectedProperty === 'profissionais') {
        setLoadingProfissionais(true);
        try {
          const response = await fetch('/api/profissionais');
          const result = await response.json();
          
          if (result.success && result.profissionais) {
            setProfissionais(result.profissionais);
          }
        } catch (error) {
          console.error('Erro ao carregar profissionais:', error);
        } finally {
          setLoadingProfissionais(false);
        }
      }
    };

    fetchProfissionais();
  }, [selectedProperty]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (selectedProperty === 'verificadorResumo') {
        // Salvar verificador de resumo
        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: 'Verificador de Resumo',
            prompt: verificadorResumoPrompt,
            numMaxMsg: 0,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      } else if (selectedProperty === 'validacaoResumoIncorporacao') {
        // Salvar validação do resumo e incorporação
        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: 'Validação do Resumo e Incorporação',
            prompt: validacaoResumoIncorporacaoPrompt,
            numMaxMsg: 0,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      } else if (selectedProperty === 'validacaoUrgencia') {
        // Salvar validação de urgência
        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: 'Validação de Urgência',
            prompt: validacaoUrgenciaPrompt,
            numMaxMsg: 0,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      } else if (selectedProperty === 'validacaoNome') {
        // Salvar validação de nome
        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: 'Validação de Nome',
            prompt: validacaoNomePrompt,
            numMaxMsg: 0,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      } else if (selectedProperty === 'validacaoAgendamento') {
        // Salvar validação de agendamento
        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: 'Validação de Agendamento',
            prompt: validacaoAgendamentoPrompt,
            numMaxMsg: 0,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      } else {
        const nome = selectedProperty === 'base' ? 'Definição Base' : selectedProperty;
        const currentData = automacoes[nome] || { prompt: '', numMaxMsg: 0 };

        const response = await fetch('/api/atendimento-ai', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome,
            prompt: currentData.prompt,
            numMaxMsg: currentData.numMaxMsg,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          // Atualiza o estado local com os dados salvos
          setAutomacoes((prev) => ({
            ...prev,
            [nome]: {
              prompt: result.data.prompt,
              numMaxMsg: result.data.numMaxMsg,
            },
          }));
        } else {
          console.error('Erro ao salvar:', result.error);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPrompt = (): string => {
    if (selectedProperty === 'verificadorResumo') {
      return verificadorResumoPrompt;
    }
    if (selectedProperty === 'validacaoResumoIncorporacao') {
      return validacaoResumoIncorporacaoPrompt;
    }
    if (selectedProperty === 'validacaoUrgencia') {
      return validacaoUrgenciaPrompt;
    }
    if (selectedProperty === 'validacaoNome') {
      return validacaoNomePrompt;
    }
    if (selectedProperty === 'validacaoAgendamento') {
      return validacaoAgendamentoPrompt;
    }
    const nome = selectedProperty === 'base' ? 'Definição Base' : selectedProperty;
    return automacoes[nome]?.prompt || '';
  };

  const setCurrentPrompt = (value: string) => {
    if (selectedProperty === 'verificadorResumo') {
      setVerificadorResumoPrompt(value);
      return;
    }
    if (selectedProperty === 'validacaoResumoIncorporacao') {
      setValidacaoResumoIncorporacaoPrompt(value);
      return;
    }
    if (selectedProperty === 'validacaoUrgencia') {
      setValidacaoUrgenciaPrompt(value);
      return;
    }
    if (selectedProperty === 'validacaoNome') {
      setValidacaoNomePrompt(value);
      return;
    }
    if (selectedProperty === 'validacaoAgendamento') {
      setValidacaoAgendamentoPrompt(value);
      return;
    }
    const nome = selectedProperty === 'base' ? 'Definição Base' : selectedProperty;
    setAutomacoes((prev) => ({
      ...prev,
      [nome]: {
        prompt: value,
        numMaxMsg: prev[nome]?.numMaxMsg || 0,
      },
    }));
  };

  const getCurrentNumMaxMsg = (): number => {
    const nome = selectedProperty === 'base' ? 'Definição Base' : selectedProperty;
    return automacoes[nome]?.numMaxMsg || 0;
  };

  const setCurrentNumMaxMsg = (value: number) => {
    const nome = selectedProperty === 'base' ? 'Definição Base' : selectedProperty;
    setAutomacoes((prev) => ({
      ...prev,
      [nome]: {
        prompt: prev[nome]?.prompt || '',
        numMaxMsg: value,
      },
    }));
  };

  const getCurrentLabel = (): string => {
    if (selectedProperty === 'base') {
      return 'Definição Base';
    }
    if (selectedProperty === 'verificadorResumo') {
      return 'Verificador de Resumo';
    }
    if (selectedProperty === 'validacaoResumoIncorporacao') {
      return 'Validação do Resumo e Incorporação';
    }
    if (selectedProperty === 'validacaoUrgencia') {
      return 'Validação de Urgência';
    }
    if (selectedProperty === 'profissionais') {
      return 'Profissionais';
    }
    return selectedProperty;
  };

  const statusButtons: StatusAutomação[] = ['Novo Contato', 'Triagem em Andamento', 'Validação de Resumo', 'Urgência Não Definida', 'Solicitação de Nome', 'Oferecendo Agendamento', 'Agendamento Aceito', 'Agendamento Não Aceito', 'Atendimento Padrão'];

  const getPropertyColor = (property: SelectedProperty) => {
    if (property === 'base') {
      return 'from-indigo-500 to-indigo-600';
    }
    if (property === 'variaveis') {
      return 'from-teal-500 to-teal-600';
    }
    if (property === 'verificadorResumo') {
      return 'from-cyan-500 to-cyan-600';
    }
    if (property === 'validacaoResumoIncorporacao') {
      return 'from-orange-500 to-orange-600';
    }
    if (property === 'validacaoUrgencia') {
      return 'from-pink-500 to-pink-600';
    }
    if (property === 'validacaoNome') {
      return 'from-rose-500 to-rose-600';
    }
    if (property === 'validacaoAgendamento') {
      return 'from-emerald-500 to-emerald-600';
    }
    if (property === 'profissionais') {
      return 'from-violet-500 to-violet-600';
    }
    const colors: Record<StatusAutomação, string> = {
      'Novo Contato': 'from-blue-500 to-blue-600',
      'Triagem em Andamento': 'from-purple-500 to-purple-600',
      'Validação de Resumo': 'from-green-500 to-green-600',
      'Urgência Não Definida': 'from-orange-500 to-orange-600',
      'Solicitação de Nome': 'from-yellow-500 to-yellow-600',
      'Oferecendo Agendamento': 'from-amber-500 to-amber-600',
      'Agendamento Aceito': 'from-green-500 to-green-600',
      'Agendamento Não Aceito': 'from-red-500 to-red-600',
      'Atendimento Padrão': 'from-slate-500 to-slate-600',
    };
    return colors[property];
  };

  const getPropertyShadow = (property: SelectedProperty) => {
    if (property === 'base') {
      return 'shadow-indigo-500/30';
    }
    if (property === 'variaveis') {
      return 'shadow-teal-500/30';
    }
    if (property === 'verificadorResumo') {
      return 'shadow-cyan-500/30';
    }
    if (property === 'validacaoResumoIncorporacao') {
      return 'shadow-orange-500/30';
    }
    if (property === 'validacaoUrgencia') {
      return 'shadow-pink-500/30';
    }
    if (property === 'validacaoNome') {
      return 'shadow-rose-500/30';
    }
    if (property === 'validacaoAgendamento') {
      return 'shadow-emerald-500/30';
    }
    if (property === 'profissionais') {
      return 'shadow-violet-500/30';
    }
    const shadows: Record<StatusAutomação, string> = {
      'Novo Contato': 'shadow-blue-500/30',
      'Triagem em Andamento': 'shadow-purple-500/30',
      'Validação de Resumo': 'shadow-green-500/30',
      'Urgência Não Definida': 'shadow-orange-500/30',
      'Solicitação de Nome': 'shadow-yellow-500/30',
      'Oferecendo Agendamento': 'shadow-amber-500/30',
      'Agendamento Aceito': 'shadow-green-500/30',
      'Agendamento Não Aceito': 'shadow-red-500/30',
      'Atendimento Padrão': 'shadow-slate-500/30',
    };
    return shadows[property];
  };

  const handleNovoProfissional = () => {
    setEditingProfissional(null);
    setProfissionalForm({
      nome: '',
      areas_atuacao: [],
      mensagem_autoridade: {},
    });
    setNovaArea('');
    setShowProfissionalForm(true);
  };

  const handleEditarProfissional = (profissional: typeof profissionais[0]) => {
    setEditingProfissional(profissional);
    setProfissionalForm({
      nome: profissional.nome,
      areas_atuacao: [...profissional.areas_atuacao],
      mensagem_autoridade: { ...profissional.mensagem_autoridade },
    });
    setNovaArea('');
    setShowProfissionalForm(true);
  };

  const handleAdicionarArea = () => {
    if (novaArea.trim() && !profissionalForm.areas_atuacao.includes(novaArea.trim())) {
      setProfissionalForm((prev) => ({
        ...prev,
        areas_atuacao: [...prev.areas_atuacao, novaArea.trim()],
        mensagem_autoridade: {
          ...prev.mensagem_autoridade,
          [novaArea.trim()]: '',
        },
      }));
      setNovaArea('');
    }
  };

  const handleRemoverArea = (area: string) => {
    setProfissionalForm((prev) => {
      const novasAreas = prev.areas_atuacao.filter((a) => a !== area);
      const novoMensagemAutoridade = { ...prev.mensagem_autoridade };
      delete novoMensagemAutoridade[area];
      return {
        ...prev,
        areas_atuacao: novasAreas,
        mensagem_autoridade: novoMensagemAutoridade,
      };
    });
  };

  const handleSalvarProfissional = async () => {
    if (!profissionalForm.nome.trim()) {
      alert('Nome do profissional é obrigatório');
      return;
    }

    setSavingProfissional(true);

    try {
      const url = editingProfissional
        ? `/api/profissionais/${editingProfissional.id}`
        : '/api/profissionais';
      const method = editingProfissional ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profissionalForm),
      });

      const result = await response.json();

      if (result.success) {
        // Recarrega a lista de profissionais
        const responseList = await fetch('/api/profissionais');
        const resultList = await responseList.json();
        if (resultList.success) {
          setProfissionais(resultList.profissionais);
        }
        setShowProfissionalForm(false);
        setEditingProfissional(null);
        setProfissionalForm({
          nome: '',
          areas_atuacao: [],
          mensagem_autoridade: {},
        });
      } else {
        alert(result.error || 'Erro ao salvar profissional');
      }
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      alert('Erro ao salvar profissional');
    } finally {
      setSavingProfissional(false);
    }
  };

  const handleDeletarProfissional = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este profissional?')) {
      return;
    }

    try {
      const response = await fetch(`/api/profissionais/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Recarrega a lista de profissionais
        const responseList = await fetch('/api/profissionais');
        const resultList = await responseList.json();
        if (resultList.success) {
          setProfissionais(resultList.profissionais);
        }
      } else {
        alert(result.error || 'Erro ao deletar profissional');
      }
    } catch (error) {
      console.error('Erro ao deletar profissional:', error);
      alert('Erro ao deletar profissional');
    }
  };

  const handleSaveVariaveis = async () => {
    setSavingVariaveis(true);
    setSaveVariaveisSuccess(false);

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numMsgHist: variaveis.numMaxMsgHistorico,
          duracaoAgendamento: variaveis.agendamentosLivresHoras,
          pararAtendimento: variaveis.pausarAtendimentoStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveVariaveisSuccess(true);
        setTimeout(() => setSaveVariaveisSuccess(false), 3000);
      } else {
        console.error('Erro ao salvar:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar variáveis:', error);
    } finally {
      setSavingVariaveis(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
              Automações
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 truncate">
              Defina o comportamento do atendente para cada etapa do funil de vendas
            </p>
          </div>

          {/* Layout Principal: Botões à esquerda, Textarea à direita */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Sidebar com Botões */}
             <div className={`${isMobile ? 'w-full' : 'w-full lg:w-64'} flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col`}>
               <div className={`flex flex-col gap-2 min-h-0 pr-1 sm:pr-2 scrollbar-elegant ${isMobile ? '' : 'flex-1 max-h-[calc(100vh-16rem)] overflow-y-auto'}`}>
                {/* Botão Definição Base */}
                <button
                  onClick={() => setSelectedProperty('base')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left ${
                    selectedProperty === 'base'
                      ? `bg-gradient-to-r ${getPropertyColor('base')} text-white shadow-lg ${getPropertyShadow('base')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Definição Base
                </button>

                {/* Separador Prompts de Resposta */}
                <div className="my-1.5 sm:my-2">
                  <div className="h-px bg-slate-300 dark:bg-slate-600 mb-1.5 sm:mb-2"></div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 sm:px-2">
                    Prompts de Resposta
                  </p>
                </div>

                {/* Botões de Status */}
                {statusButtons.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedProperty(status)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                      selectedProperty === status
                        ? `bg-gradient-to-r ${getPropertyColor(status)} text-white shadow-lg ${getPropertyShadow(status)}`
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    title={status}
                  >
                    {status}
                  </button>
                ))}

                {/* Separador Prompts de Validação */}
                <div className="my-1.5 sm:my-2">
                  <div className="h-px bg-slate-300 dark:bg-slate-600 mb-1.5 sm:mb-2"></div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 sm:px-2">
                    Prompts de Validação
                  </p>
                </div>

                {/* Botão Verificador de Resumo */}
                <button
                  onClick={() => setSelectedProperty('verificadorResumo')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'verificadorResumo'
                      ? `bg-gradient-to-r ${getPropertyColor('verificadorResumo')} text-white shadow-lg ${getPropertyShadow('verificadorResumo')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Verificador de Resumo"
                >
                  Verificador de Resumo
                </button>

                {/* Botão Validação do Resumo e Incorporação */}
                <button
                  onClick={() => setSelectedProperty('validacaoResumoIncorporacao')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'validacaoResumoIncorporacao'
                      ? `bg-gradient-to-r ${getPropertyColor('validacaoResumoIncorporacao')} text-white shadow-lg ${getPropertyShadow('validacaoResumoIncorporacao')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Validação do Resumo e Incorporação"
                >
                  Validação do Resumo e Incorporação
                </button>

                {/* Botão Validação de Urgência */}
                <button
                  onClick={() => setSelectedProperty('validacaoUrgencia')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'validacaoUrgencia'
                      ? `bg-gradient-to-r ${getPropertyColor('validacaoUrgencia')} text-white shadow-lg ${getPropertyShadow('validacaoUrgencia')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Validação de Urgência"
                >
                  Validação de Urgência
                </button>

                {/* Botão Validação de Nome */}
                <button
                  onClick={() => setSelectedProperty('validacaoNome')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'validacaoNome'
                      ? `bg-gradient-to-r ${getPropertyColor('validacaoNome')} text-white shadow-lg ${getPropertyShadow('validacaoNome')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Validação de Nome"
                >
                  Validação de Nome
                </button>

                {/* Botão Validação de Agendamento */}
                <button
                  onClick={() => setSelectedProperty('validacaoAgendamento')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'validacaoAgendamento'
                      ? `bg-gradient-to-r ${getPropertyColor('validacaoAgendamento')} text-white shadow-lg ${getPropertyShadow('validacaoAgendamento')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Validação de Agendamento"
                >
                  Validação de Agendamento
                </button>

                {/* Separador Outros */}
                <div className="my-1.5 sm:my-2">
                  <div className="h-px bg-slate-300 dark:bg-slate-600 mb-1.5 sm:mb-2"></div>
                </div>

                {/* Botão Variáveis de Atendimento */}
                <button
                  onClick={() => setSelectedProperty('variaveis')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'variaveis'
                      ? `bg-gradient-to-r ${getPropertyColor('variaveis')} text-white shadow-lg ${getPropertyShadow('variaveis')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Variáveis de Atendimento"
                >
                  Variáveis de Atendimento
                </button>

                {/* Botão Profissionais */}
                <button
                  onClick={() => setSelectedProperty('profissionais')}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 text-left truncate ${
                    selectedProperty === 'profissionais'
                      ? `bg-gradient-to-r ${getPropertyColor('profissionais')} text-white shadow-lg ${getPropertyShadow('profissionais')}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  title="Profissionais"
                >
                  Profissionais
                </button>
              </div>
            </div>

            {/* Área Principal */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 flex flex-col min-w-0">
              {selectedProperty === 'profissionais' ? (
                /* Interface Profissionais */
                <>
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                          Profissionais
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                          Gerencie os profissionais e suas áreas de atuação
                        </p>
                      </div>
                      {!showProfissionalForm && (
                        <button
                          onClick={handleNovoProfissional}
                          className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 transition-all shadow-md hover:shadow-lg w-full sm:w-auto flex-shrink-0"
                        >
                          Novo Profissional
                        </button>
                      )}
                    </div>
                  </div>

                  {showProfissionalForm ? (
                    /* Formulário de Profissional */
                    <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 scrollbar-elegant">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                            Nome <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={profissionalForm.nome}
                            onChange={(e) => setProfissionalForm((prev) => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: Dra. Izabella"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                            Áreas de Atuação
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2 mb-3">
                            <input
                              type="text"
                              value={novaArea}
                              onChange={(e) => setNovaArea(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAdicionarArea();
                                }
                              }}
                              placeholder="Ex: Direito de Família"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            />
                            <button
                              onClick={handleAdicionarArea}
                              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 transition-all w-full sm:w-auto"
                            >
                              Adicionar
                            </button>
                          </div>
                          {profissionalForm.areas_atuacao.length > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                              {profissionalForm.areas_atuacao.map((area) => (
                                <div key={area} className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-white truncate flex-1">{area}</span>
                                    <button
                                      onClick={() => handleRemoverArea(area)}
                                      className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                      Mensagem de Autoridade
                                    </label>
                                    <textarea
                                      value={profissionalForm.mensagem_autoridade[area] || ''}
                                      onChange={(e) =>
                                        setProfissionalForm((prev) => ({
                                          ...prev,
                                          mensagem_autoridade: {
                                            ...prev.mensagem_autoridade,
                                            [area]: e.target.value,
                                          },
                                        }))
                                      }
                                      placeholder={`Ex: A ${profissionalForm.nome || 'profissional'} atua bastante com casos de ${area}.`}
                                      rows={2}
                                      className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => {
                            setShowProfissionalForm(false);
                            setEditingProfissional(null);
                            setProfissionalForm({
                              nome: '',
                              areas_atuacao: [],
                              mensagem_autoridade: {},
                            });
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSalvarProfissional}
                          disabled={savingProfissional || !profissionalForm.nome.trim()}
                          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto ${
                            savingProfissional
                              ? 'bg-slate-400 cursor-wait'
                              : `bg-gradient-to-r ${getPropertyColor('profissionais')} shadow-md hover:shadow-lg`
                          }`}
                        >
                          {savingProfissional ? 'Salvando...' : editingProfissional ? 'Atualizar' : 'Criar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Lista de Profissionais */
                    <div className="flex-1 overflow-y-auto scrollbar-elegant">
                      {loadingProfissionais ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : profissionais.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-slate-500 dark:text-slate-400 mb-4">Nenhum profissional cadastrado</p>
                          <button
                            onClick={handleNovoProfissional}
                            className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 transition-all"
                          >
                            Criar Primeiro Profissional
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {profissionais.map((profissional) => (
                            <div
                              key={profissional.id}
                              className="p-3 sm:p-4 md:p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors min-w-0"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate">
                                    {profissional.nome}
                                  </h3>
                                  {profissional.areas_atuacao.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                      {profissional.areas_atuacao.map((area) => (
                                        <span
                                          key={area}
                                          className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 truncate"
                                          title={area}
                                        >
                                          {area}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleEditarProfissional(profissional)}
                                    className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeletarProfissional(profissional.id)}
                                    className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    Deletar
                                  </button>
                                </div>
                              </div>
                              {Object.keys(profissional.mensagem_autoridade).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                    Mensagens de Autoridade
                                  </p>
                                  <div className="space-y-2">
                                    {Object.entries(profissional.mensagem_autoridade).map(([area, mensagem]) => (
                                      <div key={area} className="text-sm">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{area}:</span>
                                        <span className="text-slate-600 dark:text-slate-400 ml-2">{mensagem}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : selectedProperty === 'variaveis' ? (
                /* Interface Variáveis de Atendimento */
                <>
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                      Variáveis de Prompts
                    </h2>
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto scrollbar-elegant">
                    {/* Histórico de Mensagens */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                          {'{[HISTORICO DE MENSAGENS]}'} Número maximo de mensagens no histórico:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variaveis.numMaxMsgHistorico}
                          onChange={(e) =>
                            setVariaveis((prev) => ({
                              ...prev,
                              numMaxMsgHistorico: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full sm:w-24 px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex-shrink-0"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-0 sm:pl-2">
                        Variável que contém o histórico completo das mensagens trocadas entre o cliente e o atendente. O histórico é ordenado cronologicamente, com as mensagens mais antigas primeiro.
                      </p>
                    </div>

                    {/* Datas Disponíveis */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                          {'{[DATAS DISPONÍVEIS]}'} Agendamentos livres em (horas):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variaveis.agendamentosLivresHoras}
                          onChange={(e) =>
                            setVariaveis((prev) => ({
                              ...prev,
                              agendamentosLivresHoras: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full sm:w-24 px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex-shrink-0"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-0 sm:pl-2">
                        Variável que contém as datas e horários disponíveis para agendamento, considerando o período especificado em horas a partir do momento atual.
                      </p>
                    </div>

                    {/* Produto de Interesse */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[PRODUTO DE INTERESSE]}'} Variável que contém o produto que o cliente esta abordando na conversa. Todos os dados deste produto são informados.
                      </p>
                    </div>

                    {/* Última Mensagem */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[ULTIMA MENSAGEM]}'} Variável que contém a última mensagem enviada pelo cliente na conversa atual.
                      </p>
                    </div>

                    {/* Horários Disponíveis */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[HORARIOS DISPONIVEIS]}'} Variável que contém a lista dos próximos horários disponíveis para agendamento, formatados como DD/MM/YYYY HH:MM.
                      </p>
                    </div>

                    {/* Primeiro Horário Disponível */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[PRIMEIRO HORARIO DISPONIVEL]}'} Variável que contém apenas o primeiro horário disponível para agendamento, formatado como DD/MM/YYYY HH:MM.
                      </p>
                    </div>

                    {/* Primeiro Nome */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[PRIMEIRO NOME]}'} Variável que contém apenas o primeiro nome do cliente, extraído da primeira palavra da propriedade nomeCompleto do contato.
                      </p>
                    </div>

                    {/* Resumo do Caso */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[RESUMO CASO]}'} Variável que contém o resumo do caso do contato, armazenado na propriedade resumoCaso. Se o resumo ainda não foi preenchido, a variável será substituída por uma string vazia.
                      </p>
                    </div>

                    {/* Informações do Caso */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[INFORMAÇÕES DO CASO]}'} Variável que contém as informações do caso do contato, armazenado na propriedade informacoesCaso. Se as informações ainda não foram preenchidas, a variável será substituída por uma string vazia.
                      </p>
                    </div>

                    {/* Prompt Base */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        {'{[PROMPT BASE]}'} Variável que contém o prompt base definido na "Definição Base" da coleção atendimento-ai. Este prompt define o comportamento base do assistente em todas as interações.
                      </p>
                    </div>


                    {/* Pausar Atendimento Autônomo */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                          Pausar atendimento autônomo por status:
                        </label>
                        <select
                          value={variaveis.pausarAtendimentoStatus}
                          onChange={(e) =>
                            setVariaveis((prev) => ({
                              ...prev,
                              pausarAtendimentoStatus: e.target.value as VariaveisAtendimento['pausarAtendimentoStatus'],
                            }))
                          }
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer text-xs sm:text-sm flex-shrink-0"
                        >
                          <option value="Nenhum">Nenhum</option>
                          <option value="Novo Contato">Novo Contato</option>
                          <option value="Triagem em Andamento">Triagem em Andamento</option>
                          <option value="Validação de Resumo">Validação de Resumo</option>
                          <option value="Urgência Não Definida">Urgência Não Definida</option>
                          <option value="Solicitação de Nome">Solicitação de Nome</option>
                          <option value="Oferecendo Agendamento">Oferecendo Agendamento</option>
                          <option value="Agendamento Aceito">Agendamento Aceito</option>
                          <option value="Agendamento Não Aceito">Agendamento Não Aceito</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Botão Salvar Variáveis */}
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {saveVariaveisSuccess && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-left-4">
                          <HiOutlineCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Salvo com sucesso!</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSaveVariaveis}
                      disabled={savingVariaveis}
                      className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto ${
                        savingVariaveis
                          ? 'bg-slate-400 cursor-wait'
                          : `bg-gradient-to-r ${getPropertyColor('variaveis')} shadow-md hover:shadow-lg`
                      }`}
                    >
                      {savingVariaveis ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </>
              ) : (
                /* Interface Normal (Textarea e Inputs) */
                <>
                  <div className="mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                      {getCurrentLabel()}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {selectedProperty === 'base'
                        ? 'Defina o comportamento base que o assistente deve seguir em todas as interações'
                        : selectedProperty === 'verificadorResumo'
                        ? 'Defina o prompt que será usado para verificar e gerar o resumo do caso'
                        : selectedProperty === 'validacaoResumoIncorporacao'
                        ? 'Defina o prompt que será usado para validar o resumo e incorporá-lo ao caso'
                        : selectedProperty === 'validacaoUrgencia'
                        ? 'Defina o prompt que será usado para validar a urgência do caso'
                        : `Defina como o atendente deve se comportar quando o atendimento atingir o estágio ${selectedProperty}`}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col mb-3 sm:mb-4 min-h-0">
                    <TextareaComVariaveis
                      value={getCurrentPrompt()}
                      onChange={setCurrentPrompt}
                      placeholder={
                        selectedProperty === 'base'
                          ? 'Digite o comportamento base que o assistente deve seguir em todas as interações...'
                          : selectedProperty === 'verificadorResumo'
                          ? 'Digite o prompt que será usado para verificar e gerar o resumo do caso...'
                          : selectedProperty === 'validacaoResumoIncorporacao'
                          ? 'Digite o prompt que será usado para validar o resumo e incorporá-lo ao caso...'
                          : selectedProperty === 'validacaoUrgencia'
                          ? 'Digite o prompt que será usado para validar a urgência do caso...'
                          : `Digite como o atendente deve se comportar no estágio ${selectedProperty}...`
                      }
                      className="w-full h-full"
                      numMsgHist={config.numMsgHist}
                      duracaoAgendamento={config.duracaoAgendamento}
                    />
                  </div>

                  {/* Input Número Máximo de Mensagens - Oculto para Prompts de Validação */}
                  {selectedProperty !== 'verificadorResumo' && selectedProperty !== 'validacaoResumoIncorporacao' && selectedProperty !== 'validacaoUrgencia' && (
                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                        Número máximo de mensagens com esse status:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={getCurrentNumMaxMsg()}
                        onChange={(e) => setCurrentNumMaxMsg(parseInt(e.target.value) || 0)}
                        className="w-full sm:w-24 px-3 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex-shrink-0"
                      />
                    </div>
                  )}

                  {/* Botão Salvar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-left-4">
                          <HiOutlineCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Salvo com sucesso!</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto ${
                        saving
                          ? 'bg-slate-400 cursor-wait'
                          : `bg-gradient-to-r ${getPropertyColor(selectedProperty)} shadow-md hover:shadow-lg`
                      }`}
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

