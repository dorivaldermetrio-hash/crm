'use client';

import { useEffect, useState, useMemo } from 'react';
import { Mail } from 'lucide-react';
import EmailCampaignProgressModal from './EmailCampaignProgressModal';

interface ContatoEmail {
  id: string;
  nome: string;
  email: string;
  createdAt: string | null;
}

interface ContatoEmailCampaignCardProps {
  contatoEmail: ContatoEmail;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function ContatoEmailCampaignCard({ contatoEmail, isSelected, onToggle }: ContatoEmailCampaignCardProps) {
  const primeiraLetra = contatoEmail.nome
    ? contatoEmail.nome.charAt(0).toUpperCase()
    : contatoEmail.email.charAt(0).toUpperCase();

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

  const corIndex = primeiraLetra.charCodeAt(0) % cores.length;
  const corAvatar = cores[corIndex];

  return (
    <div
      className={`group relative bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox Elegante */}
        <div className="flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(contatoEmail.id)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500 peer-checked:border-blue-600 dark:peer-checked:border-blue-500 transition-all duration-200 flex items-center justify-center peer-checked:shadow-lg peer-checked:shadow-blue-500/50">
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </label>
        </div>

        {/* Avatar */}
        <div className={`${corAvatar} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0`}>
          {primeiraLetra}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate flex-1 min-w-0">
              {contatoEmail.nome}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Mail className="w-3.5 h-3.5" />
            <p className="text-xs truncate">
              {contatoEmail.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailCampaignsSection() {
  const [contatosEmail, setContatosEmail] = useState<ContatoEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [textareaContent, setTextareaContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [modalProgressOpen, setModalProgressOpen] = useState(false);

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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtra os contatos email
  const contatosEmailFiltrados = useMemo(() => {
    return contatosEmail.filter((contato) => {
      // Filtro de busca (nome ou email)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nomeMatch = contato.nome?.toLowerCase().includes(searchLower);
        const emailMatch = contato.email?.toLowerCase().includes(searchLower);
        if (!nomeMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [contatosEmail, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleciona todos os contatos email filtrados
      const allIds = new Set(contatosEmailFiltrados.map((contato) => contato.id));
      setSelectedIds(allIds);
    } else {
      // Desmarca todos
      setSelectedIds(new Set());
    }
  };

  // Verifica se todos os contatos email filtrados estão selecionados
  const allSelected = contatosEmailFiltrados.length > 0 && 
    contatosEmailFiltrados.every((contato) => selectedIds.has(contato.id));
  
  // Verifica se pelo menos um está selecionado (para estado indeterminado)
  const someSelected = contatosEmailFiltrados.some((contato) => selectedIds.has(contato.id));

  return (
    <div className="mt-12 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Campanhas de Email
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo - Textarea */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Mensagem da Campanha
          </h3>
          
          {/* Input Assunto */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Assunto do Email
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Digite o assunto do email... (use {nome} para personalizar)"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use {'{nome}'} para personalizar o assunto para cada contato
            </p>
          </div>

          <textarea
            value={textareaContent}
            onChange={(e) => setTextareaContent(e.target.value)}
            placeholder="Digite a mensagem da campanha de email aqui... (use {nome} para personalizar)"
            className="w-full h-[500px] px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none scrollbar-elegant mb-4"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Use {'{nome}'} na mensagem para personalizar para cada contato
          </p>
          <button
            onClick={() => {
              const selectedEmails = contatosEmailFiltrados
                .filter((contato) => selectedIds.has(contato.id))
                .map((contato) => contato.email);

              if (selectedEmails.length === 0) {
                alert('Por favor, selecione pelo menos um contato email.');
                return;
              }

              if (!textareaContent.trim()) {
                alert('Por favor, digite uma mensagem para a campanha.');
                return;
              }

              setModalProgressOpen(true);
            }}
            disabled={selectedIds.size === 0 || !textareaContent.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar Email
          </button>
        </div>

        {/* Lado Direito - Lista de Contatos Email */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 flex flex-col" style={{ maxHeight: '800px' }}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Contatos Email
          </h3>

          {/* Checkbox Selecionar Todos */}
          <div className="mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                allSelected
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/50'
                  : someSelected
                  ? 'bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {allSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {someSelected && !allSelected && (
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
                  </svg>
                )}
              </div>
              <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Selecionar todos os contatos
              </span>
            </label>
          </div>

          {/* Filtro de Busca */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          {/* Lista de Contatos com Scroll */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-elegant">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">Carregando contatos email...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                <button
                  onClick={fetchContatosEmail}
                  className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : contatosEmailFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {contatosEmail.length === 0 ? 'Nenhum contato email encontrado' : 'Nenhum contato corresponde aos filtros'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {contatosEmail.length === 0
                    ? 'Os contatos email aparecerão aqui quando forem adicionados.'
                    : 'Tente ajustar o filtro de busca.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contatosEmailFiltrados.map((contatoEmail) => (
                  <ContatoEmailCampaignCard
                    key={contatoEmail.id}
                    contatoEmail={contatoEmail}
                    isSelected={selectedIds.has(contatoEmail.id)}
                    onToggle={toggleSelection}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Progresso */}
      <EmailCampaignProgressModal
        isOpen={modalProgressOpen}
        onClose={() => {
          setModalProgressOpen(false);
        }}
        contatos={contatosEmailFiltrados.filter((contato) => selectedIds.has(contato.id))}
        message={textareaContent}
        subject={emailSubject}
      />
    </div>
  );
}

