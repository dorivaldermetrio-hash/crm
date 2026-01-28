'use client';

import { useState } from 'react';
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
} from 'react-icons/hi2';
import { X } from 'lucide-react';

export default function GoogleAdsPage() {
  const { isOpen, isMobile } = useSidebar();

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
  const [newLocation, setNewLocation] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [biddingStrategy, setBiddingStrategy] = useState('MANUAL_CPC'); // Disabled for Google Ads API Standard Access compliance - Only MANUAL_CPC allowed
  const [manualCpc, setManualCpc] = useState('');
  const [adGroupName, setAdGroupName] = useState('');
  const [adGroupCpc, setAdGroupCpc] = useState('');
  const [keywords, setKeywords] = useState<Array<{ keyword: string; matchType: string }>>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordMatchType, setNewKeywordMatchType] = useState('BROAD');
  const [adTitles, setAdTitles] = useState<string[]>(['']);
  const [adDescriptions, setAdDescriptions] = useState<string[]>(['']);
  const [finalUrl, setFinalUrl] = useState('');
  const [displayPath, setDisplayPath] = useState('');

  // Estados para validação e mensagens de erro
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation('');
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
    if (adTitles.length < 3) {
      setAdTitles([...adTitles, '']);
    }
  };

  const removeAdTitle = (index: number) => {
    if (adTitles.length > 1) {
      setAdTitles(adTitles.filter((_, i) => i !== index));
    }
  };

  const addAdDescription = () => {
    if (adDescriptions.length < 2) {
      setAdDescriptions([...adDescriptions, '']);
    }
  };

  const removeAdDescription = (index: number) => {
    if (adDescriptions.length > 1) {
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

    // Validação: Pelo menos 1 anúncio válido (título e descrição preenchidos)
    const validTitles = adTitles.filter((t) => t.trim().length > 0);
    const validDescriptions = adDescriptions.filter((d) => d.trim().length > 0);
    if (validTitles.length === 0) {
      newErrors.adTitles = 'Adicione pelo menos um título válido';
    }
    if (validDescriptions.length === 0) {
      newErrors.adDescriptions = 'Adicione pelo menos uma descrição válida';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const isValid = validateForm();
    if (!isValid) {
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

    // Aqui será implementado o envio para o backend quando a API estiver disponível
    console.log('Formulário submetido:', {
      campaignName,
      campaignType: 'SEARCH', // Forced to SEARCH for Google Ads API Standard Access compliance
      status,
      dailyBudget,
      startDate,
      endDate,
      searchNetwork: true, // Forced to true for Google Ads API Standard Access compliance
      locations,
      language,
      biddingStrategy: 'MANUAL_CPC', // Forced to MANUAL_CPC for Google Ads API Standard Access compliance
      manualCpc,
      adGroupName,
      adGroupCpc,
      keywords,
      adTitles: adTitles.filter((t) => t.trim().length > 0),
      adDescriptions: adDescriptions.filter((d) => d.trim().length > 0),
      finalUrl,
      displayPath,
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
              Google ADS
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Crie e gerencie suas campanhas do Google Ads
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Informações Básicas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineMegaphone className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Informações Básicas
                </h2>
              </div>

              <div className="space-y-5">
                {/* Nome da Campanha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome da Campanha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ex: Campanha de Verão 2024"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Tipo de Campanha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Campanha <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Apenas campanhas de Pesquisa (Search) estão disponíveis
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('ENABLED')}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
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
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineCurrencyDollar className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Orçamento</h2>
              </div>

              <div className="space-y-5">
                {/* Orçamento Diário */}
                <div data-field="dailyBudget">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Orçamento Diário (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
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
                      className={`w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.dailyBudget
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      required
                    />
                  </div>
                  {errors.dailyBudget && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.dailyBudget}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineCalendar className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Datas</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Data de Início */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Data de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Data de Fim */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Data de Fim (Opcional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Seção 4: Redes de Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineGlobeAlt className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Redes de Anúncios
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-not-allowed opacity-75">
                  <input
                    type="checkbox"
                    checked={searchNetwork}
                    disabled
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Google Search
                  </span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineGlobeAlt className="w-6 h-6 text-teal-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Localização e Idioma
                </h2>
              </div>

              <div className="space-y-5">
                {/* Localizações */}
                <div data-field="locations">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Localizações <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                      placeholder="Ex: Brasil, São Paulo"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addLocation}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <HiOutlinePlus className="w-5 h-5" />
                      Adicionar
                    </button>
                  </div>
                  {errors.locations && (
                    <p className="mb-2 text-sm text-red-600 dark:text-red-400">{errors.locations}</p>
                  )}
                  {locations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {locations.map((location, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium"
                        >
                          {location}
                          <button
                            type="button"
                            onClick={() => {
                              removeLocation(location);
                              if (errors.locations && locations.length === 1) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.locations;
                                  return newErrors;
                                });
                              }
                            }}
                            className="hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Idioma */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Idioma <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineTag className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Estratégia de Lances
                </h2>
              </div>

              <div className="space-y-5">
                {/* Tipo de Lance - Disabled for Google Ads API Standard Access compliance */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Lance <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={biddingStrategy}
                    onChange={(e) => setBiddingStrategy(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Apenas CPC Manual está disponível
                  </p>
                </div>

                {/* CPC Manual */}
                <div data-field="manualCpc">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CPC Manual (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
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
                      className={`w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.manualCpc
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                      }`}
                      required
                    />
                  </div>
                  {errors.manualCpc && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.manualCpc}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    O CPC mínimo é R$ 0,01
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 7: Grupo de Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineDocumentText className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Grupo de Anúncios
                </h2>
              </div>

              <div className="space-y-5">
                {/* Nome do Grupo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome do Grupo de Anúncios <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adGroupName}
                    onChange={(e) => setAdGroupName(e.target.value)}
                    placeholder="Ex: Grupo 1 - Palavras-chave principais"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* CPC do Grupo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CPC do Grupo (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={adGroupCpc}
                      onChange={(e) => setAdGroupCpc(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 8: Palavras-chave (apenas para campanhas de pesquisa) */}
            {/* Disabled for Google Ads API Standard Access compliance - Only shown for SEARCH campaigns */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineTag className="w-6 h-6 text-cyan-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Palavras-chave <span className="text-red-500">*</span>
                </h2>
              </div>

              <div className="space-y-5" data-field="keywords">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Digite a palavra-chave manualmente"
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <select
                    value={newKeywordMatchType}
                    onChange={(e) => setNewKeywordMatchType(e.target.value)}
                    className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="BROAD">Ampla</option>
                    <option value="PHRASE">Frase</option>
                    <option value="EXACT">Exata</option>
                  </select>
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <HiOutlinePlus className="w-5 h-5" />
                    Adicionar
                  </button>
                </div>
                {errors.keywords && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.keywords}</p>
                )}

                {keywords.length > 0 && (
                  <div className="space-y-2">
                    {keywords.map((kw, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {kw.keyword}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
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
                          className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adicione palavras-chave manualmente. Sugestões automáticas não estão disponíveis.
                </p>
              </div>
            </div>

            {/* Seção 9: Anúncios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiOutlineDocumentText className="w-6 h-6 text-violet-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Anúncios</h2>
              </div>

              <div className="space-y-5">
                {/* Títulos */}
                <div data-field="adTitles">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Títulos (máximo 3) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
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
                          className={`flex-1 px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
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
                            className="px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {adTitles.length < 3 && (
                      <button
                        type="button"
                        onClick={addAdTitle}
                        className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <HiOutlinePlus className="w-5 h-5" />
                        Adicionar Título
                      </button>
                    )}
                  </div>
                  {errors.adTitles && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.adTitles}</p>
                  )}
                </div>

                {/* Descrições */}
                <div data-field="adDescriptions">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Descrições (máximo 2) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
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
                          className={`flex-1 px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
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
                            className="px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {adDescriptions.length < 2 && (
                      <button
                        type="button"
                        onClick={addAdDescription}
                        className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <HiOutlinePlus className="w-5 h-5" />
                        Adicionar Descrição
                      </button>
                    )}
                  </div>
                  {errors.adDescriptions && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.adDescriptions}
                    </p>
                  )}
                </div>

                {/* URL Final */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    URL Final <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <HiOutlineLink className="w-5 h-5 text-slate-400" />
                    <input
                      type="url"
                      value={finalUrl}
                      onChange={(e) => setFinalUrl(e.target.value)}
                      placeholder="https://exemplo.com.br"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Caminho de Exibição */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Caminho de Exibição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={displayPath}
                    onChange={(e) => setDisplayPath(e.target.value)}
                    placeholder="Ex: produtos/oferta"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <HiOutlineMegaphone className="w-5 h-5" />
                Criar Campanha
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

