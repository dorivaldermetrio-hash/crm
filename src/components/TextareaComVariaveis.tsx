'use client';

import { useState, useRef, useEffect } from 'react';

interface TextareaComVariaveisProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  numMsgHist?: number;
  duracaoAgendamento?: string | number;
}

export default function TextareaComVariaveis({
  value,
  onChange,
  placeholder,
  className = '',
  numMsgHist = 0,
  duracaoAgendamento = '0:00',
}: TextareaComVariaveisProps) {
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Encontra todas as ocorrências de variáveis
  const findVariables = (text: string) => {
    const variables = [
      { pattern: /\{\[PROMPT BASE\]\}/gi, key: 'PROMPT_BASE' },
      { pattern: /\{\[HISTORICO DE MENSAGENS\]\}/gi, key: 'HISTORICO' },
      { pattern: /\{\[DATAS DISPONÍVEIS\]\}/gi, key: 'DATAS' },
      { pattern: /\{\[HORARIOS DISPONIVEIS\]\}/gi, key: 'HORARIOS_DISPONIVEIS' },
      { pattern: /\{\[PRIMEIRO HORARIO DISPONIVEL\]\}/gi, key: 'PRIMEIRO_HORARIO_DISPONIVEL' },
      { pattern: /\{\[PRIMEIRO NOME\]\}/gi, key: 'PRIMEIRO_NOME' },
      { pattern: /\{\[PRODUTO DE INTERESSE\]\}/gi, key: 'PRODUTO' },
      { pattern: /\{\[ULTIMA MENSAGEM\]\}/gi, key: 'ULTIMA_MENSAGEM' },
      { pattern: /\{\[RESUMO CASO\]\}/gi, key: 'RESUMO_CASO' },
      { pattern: /\{\[INFORMAÇÕES DO CASO\]\}/gi, key: 'INFORMACOES_CASO' },
    ];

    const matches: Array<{ start: number; end: number; key: string; original: string }> = [];

    variables.forEach(({ pattern, key }) => {
      const regex = new RegExp(pattern.source, 'gi');
      let match;
      const textCopy = text; // Cria cópia para evitar problemas com lastIndex
      while ((match = regex.exec(textCopy)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          key,
          original: match[0],
        });
      }
    });

    return matches.sort((a, b) => a.start - b.start);
  };

  // Sincroniza scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;

    const syncScroll = () => {
      if (highlight) {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      }
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [value]);

  // Sincroniza estilos do overlay com o textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;

    const syncStyles = () => {
      const computedStyle = window.getComputedStyle(textarea);
      highlight.style.fontSize = computedStyle.fontSize;
      highlight.style.fontFamily = computedStyle.fontFamily;
      highlight.style.lineHeight = computedStyle.lineHeight;
      highlight.style.padding = computedStyle.padding;
      highlight.style.borderWidth = computedStyle.borderWidth;
      highlight.style.width = `${textarea.offsetWidth}px`;
      highlight.style.height = `${textarea.offsetHeight}px`;
    };

    syncStyles();
    const observer = new ResizeObserver(syncStyles);
    observer.observe(textarea);
    
    return () => {
      observer.disconnect();
    };
  }, [value]);

  // Renderiza highlights
  const renderHighlights = () => {
    if (!value) return null;

    const matches = findVariables(value);
    const parts: Array<{ text: string; isVariable: boolean; key?: string; start: number }> = [];
    let lastIndex = 0;

    matches.forEach((match) => {
      if (match.start > lastIndex) {
        parts.push({
          text: value.substring(lastIndex, match.start),
          isVariable: false,
          start: lastIndex,
        });
      }
      parts.push({
        text: match.original,
        isVariable: true,
        key: match.key,
        start: match.start,
      });
      lastIndex = match.end;
    });

    if (lastIndex < value.length) {
      parts.push({
        text: value.substring(lastIndex),
        isVariable: false,
        start: lastIndex,
      });
    }

    if (parts.length === 0) {
      return null;
    }

    return (
      <>
        {parts.map((part, index) => {
          if (part.isVariable && part.key) {
            return (
              <span
                key={index}
                className="font-bold text-blue-600 dark:text-blue-400 cursor-help"
                style={{ pointerEvents: 'auto' }}
                onMouseEnter={(e) => {
                  setHoveredVariable(part.key || null);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                  });
                }}
                onMouseLeave={() => setHoveredVariable(null)}
              >
                {part.text}
              </span>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </>
    );
  };

  const getTooltipText = (key: string): string => {
    switch (key) {
      case 'PROMPT_BASE':
        return 'Prompt base definido na "Definição Base" da coleção atendimento-ai';
      case 'HISTORICO':
        return `Histórico de mensagens definido em ${numMsgHist}`;
      case 'DATAS':
        const duracaoTexto = typeof duracaoAgendamento === 'string' 
          ? duracaoAgendamento 
          : typeof duracaoAgendamento === 'number' 
          ? `${duracaoAgendamento}:00` 
          : '0:00';
        return `Primeiros 5 horários disponíveis. Cada consulta definida em ${duracaoTexto}`;
      case 'PRODUTO':
        return 'Produto que o cliente já demonstrou interesse';
      case 'ULTIMA_MENSAGEM':
        return 'Última mensagem enviada pelo cliente';
      case 'RESUMO_CASO':
        return 'Resumo do caso do contato, armazenado na propriedade resumoCaso';
      case 'INFORMACOES_CASO':
        return 'Informações do caso do contato, armazenado na propriedade informacoesCaso';
      case 'HORARIOS_DISPONIVEIS':
        return 'Lista dos próximos horários disponíveis para agendamento, formatados como DD/MM/YYYY HH:MM';
      case 'PRIMEIRO_HORARIO_DISPONIVEL':
        return 'Apenas o primeiro horário disponível para agendamento, formatado como DD/MM/YYYY HH:MM';
      case 'PRIMEIRO_NOME':
        return 'Apenas o primeiro nome do cliente, extraído da primeira palavra da propriedade nomeCompleto';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 z-[-1] rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" />

      {/* Overlay com highlights */}
      {value && (
        <div
          ref={highlightRef}
          className="absolute inset-0 z-0 rounded-lg overflow-auto scrollbar-thin"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        >
          {renderHighlights() || <span className="text-slate-900 dark:text-white pointer-events-none">{value}</span>}
        </div>
      )}

      {/* Textarea real */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} relative z-10 min-h-[400px] p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 ${value ? 'bg-transparent text-transparent' : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white'} caret-slate-900 dark:caret-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none scrollbar-thin`}
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word', 
          overflowY: 'auto', 
          overflowX: 'hidden',
        }}
      />

      {/* Tooltip */}
      {hoveredVariable && (
        <div
          className="fixed z-50 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {getTooltipText(hoveredVariable)}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
}
