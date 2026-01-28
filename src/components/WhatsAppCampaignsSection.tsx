'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface Contato {
  id: string;
  contato: string;
  contatoNome: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string | null;
  status?: 'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  favorito?: boolean;
  arquivar?: boolean;
  produtoInteresse?: string;
  informacoesCaso?: string;
  inicialConcluido?: boolean;
  createdAt: string | null;
}

interface ContatoCampaignCardProps {
  contato: Contato;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function ContatoCampaignCard({ contato, isSelected, onToggle }: ContatoCampaignCardProps) {
  const primeiraLetra = contato.contatoNome
    ? contato.contatoNome.charAt(0).toUpperCase()
    : contato.contato.charAt(contato.contato.length - 1);

  const nomeExibido = contato.contatoNome || contato.contato;

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

  const getTagColor = () => {
    if (!contato.tags || contato.tags.length === 0) return null;
    const tagPriority = ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto'];
    
    for (const priorityTag of tagPriority) {
      if (contato.tags?.includes(priorityTag)) {
        switch (priorityTag) {
          case 'Urgente':
            return 'border-red-400 dark:border-red-500 border-2';
          case 'Importante':
            return 'border-orange-400 dark:border-orange-500 border-2';
          case 'Seguimento':
            return 'border-purple-400 dark:border-purple-500 border-2';
          case 'Cliente':
            return 'border-blue-400 dark:border-blue-500 border-2';
          case 'Prospecto':
            return 'border-teal-400 dark:border-teal-500 border-2';
        }
      }
    }
    return null;
  };

  const borderClass = getTagColor() || 'border border-slate-200 dark:border-slate-700';

  const getStatusStyle = () => {
    if (!contato.status) return null;
    const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
      'Aberta': { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/30 dark:border-blue-500/50' },
      'Qualificação': { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/30 dark:border-purple-500/50' },
      'Proposta': { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-500/30 dark:border-green-500/50' },
      'Negociação': { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500/30 dark:border-yellow-500/50' },
      'Fechamento': { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30 dark:border-emerald-500/50' },
      'Perdida': { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-500/30 dark:border-red-500/50' },
    };
    return statusStyles[contato.status] || null;
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      className={`group relative bg-white dark:bg-slate-800 rounded-xl p-4 ${borderClass} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
      }`}
    >
      {contato.status && statusStyle && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} backdrop-blur-sm shadow-sm z-10`}>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {contato.status}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Checkbox Elegante */}
        <div className="flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(contato.id)}
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
        <div className={`${corAvatar} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0 relative`}>
          {primeiraLetra}
          {contato.favorito && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-[8px]">⭐</span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate flex-1 min-w-0">
              {nomeExibido}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
            {contato.contato}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {contato.tags && contato.tags.length > 0 && (
              <>
                {contato.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
                {contato.tags.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    +{contato.tags.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TemplateCard {
  id: string;
  titulo: string;
  texto: string;
  btn?: boolean;
  linkBtn?: string;
  varNome?: boolean;
}

interface TemplateCardProps {
  template: TemplateCard;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onSelect, onClick }: TemplateCardProps) {
  // Trunca o texto para mostrar apenas o que cabe
  const textoTruncado = template.texto.length > 100 
    ? template.texto.substring(0, 100) + '...' 
    : template.texto;

  return (
    <div className="px-2">
      <div
        className={`relative bg-white dark:bg-slate-800 rounded-xl border ${
          isSelected
            ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20'
            : 'border-slate-200 dark:border-slate-700'
        } shadow-sm hover:shadow-md transition-all duration-300 p-4 h-full flex flex-col min-h-[200px]`}
      >
        {/* Checkbox Elegante no canto superior direito */}
        <div className="absolute top-3 right-3 z-10">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(template.id)}
              className="sr-only peer"
            />
            <div className={`w-4 h-4 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
              isSelected
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/50'
                : 'border-slate-300 dark:border-slate-600'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </label>
        </div>

        {/* Conteúdo do Card */}
        <div className="pr-8">
          <h4 
            className="text-sm font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={onClick}
          >
            {template.titulo}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
            {textoTruncado}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppCampaignsSection() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTemplateView, setSelectedTemplateView] = useState<TemplateCard | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formTexto, setFormTexto] = useState('');
  const [formBtn, setFormBtn] = useState(false);
  const [formLinkBtn, setFormLinkBtn] = useState('');
  const [formVarNome, setFormVarNome] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isMobile } = useSidebar();

  useEffect(() => {
    fetchContatos();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/templates-campanha');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
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

  // Filtra os contatos
  const contatosFiltrados = useMemo(() => {
    return contatos.filter((contato) => {
      // Filtro de busca (nome ou número)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nomeMatch = contato.contatoNome?.toLowerCase().includes(searchLower);
        const numeroMatch = contato.contato?.toLowerCase().includes(searchLower);
        if (!nomeMatch && !numeroMatch) return false;
      }

      // Filtro de status
      if (selectedStatus && contato.status !== selectedStatus) {
        return false;
      }

      // Filtro de tags
      if (selectedTags.length > 0) {
        const hasAnyTag = selectedTags.some((tag) => contato.tags?.includes(tag as any));
        if (!hasAnyTag) return false;
      }

      return true;
    });
  }, [contatos, searchTerm, selectedStatus, selectedTags]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Seleciona todos os contatos filtrados
      const allIds = new Set(contatosFiltrados.map((contato) => contato.id));
      setSelectedIds(allIds);
    } else {
      // Desmarca todos
      setSelectedIds(new Set());
    }
  };

  // Verifica se todos os contatos filtrados estão selecionados
  const allSelected = contatosFiltrados.length > 0 && 
    contatosFiltrados.every((contato) => selectedIds.has(contato.id));
  
  // Verifica se pelo menos um está selecionado (para estado indeterminado)
  const someSelected = contatosFiltrados.some((contato) => selectedIds.has(contato.id));

  // Obtém todas as tags únicas
  const todasTags = Array.from(
    new Set(contatos.flatMap((c) => c.tags || []))
  ) as Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;

  // Obtém todos os status únicos
  const todosStatus = Array.from(
    new Set(contatos.map((c) => c.status).filter(Boolean))
  ) as Array<'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida'>;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTemplateSelect = (id: string) => {
    // Apenas um template pode ser selecionado por vez
    setSelectedTemplateId(id === selectedTemplateId ? null : id);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setFormTitulo('');
    setFormTexto('');
    setFormBtn(false);
    setFormLinkBtn('');
    setFormVarNome(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormTitulo('');
    setFormTexto('');
    setFormBtn(false);
    setFormLinkBtn('');
    setFormVarNome(false);
  };

  const handleSaveTemplate = async () => {
    if (!formTitulo.trim() || !formTexto.trim()) {
      alert('Por favor, preencha o título e o texto do template.');
      return;
    }

    if (formBtn && !formLinkBtn.trim()) {
      alert('Por favor, informe o link do botão.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/templates-campanha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: formTitulo.trim(),
          texto: formTexto.trim(),
          btn: formBtn,
          linkBtn: formBtn ? formLinkBtn.trim() : '',
          varNome: formVarNome,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Adiciona o novo template à lista
        setTemplates((prev) => [data.template, ...prev]);
        handleCloseModal();
      } else {
        alert('Erro ao salvar template: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleViewTemplate = (template: TemplateCard) => {
    setSelectedTemplateView(template);
    setViewModalOpen(true);
  };

  // Configurações do carrossel de templates
  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: isMobile ? 1 : 3,
    slidesToScroll: 1,
    autoplay: false,
    pauseOnHover: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="mt-12 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Whatsapp
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo - Lista de Contatos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Contatos
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

          {/* Filtros */}
          <div className="mb-4 space-y-3">
            {/* Filtro de Busca */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou número..."
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              >
                <option value="">Todos os status</option>
                {todosStatus.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Tags */}
            {todasTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {todasTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando contatos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={fetchContatos}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : contatosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {contatos.length === 0 ? 'Nenhum contato encontrado' : 'Nenhum contato corresponde aos filtros'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {contatos.length === 0
                  ? 'Os contatos aparecerão aqui quando houver mensagens recebidas.'
                  : 'Tente ajustar os filtros de busca.'}
              </p>
            </div>
          ) : (
            <div 
              className="space-y-3 overflow-y-auto overflow-x-hidden"
              style={{ maxHeight: '800px' }}
            >
              {contatosFiltrados.map((contato) => (
                <ContatoCampaignCard
                  key={contato.id}
                  contato={contato}
                  isSelected={selectedIds.has(contato.id)}
                  onToggle={toggleSelection}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito - Templates */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Templates do WhatsApp
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Campanhas de whatsapp precisam de templates pré aprovados pelo facebook. Abaixo temos alguns templates disponíveis. Mas também é possível aprovar novos templates para serem usado na sua campanha.
            </p>
          </div>

          {/* Carrossel de Templates */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400">Carregando templates...</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Slider {...sliderSettings} className="carousel-container">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={handleTemplateSelect}
                    onClick={() => handleViewTemplate(template)}
                  />
                ))}
                
                {/* Card de Adicionar Template */}
                <div className="px-2">
                  <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 p-4 h-full flex flex-col">
                    <div className="flex flex-col items-center justify-center flex-1 min-h-[200px]">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <button
                        onClick={handleOpenModal}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Adicione um Templete
                      </button>
                    </div>
                  </div>
                </div>
              </Slider>
            </div>
          )}

          {/* Botão Iniciar Campanha */}
          <div className="mt-6">
            <button className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              Iniciar Campanha de Notificação
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Adicionar Template */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Adicionar Template
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Digite o título do template"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Texto */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Texto
                </label>
                <textarea
                  value={formTexto}
                  onChange={(e) => setFormTexto(e.target.value)}
                  placeholder="Digite o texto do template"
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Checkbox Adicionar Botão Link */}
              <div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBtn}
                    onChange={(e) => {
                      setFormBtn(e.target.checked);
                      if (!e.target.checked) {
                        setFormLinkBtn('');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
                    formBtn
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/50'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {formBtn && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Adicionar botão link
                  </span>
                </label>
              </div>

              {/* Input Link (aparece quando checkbox está selecionado) */}
              {formBtn && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Link do Botão
                  </label>
                  <input
                    type="url"
                    value={formLinkBtn}
                    onChange={(e) => setFormLinkBtn(e.target.value)}
                    placeholder="https://exemplo.com"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !formTitulo.trim() || !formTexto.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Template */}
      {viewModalOpen && selectedTemplateView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {selectedTemplateView.titulo}
              </h3>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedTemplateView(null);
                }}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Texto do Template
                </label>
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedTemplateView.texto}
                  </p>
                </div>
              </div>

              {selectedTemplateView.btn && selectedTemplateView.linkBtn && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Link do Botão
                  </label>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <a
                      href={selectedTemplateView.linkBtn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedTemplateView.linkBtn}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedTemplateView(null);
                }}
                className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

