'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  HiOutlineMegaphone,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineGlobeAlt,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineLink,
  HiOutlinePlus,
  HiChevronDown,
  HiChevronRight,
  HiOutlinePencil,
} from 'react-icons/hi2';
import { X } from 'lucide-react';
import GoogleAdsDashboard from '@/components/GoogleAdsDashboard';
import CampaignsTable from '@/components/CampaignsTable';
import CampaignInsights from '@/components/CampaignInsights';
import SearchTermsTable from '@/components/SearchTermsTable';

export default function GoogleAdsPage() {
  const { isOpen, isMobile } = useSidebar();

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'create' | 'campaigns'>('create');

  // Estados para campanhas agrupadas
  const [groupedCampaigns, setGroupedCampaigns] = useState<Record<string, Array<{
    id: string;
    name: string;
    status: string;
    details?: {
      id: string;
      name: string;
      status: string;
      startDate?: string;
      endDate?: string;
      dailyBudget?: string;
      manualCpc?: string;
      adGroupName?: string;
      adGroupCpc?: string;
      keywords?: Array<{ keyword: string; matchType: string }>;
      adTitles?: string[];
      adDescriptions?: string[];
      finalUrl?: string;
    } | null;
  }>>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true); // Inicia como true para mostrar loading imediatamente
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  
  // Estado para edição de campanha
  const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    name: string;
    status: string;
    dailyBudget?: string;
    manualCpc?: string;
    startDate?: string;
    endDate?: string;
    keywords?: Array<{ keyword: string; matchType: string }>;
    adTitles?: string[];
    adDescriptions?: string[];
    finalUrl?: string;
    adGroupName?: string;
    adGroupCpc?: string;
  } | null>(null);
  const [isLoadingCampaignDetails, setIsLoadingCampaignDetails] = useState(false);
  
  // Estado para dados das campanhas com métricas (para o dashboard)
  const [campaignsData, setCampaignsData] = useState<Array<{
    campaign?: {
      id?: string;
      name?: string;
      status?: string;
    };
    metrics?: {
      costMicros?: number;
      conversions?: number;
      costPerConversion?: number;
      ctr?: number;
    };
  }>>([]);
  
  // Estado para termos de pesquisa
  const [searchTermsData, setSearchTermsData] = useState<Array<{
    searchTerm?: string;
    clicks?: number;
    conversions?: number;
    costMicros?: number;
  }>>([]);

  // Estados do formulário
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('SEARCH'); // Disabled for Google Ads API Standard Access compliance - Only SEARCH allowed
  const [status, setStatus] = useState('ENABLED');
  const [dailyBudget, setDailyBudget] = useState('');
  // Disabled for Google Ads API Standard Access compliance - budgetStrategy removed (only standard budget allowed)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Disabled for Google Ads API Standard Access compliance - Only Google Search network allowed for Search campaigns
  const [searchNetwork] = useState(true); // Always true, not editable
  // const [displayNetwork, setDisplayNetwork] = useState(false); // Disabled for Google Ads API Standard Access compliance
  // const [googleSearchPartners, setGoogleSearchPartners] = useState(true); // Disabled for Google Ads API Standard Access compliance
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [biddingStrategy, setBiddingStrategy] = useState('MANUAL_CPC'); // Disabled for Google Ads API Standard Access compliance - Only MANUAL_CPC allowed
  const [manualCpc, setManualCpc] = useState('');
  const [adGroupSelect, setAdGroupSelect] = useState<string>(''); // 'none', 'custom', ou nome do grupo existente
  const [adGroupName, setAdGroupName] = useState('');
  const [adGroupCpc, setAdGroupCpc] = useState('');
  const [keywords, setKeywords] = useState<Array<{ keyword: string; matchType: string }>>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordMatchType, setNewKeywordMatchType] = useState('BROAD');
  // Responsive Search Ad requer pelo menos 3 headlines e 2 descriptions
  const [adTitles, setAdTitles] = useState<string[]>(['', '', '']);
  const [adDescriptions, setAdDescriptions] = useState<string[]>(['', '']);
  const [finalUrl, setFinalUrl] = useState('');
  const [displayPath, setDisplayPath] = useState('');

  // Estados para validação e mensagens de erro
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados para feedback e loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  const fetchGroupedCampaigns = async () => {
    console.log('📡 fetchGroupedCampaigns chamado');
    setIsLoadingCampaigns(true);
    setCampaignsError(null);

    try {
      console.log('🌐 Fazendo requisição para /api/google-ads/campaigns/grouped');
      const response = await fetch('/api/google-ads/campaigns/grouped');
      const result = await response.json();
      console.log('📥 Resposta recebida:', { ok: response.ok, success: result.success });

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar campanhas');
      }

      console.log('✅ Dados recebidos, processando...');
      setGroupedCampaigns(result.data || {});
      
      // Prepara dados para o dashboard (extrai todas as campanhas dos grupos)
      // Filtra campanhas removidas - não devem aparecer em nenhum componente
      const allCampaigns: Array<{
        campaign?: {
          id?: string;
          name?: string;
          status?: string;
        };
        metrics?: {
          costMicros?: number;
          conversions?: number;
          costPerConversion?: number;
          ctr?: number;
        };
      }> = [];
      
        (Object.values(result.data || {}) as any[]).forEach((campaigns: any[]) => {
        campaigns.forEach((campaign: any) => {
          // Ignora campanhas removidas
          if (campaign.status === 'REMOVED') {
            return;
          }
          
          // Extrai dados da campanha e métricas
          allCampaigns.push({
            campaign: {
              id: campaign.id?.toString() || '',
              name: campaign.name || 'Sem nome',
              status: campaign.status || 'UNKNOWN',
            },
            metrics: {
              costMicros: 0, // Será preenchido quando buscarmos métricas
              conversions: 0,
              costPerConversion: 0,
              ctr: 0,
            },
          });
        });
      });
      
      setCampaignsData(allCampaigns);
      console.log(`✅ ${allCampaigns.length} campanha(s) processada(s) para o dashboard`);
      
      // Dados mock para termos de pesquisa (conta de teste)
      const mockSearchTerms = [
        {
          searchTerm: 'advogado especialista em divorcio',
          clicks: 50,
          conversions: 5,
          costMicros: 150000000, // R$ 150,00
        },
        {
          searchTerm: 'advogado divorcio gratuito',
          clicks: 30,
          conversions: 0,
          costMicros: 80000000, // R$ 80,00
        },
        {
          searchTerm: 'modelo de petição inventario pdf',
          clicks: 15,
          conversions: 0,
          costMicros: 45000000, // R$ 45,00
        },
        {
          searchTerm: 'consulta advogado empresarial',
          clicks: 10,
          conversions: 2,
          costMicros: 200000000, // R$ 200,00
        },
      ];
      
      setSearchTermsData(mockSearchTerms);
      console.log('✅ Dados de campanhas carregados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao buscar campanhas:', error);
      setCampaignsError(error.message || 'Erro ao carregar campanhas');
    } finally {
      setIsLoadingCampaigns(false);
      console.log('🏁 fetchGroupedCampaigns finalizado');
    }
  };

  // Busca campanhas agrupadas assim que a página carrega
  useEffect(() => {
    console.log('🚀 useEffect executado - Página Google Ads carregada, iniciando busca de campanhas...');
    fetchGroupedCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez quando o componente monta

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'REMOVED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'Ativa';
      case 'PAUSED':
        return 'Pausada';
      case 'REMOVED':
        return 'Removida';
      default:
        return status;
    }
  };

  const addLocation = () => {
    if (selectedLocation && !locations.includes(selectedLocation)) {
      setLocations([...locations, selectedLocation]);
      setSelectedLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter((l) => l !== location));
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setKeywords([...keywords, { keyword: newKeyword.trim(), matchType: newKeywordMatchType }]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const addAdTitle = () => {
    if (adTitles.length < 15) {
      // Responsive Search Ad permite até 15 headlines
      setAdTitles([...adTitles, '']);
    }
  };

  const removeAdTitle = (index: number) => {
    // Responsive Search Ad requer pelo menos 3 títulos
    if (adTitles.length > 3) {
      setAdTitles(adTitles.filter((_, i) => i !== index));
    }
  };

  const addAdDescription = () => {
    if (adDescriptions.length < 4) {
      // Responsive Search Ad permite até 4 descriptions
      setAdDescriptions([...adDescriptions, '']);
    }
  };

  const removeAdDescription = (index: number) => {
    // Responsive Search Ad requer pelo menos 2 descrições
    if (adDescriptions.length > 2) {
      setAdDescriptions(adDescriptions.filter((_, i) => i !== index));
    }
  };

  // Validação do formulário - Disabled for Google Ads API Standard Access compliance
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validação: Orçamento mínimo > 0
    const budgetValue = parseFloat(dailyBudget);
    if (!dailyBudget || isNaN(budgetValue) || budgetValue <= 0) {
      newErrors.dailyBudget = 'O orçamento diário deve ser maior que zero';
    }

    // Validação: Pelo menos 1 palavra-chave
    if (keywords.length === 0) {
      newErrors.keywords = 'Adicione pelo menos uma palavra-chave';
    }

    // Validação: Responsive Search Ad requer pelo menos 3 títulos e 2 descrições
    const validTitles = adTitles.filter((t) => t.trim().length > 0);
    const validDescriptions = adDescriptions.filter((d) => d.trim().length > 0);
    if (validTitles.length < 3) {
      newErrors.adTitles = 'Responsive Search Ad requer pelo menos 3 títulos válidos';
    }
    if (validDescriptions.length < 2) {
      newErrors.adDescriptions = 'Responsive Search Ad requer pelo menos 2 descrições válidas';
    }

    // Validação: CPC Manual obrigatório quando estratégia é MANUAL_CPC
    if (biddingStrategy === 'MANUAL_CPC') {
      const cpcValue = parseFloat(manualCpc);
      if (!manualCpc || isNaN(cpcValue) || cpcValue <= 0) {
        newErrors.manualCpc = 'O CPC manual deve ser maior que zero';
      }
    }

    // Validação: Localização obrigatória
    if (locations.length === 0) {
      newErrors.locations = 'Adicione pelo menos uma localização';
    }

    // Validação: Grupo de anúncios obrigatório
    if (!adGroupSelect || adGroupSelect === '') {
      newErrors.adGroupSelect = 'Selecione um grupo de anúncios';
    } else if (adGroupSelect === 'custom' && (!adGroupName || adGroupName.trim() === '')) {
      newErrors.adGroupName = 'Digite o nome do novo grupo de anúncios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitMessage(null);
    setIsSubmitting(true);

    const isValid = validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      // Scroll para o primeiro erro após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        // Busca o primeiro campo com erro baseado nos data-field attributes
        const errorFields = ['dailyBudget', 'keywords', 'adTitles', 'adDescriptions', 'manualCpc', 'locations'];
        for (const field of errorFields) {
          const element = document.querySelector(`[data-field="${field}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }, 100);
      return;
    }

    try {
      // Prepara os dados para envio
      // Converte valores monetários para micros (1 real = 1.000.000 micros)
      // O usuário digita em reais, então: valorEmReais * 1.000.000 = valorEmMicros
      const dailyBudgetInMicros = Math.round(parseFloat(dailyBudget) * 1000000);
      const manualCpcInMicros = Math.round(parseFloat(manualCpc) * 1000000);
      const adGroupCpcInMicros = adGroupCpc ? Math.round(parseFloat(adGroupCpc) * 1000000) : undefined;

      // Determina o nome do grupo baseado na seleção
      let finalAdGroupName = '';
      if (adGroupSelect === 'none') {
        finalAdGroupName = ''; // Nenhum grupo
      } else if (adGroupSelect === 'custom') {
        finalAdGroupName = adGroupName.trim(); // Nome personalizado
      } else if (adGroupSelect && adGroupSelect !== '') {
        finalAdGroupName = adGroupSelect; // Grupo existente selecionado
      }

      const campaignData = {
        campaignName,
        status,
        dailyBudget: dailyBudgetInMicros,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        locations,
        language,
        manualCpc: manualCpcInMicros,
        adGroupName: finalAdGroupName,
        ...(adGroupCpcInMicros && { adGroupCpc: adGroupCpcInMicros }),
        keywords,
        adTitles: adTitles.filter((t) => t.trim().length > 0),
        adDescriptions: adDescriptions.filter((d) => d.trim().length > 0),
        finalUrl,
        ...(displayPath && { displayPath }),
      };

      console.log('🚀 Enviando campanha para o Google Ads...', campaignData);

      // Envia para a API
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar campanha');
      }

      // Sucesso!
      setSubmitMessage({
        type: 'success',
        message: `Campanha "${campaignName}" criada com sucesso no Google Ads! ID: ${result.campaignId}`,
      });

      // Limpa o formulário após sucesso
      setTimeout(() => {
        setCampaignName('');
        setDailyBudget('');
        setStartDate('');
        setEndDate('');
        setLocations([]);
        setManualCpc('');
        setAdGroupSelect('');
        setAdGroupName('');
        setAdGroupCpc('');
        setKeywords([]);
        setAdTitles(['']);
        setAdDescriptions(['']);
        setFinalUrl('');
        setDisplayPath('');
        setSubmitMessage(null);
      }, 5000);
    } catch (error) {
      console.error('❌ Erro ao criar campanha:', error);
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido ao criar campanha',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden relative">
      <Sidebar />
      
      {/* Loading Overlay Global - Aparece enquanto carrega os dados */}
      {isLoadingCampaigns && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Spinner Elegante */}
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 dark:border-slate-700"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              
              {/* Texto */}
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  Carregando suas campanhas
                </h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  Buscando informações e detalhes do Google Ads...
                </p>
              </div>
              
              {/* Barra de progresso animada */}
              <div className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
              Google ADS
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 truncate">
              Crie e gerencie suas campanhas do Google Ads
            </p>
          </div>

          {/* Abas */}
          <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-1" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('create')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${
                    activeTab === 'create'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                Criar Campanha
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${
                    activeTab === 'campaigns'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                Minhas Campanhas
              </button>
            </nav>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Seção 1: Informações Básicas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineMegaphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Informações Básicas
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Nome da Campanha */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Nome da Campanha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ex: Campanha de Verão 2024"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Tipo de Campanha */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Tipo de Campanha <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled
                  >
                    <option value="SEARCH">Pesquisa (Search)</option>
                    {/* Disabled for Google Ads API Standard Access compliance
                    <option value="DISPLAY">Display</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="VIDEO">Vídeo</option>
                    <option value="PERFORMANCE_MAX">Performance Max</option>
                    */}
                  </select>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Apenas campanhas de Pesquisa (Search) estão disponíveis
                  </p>
                </div>

                {/* Status */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('ENABLED')}
                      className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                        status === 'ENABLED'
                          ? 'bg-green-500 text-white shadow-md scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      Ativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('PAUSED')}
                      className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                        status === 'PAUSED'
                          ? 'bg-yellow-500 text-white shadow-md scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      Pausada
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Orçamento */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineCurrencyDollar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">Orçamento</h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Orçamento Diário */}
                <div data-field="dailyBudget" className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Orçamento Diário (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={dailyBudget}
                      onChange={(e) => {
                        setDailyBudget(e.target.value);
                        if (errors.dailyBudget) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.dailyBudget;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.dailyBudget
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      required
                    />
                  </div>
                  {errors.dailyBudget && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.dailyBudget}</p>
                  )}
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    O orçamento mínimo é R$ 0,01
                  </p>
                </div>

                {/* Estratégia de Orçamento - Disabled for Google Ads API Standard Access compliance */}
                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Estratégia de Orçamento
                  </label>
                  <select
                    value={budgetStrategy}
                    onChange={(e) => setBudgetStrategy(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="STANDARD">Padrão</option>
                    <option value="MAXIMIZE_CONVERSIONS">Maximizar Conversões</option>
                    <option value="MAXIMIZE_CONVERSION_VALUE">Maximizar Valor de Conversão</option>
                  </select>
                </div> */}
              </div>
            </div>

            {/* Seção 3: Datas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">Datas</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Data de Início */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Data de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Data de Fim */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Data de Fim (Opcional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Seção 4: Redes de Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineGlobeAlt className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Redes de Anúncios
                </h2>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="flex items-center gap-2 sm:gap-3 cursor-not-allowed opacity-75">
                  <input
                    type="checkbox"
                    checked={searchNetwork}
                    disabled
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Google Search
                  </span>
                </label>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Para campanhas de Pesquisa, apenas a rede Google Search está disponível
                </p>

                {/* Disabled for Google Ads API Standard Access compliance
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displayNetwork}
                    onChange={(e) => setDisplayNetwork(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Display Network
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={googleSearchPartners}
                    onChange={(e) => setGoogleSearchPartners(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Google Search Partners
                  </span>
                </label>
                */}
              </div>
            </div>

            {/* Seção 5: Localização e Idioma */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineGlobeAlt className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Localização e Idioma
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Localizações */}
                <div data-field="locations" className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Localizações <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-0"
                    >
                      <option value="">Selecione uma localização</option>
                      <option value="1007559">Matinhos - PR</option>
                    </select>
                    <button
                      type="button"
                      onClick={addLocation}
                      disabled={!selectedLocation}
                      className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-xl text-xs sm:text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                  {errors.locations && (
                    <p className="mb-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.locations}</p>
                  )}
                  {locations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {locations.map((locationCode, index) => {
                        // Mapeia o código para o nome exibido
                        const locationName = locationCode === '1007559' ? 'Matinhos - PR' : locationCode;
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs sm:text-sm font-medium"
                          >
                            <span className="truncate max-w-[150px] sm:max-w-none">{locationName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                removeLocation(locationCode);
                                if (errors.locations && locations.length === 1) {
                                  setErrors((prev) => {
                                    const newErrors = { ...prev };
                                    delete newErrors.locations;
                                    return newErrors;
                                  });
                                }
                              }}
                              className="hover:text-blue-600 dark:hover:text-blue-200 flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Idioma */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Idioma <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="en-US">English (United States)</option>
                    <option value="es-ES">Español (España)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 6: Estratégia de Lances */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineTag className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Estratégia de Lances
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Tipo de Lance - Disabled for Google Ads API Standard Access compliance */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Tipo de Lance <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={biddingStrategy}
                    onChange={(e) => setBiddingStrategy(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled
                  >
                    <option value="MANUAL_CPC">CPC Manual</option>
                    {/* Disabled for Google Ads API Standard Access compliance
                    <option value="MAXIMIZE_CLICKS">Maximizar Cliques</option>
                    <option value="MAXIMIZE_CONVERSIONS">Maximizar Conversões</option>
                    <option value="TARGET_CPA">CPC Máximo</option>
                    */}
                  </select>
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Apenas CPC Manual está disponível
                  </p>
                </div>

                {/* CPC Manual */}
                <div data-field="manualCpc" className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    CPC Manual (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={manualCpc}
                      onChange={(e) => {
                        setManualCpc(e.target.value);
                        if (errors.manualCpc) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.manualCpc;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.manualCpc
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      required
                    />
                  </div>
                  {errors.manualCpc && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.manualCpc}</p>
                  )}
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    O CPC mínimo é R$ 0,01
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 7: Grupo de Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineDocumentText className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Grupo de Anúncios
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Select do Grupo */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Grupo de Anúncios <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adGroupSelect}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAdGroupSelect(value);
                      
                      // Limpa erros ao mudar a seleção
                      if (errors.adGroupSelect) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.adGroupSelect;
                          return newErrors;
                        });
                      }
                      
                      if (value === 'none') {
                        setAdGroupName('');
                      } else if (value === 'custom') {
                        setAdGroupName('');
                      } else {
                        // É um grupo existente
                        setAdGroupName(value);
                      }
                    }}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                      errors.adGroupSelect
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    required
                  >
                    <option value="">Selecione um grupo...</option>
                    <option value="none">Nenhum</option>
                    <option value="custom">Personalizado</option>
                    {Object.keys(groupedCampaigns).length > 0 && (
                      <>
                        {Object.keys(groupedCampaigns).map((groupName) => (
                          <option key={groupName} value={groupName}>
                            {groupName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.adGroupSelect && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.adGroupSelect}</p>
                  )}
                </div>

                {/* Input de Nome Personalizado - Aparece apenas quando 'Personalizado' é selecionado */}
                {adGroupSelect === 'custom' && (
                  <div className="min-w-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                      Nome do Novo Grupo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={adGroupName}
                      onChange={(e) => {
                        setAdGroupName(e.target.value);
                        // Limpa erro ao digitar
                        if (errors.adGroupName) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.adGroupName;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Ex: Grupo 1 - Palavras-chave principais"
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.adGroupName
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      required={adGroupSelect === 'custom'}
                    />
                    {errors.adGroupName && (
                      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.adGroupName}</p>
                    )}
                  </div>
                )}

                {/* CPC do Grupo */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    CPC do Grupo (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={adGroupCpc}
                      onChange={(e) => setAdGroupCpc(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 8: Palavras-chave (apenas para campanhas de pesquisa) */}
            {/* Disabled for Google Ads API Standard Access compliance - Only shown for SEARCH campaigns */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineTag className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Palavras-chave <span className="text-red-500">*</span>
                </h2>
              </div>

              <div className="space-y-4 sm:space-y-5" data-field="keywords">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Digite a palavra-chave manualmente"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-0"
                  />
                  <select
                    value={newKeywordMatchType}
                    onChange={(e) => setNewKeywordMatchType(e.target.value)}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full sm:w-auto flex-shrink-0"
                  >
                    <option value="BROAD">Ampla</option>
                    <option value="PHRASE">Frase</option>
                    <option value="EXACT">Exata</option>
                  </select>
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-xl text-xs sm:text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0"
                  >
                    <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Adicionar</span>
                  </button>
                </div>
                {errors.keywords && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.keywords}</p>
                )}

                {keywords.length > 0 && (
                  <div className="space-y-2">
                    {keywords.map((kw, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg min-w-0"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                            {kw.keyword}
                          </span>
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 whitespace-nowrap">
                            {kw.matchType === 'BROAD'
                              ? 'Ampla'
                              : kw.matchType === 'PHRASE'
                              ? 'Frase'
                              : 'Exata'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeKeyword(index);
                            if (errors.keywords && keywords.length === 1) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.keywords;
                                return newErrors;
                              });
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Adicione palavras-chave manualmente. Sugestões automáticas não estão disponíveis.
                </p>
              </div>
            </div>

            {/* Seção 9: Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <HiOutlineDocumentText className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">Anúncios</h2>
              </div>

              <div className="space-y-4 sm:space-y-5">
                {/* Títulos */}
                <div data-field="adTitles" className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Títulos (máximo 3) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {adTitles.map((title, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => {
                            const newTitles = [...adTitles];
                            newTitles[index] = e.target.value;
                            setAdTitles(newTitles);
                            if (errors.adTitles && newTitles.some((t) => t.trim().length > 0)) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.adTitles;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder={`Título ${index + 1} (máximo 30 caracteres)`}
                          maxLength={30}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all min-w-0 ${
                            errors.adTitles && index === 0
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                          }`}
                          required
                        />
                        {adTitles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAdTitle(index)}
                            className="px-2 sm:px-3 py-2 sm:py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {adTitles.length < 15 && (
                      <button
                        type="button"
                        onClick={addAdTitle}
                        className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                      >
                        <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Adicionar Título ({adTitles.length}/15)
                      </button>
                    )}
                  </div>
                  {errors.adTitles && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.adTitles}</p>
                  )}
                </div>

                {/* Descrições */}
                <div data-field="adDescriptions" className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Descrições (máximo 2) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {adDescriptions.map((description, index) => (
                      <div key={index} className="flex gap-2">
                        <textarea
                          value={description}
                          onChange={(e) => {
                            const newDescriptions = [...adDescriptions];
                            newDescriptions[index] = e.target.value;
                            setAdDescriptions(newDescriptions);
                            if (
                              errors.adDescriptions &&
                              newDescriptions.some((d) => d.trim().length > 0)
                            ) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.adDescriptions;
                                return newErrors;
                              });
                            }
                          }}
                          placeholder={`Descrição ${index + 1} (máximo 90 caracteres)`}
                          maxLength={90}
                          rows={2}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none min-w-0 ${
                            errors.adDescriptions && index === 0
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                          }`}
                          required
                        />
                        {adDescriptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAdDescription(index)}
                            className="px-2 sm:px-3 py-2 sm:py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {adDescriptions.length < 4 && (
                      <button
                        type="button"
                        onClick={addAdDescription}
                        className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                      >
                        <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Adicionar Descrição ({adDescriptions.length}/4)
                      </button>
                    )}
                  </div>
                  {errors.adDescriptions && (
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
                      {errors.adDescriptions}
                    </p>
                  )}
                </div>

                {/* URL Final */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    URL Final <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <HiOutlineLink className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input
                      type="url"
                      value={finalUrl}
                      onChange={(e) => setFinalUrl(e.target.value)}
                      placeholder="https://exemplo.com.br"
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-w-0"
                      required
                    />
                  </div>
                </div>

                {/* Caminho de Exibição */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                    Caminho de Exibição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={displayPath}
                    onChange={(e) => setDisplayPath(e.target.value)}
                    placeholder="Ex: produtos/oferta"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Mensagem de Feedback */}
            {submitMessage && (
              <div
                className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl ${
                  submitMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    submitMessage.type === 'success'
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}
                >
                  {submitMessage.message}
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
              <button
                type="button"
                className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineMegaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Criar Campanha</span>
                  </>
                )}
              </button>
            </div>
          </form>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-1">
                      Minhas Campanhas
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Gerencie as campanhas criadas
                    </p>
                  </div>
                  <button
                    onClick={fetchGroupedCampaigns}
                    disabled={isLoadingCampaigns}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingCampaigns ? 'Atualizando...' : 'Atualizar'}
                  </button>
                </div>
              </div>

              {/* Painel de Controle - Só mostra quando não está carregando e há dados */}
              {!isLoadingCampaigns && campaignsData.length > 0 && (
                <>
                  <GoogleAdsDashboard campaignsData={campaignsData} />
                  <CampaignsTable campaignsData={campaignsData} />
                  <CampaignInsights campaignsData={campaignsData} />
                </>
              )}

              {/* Termos de Pesquisa - Só mostra quando não está carregando e há dados */}
              {!isLoadingCampaigns && searchTermsData.length > 0 && (
                <SearchTermsTable searchTermsData={searchTermsData} />
              )}

              {/* Lista de Grupos */}
              {isLoadingCampaigns ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 sm:p-16 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                        Carregando suas campanhas
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Buscando informações e detalhes...
                      </p>
                    </div>
                  </div>
                </div>
              ) : campaignsError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-800 dark:text-red-200">{campaignsError}</p>
                </div>
              ) : Object.keys(groupedCampaigns).length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex flex-col items-center justify-center py-8">
                    <HiOutlineMegaphone className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nenhuma campanha encontrada
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 text-center max-w-md">
                      Crie sua primeira campanha na aba "Criar Campanha"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedCampaigns).map(([groupName, campaigns], groupIndex) => {
                    const isExpanded = expandedGroups.has(groupName);
                    // Garante chave única para cada grupo
                    const groupKey = `group-${groupName}-${groupIndex}`;
                    return (
                      <div
                        key={groupKey}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                      >
                        {/* Cabeçalho do Grupo (Acordeon) */}
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isExpanded ? (
                              <HiChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            ) : (
                              <HiChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                            )}
                            <HiOutlineMegaphone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                                {groupName}
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Conteúdo do Grupo (Expandido) */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 dark:border-slate-700">
                            <div className="p-4 sm:p-6 space-y-3">
                              {campaigns.map((campaign, index) => (
                                <div
                                  key={campaign.id || `campaign-${index}-${campaign.name || 'unnamed'}`}
                                  className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white truncate mb-1">
                                      {campaign.name}
                                    </h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      ID: {campaign.id}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        // Verifica se os detalhes já estão carregados
                                        const campaignWithDetails = campaign as any;
                                        const details = campaignWithDetails.details;

                                        if (details) {
                                          // Usa os detalhes já carregados (sem fazer nova requisição)
                                          console.log('✅ Usando detalhes já carregados da campanha');
                                          setEditingCampaign({
                                            id: campaign.id,
                                            name: details.name || campaign.name || '',
                                            status: details.status || campaign.status || 'ENABLED',
                                            dailyBudget: details.dailyBudget || '',
                                            manualCpc: details.manualCpc || '',
                                            startDate: details.startDate || '',
                                            endDate: details.endDate || '',
                                            keywords: Array.isArray(details.keywords) && details.keywords.length > 0
                                              ? details.keywords.map((k: any) => ({
                                                  keyword: k.keyword || '',
                                                  matchType: k.matchType || 'BROAD',
                                                }))
                                              : [],
                                            adTitles: Array.isArray(details.adTitles) && details.adTitles.length > 0
                                              ? details.adTitles.filter((h: string) => h && h.trim())
                                              : ['', '', ''],
                                            adDescriptions: Array.isArray(details.adDescriptions) && details.adDescriptions.length > 0
                                              ? details.adDescriptions.filter((d: string) => d && d.trim())
                                              : ['', ''],
                                            finalUrl: details.finalUrl || '',
                                            adGroupName: details.adGroupName || '',
                                            adGroupCpc: details.adGroupCpc || '',
                                          });
                                        } else {
                                          // Se não tiver detalhes, busca agora (fallback)
                                          console.log('⚠️ Detalhes não encontrados, buscando agora...');
                                          setIsLoadingCampaignDetails(true);
                                          
                                          fetch(`/api/google-ads/campaigns/${campaign.id}`)
                                            .then(res => res.json())
                                            .then(result => {
                                              if (result.success && result.data) {
                                                const data = result.data;
                                                const formatDate = (dateStr: string | undefined | null): string => {
                                                  if (!dateStr) return '';
                                                  if (dateStr.includes('-')) return dateStr;
                                                  if (dateStr.length === 8) {
                                                    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
                                                  }
                                                  return '';
                                                };
                                                const formatNumber = (value: number | undefined | null): string => {
                                                  if (value === undefined || value === null || isNaN(value) || value === 0) return '';
                                                  return value.toFixed(2);
                                                };

                                                setEditingCampaign({
                                                  id: campaign.id,
                                                  name: data.name || campaign.name || '',
                                                  status: data.status || campaign.status || 'ENABLED',
                                                  dailyBudget: formatNumber(data.dailyBudget),
                                                  manualCpc: formatNumber(data.manualCpc),
                                                  startDate: formatDate(data.startDate),
                                                  endDate: formatDate(data.endDate),
                                                  keywords: Array.isArray(data.keywords) && data.keywords.length > 0
                                                    ? data.keywords.map((k: any) => ({
                                                        keyword: k.keyword || '',
                                                        matchType: k.matchType || 'BROAD',
                                                      }))
                                                    : [],
                                                  adTitles: Array.isArray(data.ads?.headlines) && data.ads.headlines.length > 0
                                                    ? data.ads.headlines.filter((h: string) => h && h.trim())
                                                    : ['', '', ''],
                                                  adDescriptions: Array.isArray(data.ads?.descriptions) && data.ads.descriptions.length > 0
                                                    ? data.ads.descriptions.filter((d: string) => d && d.trim())
                                                    : ['', ''],
                                                  finalUrl: data.ads?.finalUrl || '',
                                                  adGroupName: data.adGroups?.[0]?.name || '',
                                                  adGroupCpc: formatNumber(data.adGroups?.[0]?.cpc),
                                                });
                                              } else {
                                                // Fallback para dados básicos
                                                setEditingCampaign({
                                                  id: campaign.id,
                                                  name: campaign.name,
                                                  status: campaign.status,
                                                  keywords: [],
                                                  adTitles: ['', '', ''],
                                                  adDescriptions: ['', ''],
                                                });
                                              }
                                            })
                                            .catch(error => {
                                              console.error('Erro ao buscar detalhes:', error);
                                              setEditingCampaign({
                                                id: campaign.id,
                                                name: campaign.name,
                                                status: campaign.status,
                                                keywords: [],
                                                adTitles: ['', '', ''],
                                                adDescriptions: ['', ''],
                                              });
                                            })
                                            .finally(() => {
                                              setIsLoadingCampaignDetails(false);
                                            });
                                        }
                                      }}
                                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                                      title="Editar campanha"
                                      disabled={isLoadingCampaignDetails}
                                    >
                                      {isLoadingCampaignDetails ? (
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:h-5 border-b-2 border-blue-600"></div>
                                      ) : (
                                        <HiOutlinePencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                      )}
                                    </button>
                                    <span
                                      className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(
                                        campaign.status
                                      )}`}
                                    >
                                      {getStatusLabel(campaign.status)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal de Edição de Campanha */}
          {editingCampaign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                      Editar Campanha
                    </h3>
                    <button
                      onClick={() => setEditingCampaign(null)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Seção 1: Informações Básicas */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Informações Básicas
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nome da Campanha
                          </label>
                          <input
                            type="text"
                            value={editingCampaign.name}
                            onChange={(e) =>
                              setEditingCampaign({
                                ...editingCampaign,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Status
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  status: 'ENABLED',
                                })
                              }
                              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                editingCampaign.status === 'ENABLED'
                                  ? 'bg-green-500 text-white shadow-md scale-105'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                              }`}
                            >
                              Ativa
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  status: 'PAUSED',
                                })
                              }
                              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                                editingCampaign.status === 'PAUSED'
                                  ? 'bg-yellow-500 text-white shadow-md scale-105'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                              }`}
                            >
                              Pausada
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Data de Início
                            </label>
                            <input
                              type="date"
                              value={editingCampaign.startDate || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  startDate: e.target.value,
                                })
                              }
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Data de Fim (Opcional)
                            </label>
                            <input
                              type="date"
                              value={editingCampaign.endDate || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  endDate: e.target.value,
                                })
                              }
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Orçamento e CPC */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Orçamento e CPC
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Orçamento Diário (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editingCampaign.dailyBudget || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  dailyBudget: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            CPC Manual (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editingCampaign.manualCpc || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  manualCpc: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Grupo de Anúncios */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Grupo de Anúncios
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nome do Grupo
                          </label>
                          <input
                            type="text"
                            value={editingCampaign.adGroupName || ''}
                            onChange={(e) =>
                              setEditingCampaign({
                                ...editingCampaign,
                                adGroupName: e.target.value,
                              })
                            }
                            placeholder="Nome do grupo de anúncios"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            CPC do Grupo (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingCampaign.adGroupCpc || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  adGroupCpc: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 4: Palavras-chave */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Palavras-chave
                      </h4>
                      <div className="space-y-3">
                        {(editingCampaign.keywords || []).map((kw, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                          >
                            <span className="flex-1 text-sm text-slate-900 dark:text-white">
                              {kw.keyword}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                              {kw.matchType === 'BROAD' ? 'Ampla' : kw.matchType === 'PHRASE' ? 'Frase' : 'Exata'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newKeywords = [...(editingCampaign.keywords || [])];
                                newKeywords.splice(index, 1);
                                setEditingCampaign({
                                  ...editingCampaign,
                                  keywords: newKeywords,
                                });
                              }}
                              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!editingCampaign.keywords || editingCampaign.keywords.length === 0) && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Nenhuma palavra-chave encontrada
                          </p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            id="newKeywordEdit"
                            placeholder="Nova palavra-chave"
                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const keyword = input.value.trim();
                                if (keyword) {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    keywords: [
                                      ...(editingCampaign.keywords || []),
                                      { keyword, matchType: 'BROAD' },
                                    ],
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <select
                            id="newKeywordMatchTypeEdit"
                            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            defaultValue="BROAD"
                          >
                            <option value="BROAD">Ampla</option>
                            <option value="PHRASE">Frase</option>
                            <option value="EXACT">Exata</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('newKeywordEdit') as HTMLInputElement;
                              const select = document.getElementById('newKeywordMatchTypeEdit') as HTMLSelectElement;
                              const keyword = input?.value.trim();
                              if (keyword) {
                                setEditingCampaign({
                                  ...editingCampaign,
                                  keywords: [
                                    ...(editingCampaign.keywords || []),
                                    { keyword, matchType: select?.value || 'BROAD' },
                                  ],
                                });
                                if (input) input.value = '';
                              }
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <HiOutlinePlus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Seção 5: Anúncios */}
                    <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Anúncios
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Títulos ({editingCampaign.adTitles?.filter((t) => t.trim()).length || 0}/15)
                          </label>
                          <div className="space-y-2">
                            {(editingCampaign.adTitles || ['', '', '']).map((title, index) => (
                              <input
                                key={index}
                                type="text"
                                value={title}
                                onChange={(e) => {
                                  const newTitles = [...(editingCampaign.adTitles || [])];
                                  newTitles[index] = e.target.value;
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    adTitles: newTitles,
                                  });
                                }}
                                placeholder={`Título ${index + 1}`}
                                maxLength={30}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            ))}
                            {(editingCampaign.adTitles?.length || 0) < 15 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    adTitles: [...(editingCampaign.adTitles || []), ''],
                                  });
                                }}
                                className="w-full px-3 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <HiOutlinePlus className="w-4 h-4 inline mr-1" />
                                Adicionar Título
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Descrições ({(editingCampaign.adDescriptions?.filter((d) => d.trim()).length || 0)}/4)
                          </label>
                          <div className="space-y-2">
                            {(editingCampaign.adDescriptions || ['', '']).map((description, index) => (
                              <textarea
                                key={index}
                                value={description}
                                onChange={(e) => {
                                  const newDescriptions = [...(editingCampaign.adDescriptions || [])];
                                  newDescriptions[index] = e.target.value;
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    adDescriptions: newDescriptions,
                                  });
                                }}
                                placeholder={`Descrição ${index + 1}`}
                                maxLength={90}
                                rows={2}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                              />
                            ))}
                            {(editingCampaign.adDescriptions?.length || 0) < 4 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    adDescriptions: [...(editingCampaign.adDescriptions || []), ''],
                                  });
                                }}
                                className="w-full px-3 py-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <HiOutlinePlus className="w-4 h-4 inline mr-1" />
                                Adicionar Descrição
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            URL Final
                          </label>
                          <div className="flex items-center gap-2">
                            <HiOutlineLink className="w-4 h-4 text-slate-400" />
                            <input
                              type="url"
                              value={editingCampaign.finalUrl || ''}
                              onChange={(e) =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  finalUrl: e.target.value,
                                })
                              }
                              placeholder="https://exemplo.com.br"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={() => setEditingCampaign(null)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Prepara os dados para envio
                            const updateData = {
                              name: editingCampaign.name,
                              status: editingCampaign.status,
                              dailyBudget: editingCampaign.dailyBudget || '',
                              startDate: editingCampaign.startDate || '',
                              endDate: editingCampaign.endDate || '',
                              adGroupName: editingCampaign.adGroupName || '',
                              adGroupCpc: editingCampaign.adGroupCpc || '',
                              keywords: editingCampaign.keywords || [],
                              adTitles: editingCampaign.adTitles || [],
                              adDescriptions: editingCampaign.adDescriptions || [],
                              finalUrl: editingCampaign.finalUrl || '',
                            };

                            // Chama a API para atualizar
                            const response = await fetch(`/api/google-ads/campaigns/${editingCampaign.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(updateData),
                            });

                            const result = await response.json();

                            if (response.ok && result.success) {
                              // Atualiza o estado local
                              setGroupedCampaigns((prev) => {
                                const updated = { ...prev };
                                Object.keys(updated).forEach((groupName) => {
                                  updated[groupName] = updated[groupName].map((campaign) =>
                                    campaign.id === editingCampaign.id
                                      ? {
                                          ...campaign,
                                          name: editingCampaign.name,
                                          status: editingCampaign.status,
                                        }
                                      : campaign
                                  );
                                });
                                return updated;
                              });

                              setCampaignsData((prev) =>
                                prev.map((item) =>
                                  item.campaign?.id === editingCampaign.id
                                    ? {
                                        ...item,
                                        campaign: {
                                          ...item.campaign,
                                          id: editingCampaign.id,
                                          name: editingCampaign.name,
                                          status: editingCampaign.status,
                                        },
                                      }
                                    : item
                                )
                              );

                              setEditingCampaign(null);
                              alert('✅ Campanha atualizada com sucesso no Google Ads!');
                            } else {
                              throw new Error(result.error || 'Erro ao atualizar campanha');
                            }
                          } catch (error: any) {
                            console.error('Erro ao atualizar campanha:', error);
                            alert(`❌ Erro ao atualizar campanha: ${error.message || 'Tente novamente.'}`);
                          }
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

