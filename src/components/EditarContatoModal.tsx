'use client';

import { useEffect, useState } from 'react';
import { X, Star, Archive, Tag, FileText, CheckCircle2, User, Phone } from 'lucide-react';

interface Contato {
  id: string;
  contato: string;
  contatoNome: string;
  status?: 'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  nota?: string;
  favorito?: boolean;
  arquivar?: boolean;
  produtoInteresse?: string;
  informacoesCaso?: string;
  inicialConcluido?: boolean;
}

interface EditarContatoModalProps {
  contato: Contato | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// Função para obter cor do status (mesmo padrão da página de Automações)
const getStatusColor = (statusValue: Contato['status']) => {
  const statusColors: Record<string, { selected: string; text: string }> = {
    'Aberta': {
      selected: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    'Qualificação': {
      selected: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
    },
    'Proposta': {
      selected: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30',
      text: 'text-green-600 dark:text-green-400',
    },
    'Negociação': {
      selected: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    'Fechamento': {
      selected: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    'Perdida': {
      selected: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
      text: 'text-red-600 dark:text-red-400',
    },
  };
  return statusColors[statusValue || 'Aberta'] || statusColors['Aberta'];
};

const statusOptions: Array<{ value: Contato['status']; label: string }> = [
  { value: 'Aberta', label: 'Aberta' },
  { value: 'Qualificação', label: 'Qualificação' },
  { value: 'Proposta', label: 'Proposta' },
  { value: 'Negociação', label: 'Negociação' },
  { value: 'Fechamento', label: 'Fechamento' },
  { value: 'Perdida', label: 'Perdida' },
];

const tagOptions: Array<{ value: Contato['tags'][0]; label: string; color: string }> = [
  { value: 'Urgente', label: 'Urgente', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'Importante', label: 'Importante', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'Seguimento', label: 'Seguimento', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'Cliente', label: 'Cliente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'Prospecto', label: 'Prospecto', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
];

export default function EditarContatoModal({
  contato,
  isOpen,
  onClose,
  onUpdate,
}: EditarContatoModalProps) {
  const [contatoNome, setContatoNome] = useState('');
  const [status, setStatus] = useState<Contato['status']>('Aberta');
  const [tags, setTags] = useState<Contato['tags']>([]);
  const [nota, setNota] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [arquivar, setArquivar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (contato && isOpen) {
      setContatoNome(contato.contatoNome || '');
      setStatus(contato.status || 'Aberta');
      setTags(contato.tags || []);
      setNota(contato.nota || '');
      setFavorito(contato.favorito || false);
      setArquivar(contato.arquivar || false);
    }
  }, [contato, isOpen]);

  const toggleTag = (tag: Contato['tags'][0]) => {
    setTags((prev) => {
      if (prev?.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...(prev || []), tag];
      }
    });
  };

  const handleSalvar = async () => {
    if (!contato || salvando) return;

    setSalvando(true);

    try {
      const dadosParaEnviar = {
        contatoNome: contatoNome.trim() || '',
        status,
        tags: tags || [],
        nota: nota || '',
        favorito: favorito || false,
        arquivar: arquivar || false,
      };

      console.log('💾 Enviando dados para atualizar:', dadosParaEnviar);

      const response = await fetch(`/api/contatos/${contato.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      const data = await response.json();

      console.log('📥 Resposta da API:', data);

      if (data.success) {
        onUpdate();
        onClose();
      } else {
        console.error('❌ Erro ao salvar:', data.error);
        alert(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen || !contato) return null;

  const primeiraLetra = contatoNome
    ? contatoNome.charAt(0).toUpperCase()
    : contato.contato.charAt(contato.contato.length - 1);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fade-in_200ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-[slide-in-from-bottom-4_300ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-4">
            <div className={`${corAvatar} w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl relative`}>
              {primeiraLetra}
              {favorito && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-600 text-yellow-600" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Editar Contato
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {contato.contato}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-white/80 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 hover:scale-110"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nome do Contato */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <User className="w-4 h-4 text-blue-500" />
              Nome do Contato
            </label>
            <input
              type="text"
              value={contatoNome}
              onChange={(e) => setContatoNome(e.target.value)}
              placeholder="Digite o nome do contato..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((option) => {
                const statusColor = getStatusColor(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      status === option.value
                        ? statusColor.selected
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <Tag className="w-4 h-4 text-purple-500" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((option) => {
                const isSelected = tags?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleTag(option.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${option.color} ring-2 ring-offset-2 ring-current shadow-md scale-105`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 hover:scale-105'
                    }`}
                  >
                    {option.label}
                    {isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorito e Arquivar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setFavorito(!favorito)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                favorito
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-700 bg-white dark:bg-slate-700'
              }`}
            >
              <Star
                className={`w-5 h-5 transition-all duration-200 ${
                  favorito
                    ? 'fill-yellow-400 text-yellow-400 scale-110'
                    : 'text-slate-400'
                }`}
              />
              <span className="font-medium text-slate-900 dark:text-white">
                {favorito ? 'Favorito' : 'Marcar como Favorito'}
              </span>
            </button>

            <button
              onClick={() => setArquivar(!arquivar)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                arquivar
                  ? 'border-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-700'
              }`}
            >
              <Archive
                className={`w-5 h-5 transition-all duration-200 ${
                  arquivar ? 'text-slate-700 dark:text-slate-300 scale-110' : 'text-slate-400'
                }`}
              />
              <span className="font-medium text-slate-900 dark:text-white">
                {arquivar ? 'Arquivado' : 'Arquivar'}
              </span>
            </button>
          </div>

          {/* Nota */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <FileText className="w-4 h-4 text-indigo-500" />
              Nota
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Adicione uma nota sobre este contato..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

