'use client';

import { Settings } from 'lucide-react';

interface ContatoCardProps {
  id: string;
  contato: string;
  contatoNome: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string | null;
  status?: 'Aberta' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechamento' | 'Perdida';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  favorito?: boolean;
  arquivar?: boolean;
  onEdit?: (e?: React.MouseEvent) => void;
  onClick?: () => void;
}

export default function ContatoCard({
  contato,
  contatoNome,
  ultimaMensagem,
  dataUltimaMensagem,
  status,
  tags,
  favorito,
  arquivar,
  onEdit,
  onClick,
}: ContatoCardProps) {
  // Pega a primeira letra do nome para o avatar
  const primeiraLetra = contatoNome
    ? contatoNome.charAt(0).toUpperCase()
    : contato.charAt(contato.length - 1); // Se não tem nome, usa último dígito do número

  // Formata a data/hora da última mensagem
  const formatarDataHora = (dataISO: string | null) => {
    if (!dataISO) return '';

    const data = new Date(dataISO);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos}m`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    
    // Mais de 7 dias, mostra data completa
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const horaFormatada = formatarDataHora(dataUltimaMensagem);
  const nomeExibido = contatoNome || contato;

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

  const corIndex = primeiraLetra.charCodeAt(0) % cores.length;
  const corAvatar = cores[corIndex];

  // Determina a cor da borda e sombra baseada nas tags (prioridade)
  const getTagColor = () => {
    if (!tags || tags.length === 0) return null;

    // Prioridade de cores (primeira tag encontrada nesta ordem)
    const tagPriority: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'> = 
      ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto'];
    
    for (const priorityTag of tagPriority) {
      if (tags.includes(priorityTag)) {
        switch (priorityTag) {
          case 'Urgente':
            return {
              border: 'border-red-400 dark:border-red-500',
              shadow: 'shadow-red-500/20 dark:shadow-red-500/30',
              glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)] dark:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
            };
          case 'Importante':
            return {
              border: 'border-orange-400 dark:border-orange-500',
              shadow: 'shadow-orange-500/20 dark:shadow-orange-500/30',
              glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)] dark:shadow-[0_0_20px_rgba(249,115,22,0.4)]',
            };
          case 'Seguimento':
            return {
              border: 'border-purple-400 dark:border-purple-500',
              shadow: 'shadow-purple-500/20 dark:shadow-purple-500/30',
              glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)] dark:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
            };
          case 'Cliente':
            return {
              border: 'border-blue-400 dark:border-blue-500',
              shadow: 'shadow-blue-500/20 dark:shadow-blue-500/30',
              glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:shadow-[0_0_20px_rgba(59,130,246,0.4)]',
            };
          case 'Prospecto':
            return {
              border: 'border-teal-400 dark:border-teal-500',
              shadow: 'shadow-teal-500/20 dark:shadow-teal-500/30',
              glow: 'shadow-[0_0_15px_rgba(20,184,166,0.3)] dark:shadow-[0_0_20px_rgba(20,184,166,0.4)]',
            };
        }
      }
    }
    return null;
  };

  const tagColor = getTagColor();
  const borderClass = tagColor 
    ? `${tagColor.border} ${tagColor.shadow} ${tagColor.glow} border-2` 
    : 'border border-slate-200 dark:border-slate-700';
  const shadowClass = tagColor 
    ? `shadow-lg ${tagColor.shadow} hover:shadow-xl` 
    : 'shadow-sm hover:shadow-md';

  // Função para obter cor e estilo do status
  const getStatusStyle = () => {
    if (!status) return null;

    const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
      'Aberta': {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30 dark:border-blue-500/50',
      },
      'Qualificação': {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/30 dark:border-purple-500/50',
      },
      'Proposta': {
        bg: 'bg-green-500/10 dark:bg-green-500/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-500/30 dark:border-green-500/50',
      },
      'Negociação': {
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-500/30 dark:border-yellow-500/50',
      },
      'Fechamento': {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30 dark:border-emerald-500/50',
      },
      'Perdida': {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-500/30 dark:border-red-500/50',
      },
    };

    return statusStyles[status] || null;
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl p-4 ${borderClass} ${shadowClass} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
    >
      {/* Box de Status no canto superior direito */}
      {status && statusStyle && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} backdrop-blur-sm shadow-sm z-10`}>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {status}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className={`${corAvatar} w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0 relative`}
        >
          {primeiraLetra}
          {favorito && (
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
            <div className="flex items-center gap-2 flex-shrink-0">
              {horaFormatada && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {horaFormatada}
                </span>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  aria-label="Editar contato"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 truncate mb-1">
            {ultimaMensagem || 'Sem mensagens'}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags && tags.length > 0 && (
              <>
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    +{tags.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Efeito hover sutil */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}

