'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  HiOutlineCog6Tooth,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineClipboard,
  HiOutlineArrowPath,
  HiOutlineBell,
} from 'react-icons/hi2';
import { RiWhatsappLine, RiInstagramLine, RiRobotLine } from 'react-icons/ri';
import { HiOutlineMail, HiOutlineServer } from 'react-icons/hi';

type TabType = 'geral' | 'ia' | 'whatsapp' | 'instagram' | 'email' | 'notificacoes' | 'seguranca';

interface ConfigData {
  numMsgHist: number;
  duracaoAgendamento: string;
  pararAtendimento: string;
}

interface ConnectionStatus {
  whatsapp: 'checking' | 'connected' | 'disconnected';
  instagram: 'checking' | 'connected' | 'disconnected';
  email: 'checking' | 'connected' | 'disconnected';
  mongodb: 'checking' | 'connected' | 'disconnected';
  ollama: 'checking' | 'connected' | 'disconnected';
}

export default function ConfiguracoesPage() {
  const { isOpen, isMobile } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [config, setConfig] = useState<ConfigData>({
    numMsgHist: 0,
    duracaoAgendamento: '0:00',
    pararAtendimento: 'Nenhum',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    whatsapp: 'checking',
    instagram: 'checking',
    email: 'checking',
    mongodb: 'checking',
    ollama: 'checking',
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [envInfo, setEnvInfo] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    fetchEnvInfo();
    checkConnections();
  }, []);

  const fetchEnvInfo = async () => {
    try {
      const response = await fetch('/api/config/info');
      const result = await response.json();
      if (result.success) {
        setEnvInfo(result.data);
      }
    } catch (err) {
      console.error('Erro ao buscar informações de ambiente:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConnections = async () => {
    const connections: (keyof ConnectionStatus)[] = ['whatsapp', 'instagram', 'email', 'mongodb', 'ollama'];
    
    for (const conn of connections) {
      setConnectionStatus((prev) => ({ ...prev, [conn]: 'checking' }));
      
      try {
        const response = await fetch('/api/config/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: conn }),
        });
        
        const result = await response.json();
        setConnectionStatus((prev) => ({
          ...prev,
          [conn]: result.success ? 'connected' : 'disconnected',
        }));
      } catch {
        setConnectionStatus((prev) => ({ ...prev, [conn]: 'disconnected' }));
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Erro ao salvar: ' + (result.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: string) => {
    setTestingConnection(type);
    try {
      const response = await fetch('/api/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        checkConnections();
      } else {
        alert(`❌ ${result.error}\n${result.details || ''}`);
      }
    } catch (err) {
      alert('Erro ao testar conexão');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Por favor, insira um email válido');
      return;
    }

    setSendingTestEmail(true);
    try {
      const response = await fetch('/api/config/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        setTestEmail('');
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      alert('Erro ao enviar email de teste');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const getStatusIcon = (status: 'checking' | 'connected' | 'disconnected') => {
    if (status === 'checking') {
      return <HiOutlineArrowPath className="w-4 h-4 text-slate-400 animate-spin" />;
    }
    return status === 'connected' ? (
      <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <HiOutlineXCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getMainMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'geral', label: 'Geral', icon: HiOutlineCog6Tooth },
    { id: 'ia', label: 'Atendimento IA', icon: RiRobotLine },
    { id: 'whatsapp', label: 'WhatsApp', icon: RiWhatsappLine },
    { id: 'instagram', label: 'Instagram', icon: RiInstagramLine },
    { id: 'email', label: 'Email', icon: HiOutlineMail },
    { id: 'notificacoes', label: 'Notificações', icon: HiOutlineBell },
    { id: 'seguranca', label: 'Segurança', icon: HiOutlineServer },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Configurações
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Gerencie as configurações do sistema
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t border-l border-r border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando configurações...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              {/* Tab: Geral */}
              {activeTab === 'geral' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurações Gerais</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Fuso Horário
                      </label>
                      <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <option value="America/Sao_Paulo">America/Sao_Paulo (Brasil)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EUA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Idioma
                      </label>
                      <select className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Atendimento IA */}
              {activeTab === 'ia' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Atendimento IA</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.ollama)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {connectionStatus.ollama === 'connected' ? 'Conectado' : connectionStatus.ollama === 'checking' ? 'Verificando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={envInfo?.ollama?.enabled ?? false}
                          disabled
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Habilitar Respostas Automáticas
                        </span>
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-500 ml-6">
                        Configure via variável de ambiente OLLAMA_AUTO_REPLY_ENABLED
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        URL do Ollama
                      </label>
                      <input
                        type="text"
                        value={envInfo?.ollama?.url || 'http://localhost:11434'}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente OLLAMA_URL
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={envInfo?.ollama?.model || 'Carregando...'}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente OLLAMA_MODEL
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Número Máximo de Mensagens no Histórico
                      </label>
                      <input
                        type="number"
                        value={config.numMsgHist}
                        onChange={(e) => setConfig({ ...config, numMsgHist: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Duração de Agendamento (horas:minutos)
                      </label>
                      <input
                        type="text"
                        value={config.duracaoAgendamento}
                        onChange={(e) => setConfig({ ...config, duracaoAgendamento: e.target.value })}
                        pattern="^\d+:\d{2}$"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="Ex: 1:30 (1 hora e 30 minutos)"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Formato: horas:minutos (ex: 1:30 para 1 hora e 30 minutos)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Pausar Atendimento para Status
                      </label>
                      <select
                        value={config.pararAtendimento}
                        onChange={(e) => setConfig({ ...config, pararAtendimento: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Nenhum">Nenhum</option>
                        <option value="Aberta">Aberta</option>
                        <option value="Qualificação">Qualificação</option>
                        <option value="Proposta">Proposta</option>
                        <option value="Negociação">Negociação</option>
                        <option value="Fechamento">Fechamento</option>
                        <option value="Perdida">Perdida</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleTestConnection('ollama')}
                      disabled={testingConnection === 'ollama'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testingConnection === 'ollama' ? (
                        <>
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        'Testar Conexão Ollama'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: WhatsApp */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.whatsapp)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {connectionStatus.whatsapp === 'connected' ? 'Conectado' : connectionStatus.whatsapp === 'checking' ? 'Verificando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone Number ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={envInfo?.whatsapp?.phoneNumberId || 'Não configurado'}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        {envInfo?.whatsapp?.phoneNumberId && (
                          <button
                            onClick={() => copyToClipboard(envInfo.whatsapp.phoneNumberId)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            <HiOutlineClipboard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente WHATSAPP_PHONE_NUMBER_ID
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Access Token
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showPasswords.whatsapp ? 'text' : 'password'}
                          value={envInfo?.whatsapp?.accessToken ? '••••••••••••••••' : 'Não configurado'}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        {envInfo?.whatsapp?.accessToken && (
                          <button
                            onClick={() => setShowPasswords({ ...showPasswords, whatsapp: !showPasswords.whatsapp })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            {showPasswords.whatsapp ? (
                              <HiOutlineEyeSlash className="w-4 h-4" />
                            ) : (
                              <HiOutlineEye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente WHATSAPP_ACCESS_TOKEN
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Webhook URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : ''}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '')}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <HiOutlineClipboard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('whatsapp')}
                      disabled={testingConnection === 'whatsapp'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testingConnection === 'whatsapp' ? (
                        <>
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        'Testar Conexão WhatsApp'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Instagram */}
              {activeTab === 'instagram' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Instagram</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.instagram)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {connectionStatus.instagram === 'connected' ? 'Conectado' : connectionStatus.instagram === 'checking' ? 'Verificando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Access Token
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showPasswords.instagram ? 'text' : 'password'}
                          value={envInfo?.instagram?.accessToken ? '••••••••••••••••' : 'Não configurado'}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        {envInfo?.instagram?.accessToken && (
                          <button
                            onClick={() => setShowPasswords({ ...showPasswords, instagram: !showPasswords.instagram })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            {showPasswords.instagram ? (
                              <HiOutlineEyeSlash className="w-4 h-4" />
                            ) : (
                              <HiOutlineEye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente INSTAGRAM_ACCESS_TOKEN
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={envInfo?.instagram?.userId || 'Não configurado'}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Configure via variável de ambiente INSTAGRAM_USER_ID
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Webhook URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook-instagram` : ''}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        <button
                          onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhook-instagram` : '')}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <HiOutlineClipboard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('instagram')}
                      disabled={testingConnection === 'instagram'}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testingConnection === 'instagram' ? (
                        <>
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        'Testar Conexão Instagram'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Email */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.email)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {connectionStatus.email === 'connected' ? 'Conectado' : connectionStatus.email === 'checking' ? 'Verificando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Servidor SMTP
                        </label>
                        <input
                          type="text"
                          value={envInfo?.email?.host || 'Não configurado'}
                          disabled
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Porta
                        </label>
                        <input
                          type="text"
                          value={envInfo?.email?.port || 'Não configurado'}
                          disabled
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email/Usuário
                      </label>
                      <input
                        type="text"
                        value={envInfo?.email?.user || 'Não configurado'}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Senha
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showPasswords.email ? 'text' : 'password'}
                          value={envInfo?.email?.password ? '••••••••••••••••' : 'Não configurado'}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        />
                        {envInfo?.email?.password && (
                          <button
                            onClick={() => setShowPasswords({ ...showPasswords, email: !showPasswords.email })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            {showPasswords.email ? (
                              <HiOutlineEyeSlash className="w-4 h-4" />
                            ) : (
                              <HiOutlineEye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Remetente (FROM)
                      </label>
                      <input
                        type="text"
                        value={envInfo?.email?.from || 'Não configurado'}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      />
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Enviar Email de Teste
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={handleSendTestEmail}
                          disabled={sendingTestEmail || !testEmail}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {sendingTestEmail ? (
                            <>
                              <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            'Enviar Teste'
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTestConnection('email')}
                      disabled={testingConnection === 'email'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testingConnection === 'email' ? (
                        <>
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        'Testar Conexão SMTP'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Notificações */}
              {activeTab === 'notificacoes' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notificações</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Notificações de novas mensagens
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Notificações de campanhas concluídas
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Notificações de erros do sistema
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Segurança */}
              {activeTab === 'seguranca' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segurança</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Status do Banco de Dados
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(connectionStatus.mongodb)}
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {connectionStatus.mongodb === 'connected' ? 'Conectado' : connectionStatus.mongodb === 'checking' ? 'Verificando...' : 'Desconectado'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTestConnection('mongodb')}
                        disabled={testingConnection === 'mongodb'}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {testingConnection === 'mongodb' ? 'Testando...' : 'Testar'}
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Limpar Cache
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                        Remove dados temporários do navegador
                      </p>
                      <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm">
                        Limpar Cache
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão Salvar (apenas para IA) */}
              {activeTab === 'ia' && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    {saveSuccess && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <HiOutlineCheckCircle className="w-4 h-4" />
                        Configurações salvas com sucesso!
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Configurações'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

