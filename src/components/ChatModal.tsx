'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Play, Pause, MoreVertical, Download, Trash2, BookOpen, UserX } from 'lucide-react';
import { HiInformationCircle } from 'react-icons/hi';
import { HiOutlineQueueList, HiOutlineCog6Tooth } from 'react-icons/hi2';
import { FiBarChart2 } from 'react-icons/fi';
import { RiRobotLine } from 'react-icons/ri';
import { useServerEvents, ServerEvent } from '@/hooks/useServerEvents';

interface Mensagem {
  id: string;
  mensagemWhatsAppId: string;
  mensagem: string;
  dataHora: string;
  tipo: string;
  contatoID: string;
  midiaId?: string;
  midiaUrl?: string;
  midiaNome?: string;
  midiaTamanho?: number;
  midiaMimeType?: string;
  transcricao?: string;
}

interface Contato {
  id: string;
  contato: string;
  contatoNome: string;
  ultimaMensagem?: string;
  dataUltimaMensagem?: Date | string | null;
  status?: 'Novo Contato' | 'Triagem em Andamento' | 'Triagem Jurídica Concluída' | 'Caso Urgente' | 'Encaminhado para Atendimento Humano' | 'Não é caso Jurídico';
  tags?: Array<'Urgente' | 'Importante' | 'Seguimento' | 'Cliente' | 'Prospecto'>;
  nota?: string;
  favorito?: boolean;
  arquivar?: boolean;
  produtoInteresse?: string;
  informacoesCaso?: string;
  inicialConcluido?: boolean;
  atendimentoIa?: boolean;
  saudacao?: boolean;
  pedidoResumo?: boolean;
  confirmacaoResumo?: boolean;
  urgenciaDefinida?: boolean;
  selecionandoData?: boolean;
  propostaAgendamento?: boolean;
  confirmaAgendamento?: boolean;
}

interface ChatModalProps {
  contatoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ contatoId, isOpen, onClose }: ChatModalProps) {
  const [contato, setContato] = useState<Contato | null>(null);
  const [contatoCompleto, setContatoCompleto] = useState<Contato | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [painelInfoAberto, setPainelInfoAberto] = useState(false);
  const [painelAnalyticsAberto, setPainelAnalyticsAberto] = useState(false);
  const [painelIAAberto, setPainelIAAberto] = useState(false);
  const [painelNotasAberto, setPainelNotasAberto] = useState(false);
  const [painelConfiguracaoAberto, setPainelConfiguracaoAberto] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [modalDeletarContatoAberto, setModalDeletarContatoAberto] = useState(false);
  const [deletandoContato, setDeletandoContato] = useState(false);
  const [audioStates, setAudioStates] = useState<{ [key: string]: { playing: boolean; currentTime: number; duration: number } }>({});
  const [audioMenuOpen, setAudioMenuOpen] = useState<{ [key: string]: boolean }>({});
  const [imageMenuOpen, setImageMenuOpen] = useState<{ [key: string]: boolean }>({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: string; nome: string; conteudo: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const imageMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const templatesBoxRef = useRef<HTMLDivElement>(null);

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && contatoId) {
      fetchMensagens();
      fetchContatoCompleto();
      // Foca no input quando o modal abre
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Limpa dados quando fecha
      setContato(null);
      setContatoCompleto(null);
      setMensagens([]);
      setNovaMensagem('');
      setError(null);
      setPainelInfoAberto(false);
      setPainelAnalyticsAberto(false);
      setPainelIAAberto(false);
      setPainelNotasAberto(false);
      setPainelConfiguracaoAberto(false);
      setModalDeletarAberto(false);
      setModalDeletarContatoAberto(false);
    }
  }, [isOpen, contatoId]);

  // Conecta ao Server-Sent Events para atualizar quando recebe nova mensagem
  useServerEvents({
    enabled: isOpen && !!contatoId, // Só conecta se o modal estiver aberto
    onNovaMensagem: (event: ServerEvent) => {
      // Só atualiza se a mensagem for do contato atual
      if (event.contatoId === contatoId) {
        console.log('📨 Nova mensagem recebida no modal:', event);
        fetchMensagens(true); // true = atualização silenciosa (sem loading)
      }
    },
    onMensagemEnviada: (event: ServerEvent) => {
      // Só atualiza se a mensagem for do contato atual
      if (event.contatoId === contatoId) {
        console.log('📤 Mensagem enviada no modal:', event);
        fetchMensagens(true); // true = atualização silenciosa (sem loading)
      }
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const fetchMensagens = async (silent = false) => {
    if (!contatoId) return;

    try {
      // Só mostra loading se não for uma atualização silenciosa
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/contatos/${contatoId}/mensagens`);
      const data = await response.json();

      if (data.success) {
        setContato(data.contato);
        const mensagensData = data.mensagens || [];
        setMensagens(mensagensData);
        
        // Debug: verifica mensagens com mídia
        const mensagensComMidia = mensagensData.filter((m: Mensagem) => m.tipo === 'imagem' || m.midiaId);
        if (mensagensComMidia.length > 0) {
          console.log('📸 Mensagens com mídia encontradas:', mensagensComMidia.length);
          mensagensComMidia.forEach((m: Mensagem) => {
            console.log('  - Tipo:', m.tipo, '| midiaId:', m.midiaId || 'NÃO DEFINIDO', '| mensagem:', m.mensagem);
          });
        }

        // Debug: verifica mensagens de áudio com transcrição
        const mensagensAudio = mensagensData.filter((m: Mensagem) => m.tipo === 'audio');
        if (mensagensAudio.length > 0) {
          console.log('🎤 Mensagens de áudio encontradas:', mensagensAudio.length);
          mensagensAudio.forEach((m: Mensagem) => {
            console.log('  - ID:', m.id, '| Tipo:', m.tipo, '| Transcrição:', m.transcricao ? `"${m.transcricao.substring(0, 50)}..."` : 'NÃO DEFINIDA');
          });
        }
      } else {
        // Só mostra erro se não for silencioso
        if (!silent) {
          setError(data.error || 'Erro ao carregar mensagens');
        }
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      // Só mostra erro se não for silencioso
      if (!silent) {
        setError('Erro ao conectar com o servidor');
      }
    } finally {
      // Só desativa loading se não for silencioso
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchContatoCompleto = async () => {
    if (!contatoId) return;

    try {
      const response = await fetch(`/api/contatos`);
      const data = await response.json();

      if (data.success) {
        const contatoEncontrado = data.contatos.find((c: Contato) => c.id === contatoId);
        if (contatoEncontrado) {
          setContatoCompleto(contatoEncontrado);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar contato completo:', err);
    }
  };

  const deletarHistorico = async () => {
    if (!contatoId) return;

    try {
      setDeletando(true);
      const response = await fetch(`/api/contatos/${contatoId}/mensagens`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Limpa as mensagens do estado
        setMensagens([]);
        // Atualiza o contato para refletir que não há mais mensagens
        if (contato) {
          setContato({
            ...contato,
            ultimaMensagem: '',
            dataUltimaMensagem: null,
          });
        }
        // Fecha o modal de confirmação
        setModalDeletarAberto(false);
        console.log('✅ Histórico deletado com sucesso');
      } else {
        alert('Erro ao deletar histórico: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao deletar histórico:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setDeletando(false);
    }
  };

  const deletarContatoEConversa = async () => {
    if (!contatoId) return;

    try {
      setDeletandoContato(true);
      const response = await fetch(`/api/contatos/${contatoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Contato e conversa deletados com sucesso');
        // Fecha o modal de confirmação
        setModalDeletarContatoAberto(false);
        // Fecha o modal do chat e atualiza a lista de contatos
        onClose();
        // Emite evento para atualizar a lista de contatos na página pai
        window.dispatchEvent(new CustomEvent('contatoDeletado'));
      } else {
        alert('Erro ao deletar contato: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao deletar contato:', err);
      alert('Erro ao conectar com o servidor');
    } finally {
      setDeletandoContato(false);
    }
  };

  const salvarContato = async (dadosAtualizados: Partial<Contato>) => {
    if (!contatoId) return;

    try {
      const response = await fetch(`/api/contatos/${contatoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosAtualizados),
      });

      const data = await response.json();

      if (data.success) {
        setContatoCompleto(data.contato);
        // Atualiza também o contato básico se necessário
        if (data.contato.contatoNome) {
          setContato((prev) => prev ? { ...prev, contatoNome: data.contato.contatoNome } : null);
        }
      } else {
        alert(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contatoId || !novaMensagem.trim() || enviando) return;

    const mensagemTexto = novaMensagem.trim();
    setNovaMensagem('');
    setEnviando(true);

    try {
      const response = await fetch(`/api/contatos/${contatoId}/mensagens/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: mensagemTexto }),
      });

      const data = await response.json();

      if (data.success) {
        // Adiciona a nova mensagem à lista
        setMensagens((prev) => [...prev, data.mensagem]);
        // Recarrega as mensagens para garantir sincronização (silenciosamente)
        setTimeout(() => fetchMensagens(true), 500);
      } else {
        setError(data.error || 'Erro ao enviar mensagem');
        setNovaMensagem(mensagemTexto); // Restaura a mensagem em caso de erro
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao conectar com o servidor');
      setNovaMensagem(mensagemTexto);
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const formatarHora = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarTempoAudio = (segundos: number) => {
    if (isNaN(segundos) || !isFinite(segundos)) return '0:00';
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = (msgId: string, audioUrl: string) => {
    const audio = audioRefs.current[msgId];
    if (!audio) return;

    const currentState = audioStates[msgId] || { playing: false, currentTime: 0, duration: 0 };

    if (currentState.playing) {
      audio.pause();
      setAudioStates(prev => ({
        ...prev,
        [msgId]: { ...currentState, playing: false }
      }));
    } else {
      audio.play();
      setAudioStates(prev => ({
        ...prev,
        [msgId]: { ...currentState, playing: true }
      }));
    }
  };

  const handleAudioTimeUpdate = (msgId: string) => {
    const audio = audioRefs.current[msgId];
    if (!audio) return;

    setAudioStates(prev => ({
      ...prev,
      [msgId]: {
        playing: !audio.paused,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }
    }));
  };

  const handleAudioLoadedMetadata = (msgId: string) => {
    const audio = audioRefs.current[msgId];
    if (!audio) return;

    setAudioStates(prev => ({
      ...prev,
      [msgId]: {
        playing: false,
        currentTime: 0,
        duration: audio.duration || 0
      }
    }));
  };

  const handleAudioEnded = (msgId: string) => {
    setAudioStates(prev => ({
      ...prev,
      [msgId]: {
        playing: false,
        currentTime: 0,
        duration: prev[msgId]?.duration || 0
      }
    }));
  };

  const handleSeekAudio = (msgId: string, newTime: number) => {
    const audio = audioRefs.current[msgId];
    if (!audio) return;

    audio.currentTime = newTime;
    setAudioStates(prev => ({
      ...prev,
      [msgId]: {
        ...prev[msgId],
        currentTime: newTime
      }
    }));
  };

  const toggleAudioMenu = (msgId: string) => {
    setAudioMenuOpen(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const downloadAudio = async (msgId: string, midiaId: string, midiaNome?: string) => {
    try {
      const audioUrl = `/api/mensagens/${midiaId}/midia`;
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar áudio');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = midiaNome || `audio_${midiaId}.ogg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setAudioMenuOpen(prev => ({
        ...prev,
        [msgId]: false
      }));
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
      alert('Erro ao baixar áudio. Tente novamente.');
    }
  };

  const toggleImageMenu = (msgId: string) => {
    setImageMenuOpen(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const downloadImage = async (msgId: string, midiaId: string, midiaNome?: string) => {
    try {
      const imageUrl = `/api/mensagens/${midiaId}/midia`;
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar imagem');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Determina a extensão baseada no tipo MIME ou usa o nome do arquivo
      let filename = midiaNome || `imagem_${midiaId}`;
      if (!filename.includes('.')) {
        // Se não tiver extensão, tenta inferir do blob
        const mimeType = blob.type;
        const extension = mimeType.split('/')[1] || 'jpg';
        filename = `${filename}.${extension}`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setImageMenuOpen(prev => ({
        ...prev,
        [msgId]: false
      }));
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      alert('Erro ao baixar imagem. Tente novamente.');
    }
  };

  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      // Altura de uma linha (aproximadamente 24px) + padding (24px total)
      const lineHeight = 24;
      const maxHeight = lineHeight * 4 + 24; // 4 linhas + padding
      const newHeight = Math.min(scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [novaMensagem]);

  // Buscar templates quando abrir a box
  useEffect(() => {
    if (templatesOpen && templates.length === 0) {
      fetchTemplates();
    }
  }, [templatesOpen]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await fetch('/api/templates-ws');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fecha box de templates
      if (templatesBoxRef.current && !templatesBoxRef.current.contains(event.target as Node)) {
        setTemplatesOpen(false);
      }
      // Fecha menus de áudio
      Object.keys(audioMenuOpen).forEach(msgId => {
        if (audioMenuOpen[msgId] && menuRefs.current[msgId]) {
          if (!menuRefs.current[msgId]?.contains(event.target as Node)) {
            setAudioMenuOpen(prev => ({
              ...prev,
              [msgId]: false
            }));
          }
        }
      });
      
      // Fecha menus de imagem
      Object.keys(imageMenuOpen).forEach(msgId => {
        if (imageMenuOpen[msgId] && imageMenuRefs.current[msgId]) {
          if (!imageMenuRefs.current[msgId]?.contains(event.target as Node)) {
            setImageMenuOpen(prev => ({
              ...prev,
              [msgId]: false
            }));
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [audioMenuOpen, imageMenuOpen, templatesOpen]);

  const primeiraLetra = contato?.contatoNome
    ? contato.contatoNome.charAt(0).toUpperCase()
    : contato?.contato
    ? contato.contato.charAt(contato.contato.length - 1)
    : '?';

  // Debug: monitora mudanças no estado do modal
  useEffect(() => {
    console.log('🔍 Estado do modalDeletarAberto:', modalDeletarAberto);
  }, [modalDeletarAberto]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white dark:bg-slate-800 rounded-none sm:rounded-2xl shadow-2xl h-full sm:h-[90vh] flex flex-col overflow-hidden transition-all duration-300 w-full ${
        painelInfoAberto || painelAnalyticsAberto || painelIAAberto || painelNotasAberto || painelConfiguracaoAberto ? 'sm:max-w-7xl' : 'sm:max-w-4xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-lg flex-shrink-0">
              {primeiraLetra}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                {contato?.contatoNome || contato?.contato || 'Carregando...'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                {contato?.contato}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => {
                // Se o painel Configuração já está aberto, fecha ele
                if (painelConfiguracaoAberto) {
                  setPainelConfiguracaoAberto(false);
                } else {
                  // Se não está aberto, fecha os outros painéis (se estiverem abertos) e abre o Configuração
                  setPainelInfoAberto(false);
                  setPainelAnalyticsAberto(false);
                  setPainelIAAberto(false);
                  setPainelNotasAberto(false);
                  setPainelConfiguracaoAberto(true);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                painelConfiguracaoAberto
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label="Configurações"
            >
              <HiOutlineCog6Tooth className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                // Se o painel Notas já está aberto, fecha ele
                if (painelNotasAberto) {
                  setPainelNotasAberto(false);
                } else {
                  // Se não está aberto, fecha os outros painéis (se estiverem abertos) e abre o Notas
                  setPainelInfoAberto(false);
                  setPainelAnalyticsAberto(false);
                  setPainelIAAberto(false);
                  setPainelConfiguracaoAberto(false);
                  setPainelNotasAberto(true);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                painelNotasAberto
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label="Notas do caso"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                // Se o painel IA já está aberto, fecha ele
                if (painelIAAberto) {
                  setPainelIAAberto(false);
                } else {
                  // Se não está aberto, fecha os outros painéis (se estiverem abertos) e abre o IA
                  setPainelInfoAberto(false);
                  setPainelAnalyticsAberto(false);
                  setPainelNotasAberto(false);
                  setPainelConfiguracaoAberto(false);
                  setPainelIAAberto(true);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                painelIAAberto
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label="Resumo da conversa"
            >
              <RiRobotLine className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                // Se o painel Analytics já está aberto, fecha ele
                if (painelAnalyticsAberto) {
                  setPainelAnalyticsAberto(false);
                } else {
                  // Se não está aberto, fecha os outros painéis (se estiverem abertos) e abre o Analytics
                  setPainelInfoAberto(false);
                  setPainelIAAberto(false);
                  setPainelNotasAberto(false);
                  setPainelConfiguracaoAberto(false);
                  setPainelAnalyticsAberto(true);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                painelAnalyticsAberto
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label="Analytics"
            >
              <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => {
                // Se o painel Info já está aberto, fecha ele
                if (painelInfoAberto) {
                  setPainelInfoAberto(false);
                } else {
                  // Se não está aberto, fecha os outros painéis (se estiverem abertos) e abre o Info
                  setPainelAnalyticsAberto(false);
                  setPainelIAAberto(false);
                  setPainelNotasAberto(false);
                  setPainelConfiguracaoAberto(false);
                  setPainelInfoAberto(true);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                painelInfoAberto
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-label="Informações do contato"
            >
              <HiInformationCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Botão de lixeira clicado, abrindo modal...');
                setModalDeletarAberto(true);
                console.log('✅ setModalDeletarAberto(true) chamado');
              }}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
              aria-label="Deletar histórico de conversa"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModalDeletarContatoAberto(true);
              }}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
              aria-label="Deletar contato e conversa"
            >
              <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Chat Area */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${
            painelInfoAberto || painelAnalyticsAberto || painelIAAberto || painelNotasAberto || painelConfiguracaoAberto 
              ? 'hidden sm:flex sm:w-2/3' 
              : 'w-full'
          }`}>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-elegant">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Carregando mensagens...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              <button
                onClick={() => fetchMensagens()}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-slate-600 dark:text-slate-400">
                  Nenhuma mensagem ainda
                </p>
              </div>
            </div>
          ) : (
            mensagens.map((msg) => {
              // Mensagem do sistema tem contatoID === "1"
              // Mensagem do cliente tem contatoID igual ao _id do contato
              // Se contatoID não for "1", então é mensagem do contato
              const isSistema = msg.contatoID === '1';
              
              return (
                <div
                  key={msg.id || msg.mensagemWhatsAppId}
                  className={`flex ${isSistema ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      isSistema
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {/* Renderiza mídia se houver */}
                    {(msg.midiaId || msg.tipo === 'imagem' || msg.tipo === 'audio' || msg.tipo === 'video' || msg.tipo === 'documento') && (
                      <div className="mb-2">
                        {msg.tipo === 'imagem' && (
                          <div className="relative group w-[300px] h-[450px] rounded-lg overflow-hidden shadow-md">
                            {msg.midiaId ? (
                              <>
                                <img
                                  src={`/api/mensagens/${msg.midiaId}/midia`}
                                  alt={msg.mensagem || 'Imagem'}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                  onClick={() => setImagemAmpliada(`/api/mensagens/${msg.midiaId}/midia`)}
                                  onError={(e) => {
                                    console.error('❌ Erro ao carregar imagem. midiaId:', msg.midiaId);
                                    console.error('   URL tentada:', `/api/mensagens/${msg.midiaId}/midia`);
                                    e.currentTarget.style.display = 'none';
                                    // Mostra placeholder em caso de erro
                                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (placeholder) {
                                      placeholder.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                    Clique para ampliar
                                  </span>
                                </div>
                                
                                {/* Botão Menu (3 pontinhos) */}
                                <div className="absolute top-2 right-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleImageMenu(msg.id);
                                    }}
                                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
                                    aria-label="Mais opções"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Menu Dropdown */}
                                  {imageMenuOpen[msg.id] && (
                                    <div
                                      ref={(el) => {
                                        if (el) imageMenuRefs.current[msg.id] = el;
                                      }}
                                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadImage(msg.id, msg.midiaId!, msg.midiaNome);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Baixar imagem</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600">
                                <div className="text-center">
                                  <span className="text-4xl mb-2 block">🖼️</span>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Imagem não disponível
                                  </p>
                                  {msg.midiaUrl && (
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                      URL: {msg.midiaUrl.substring(0, 50)}...
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    Debug: tipo={msg.tipo}, midiaId={msg.midiaId || 'não definido'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.tipo === 'audio' && (
                          <div className={`rounded-2xl p-4 w-[300px] ${
                            isSistema 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                              : 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600'
                          }`}>
                            {msg.midiaId ? (
                              <>
                                <audio
                                  ref={(el) => {
                                    if (el) audioRefs.current[msg.id] = el;
                                  }}
                                  preload="metadata"
                                  onTimeUpdate={() => handleAudioTimeUpdate(msg.id)}
                                  onLoadedMetadata={() => handleAudioLoadedMetadata(msg.id)}
                                  onEnded={() => handleAudioEnded(msg.id)}
                                  onError={(e) => {
                                    console.error('❌ Erro ao carregar áudio. midiaId:', msg.midiaId);
                                    console.error('URL tentada:', `/api/mensagens/${msg.midiaId}/midia`);
                                  }}
                                >
                                  <source
                                    src={`/api/mensagens/${msg.midiaId}/midia`}
                                    type={msg.midiaMimeType || 'audio/ogg'}
                                  />
                                </audio>
                                <div className="flex items-center gap-3">
                                  {/* Botão Play/Pause */}
                                  <button
                                    onClick={() => toggleAudio(msg.id, `/api/mensagens/${msg.midiaId}/midia`)}
                                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-110 active:scale-95 ${
                                      isSistema
                                        ? 'bg-white/25 hover:bg-white/35 text-white'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 shadow-md'
                                    }`}
                                    aria-label={audioStates[msg.id]?.playing ? 'Pausar' : 'Reproduzir'}
                                  >
                                    {audioStates[msg.id]?.playing ? (
                                      <Pause className="w-6 h-6 ml-0.5" />
                                    ) : (
                                      <Play className="w-6 h-6 ml-0.5" />
                                    )}
                                  </button>

                                  {/* Barra de Progresso e Tempo */}
                                  <div className="flex-1 min-w-0">
                                    {/* Tempo */}
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-xs font-semibold tabular-nums ${
                                        isSistema ? 'text-white/95' : 'text-slate-700 dark:text-slate-200'
                                      }`}>
                                        {formatarTempoAudio(audioStates[msg.id]?.currentTime || 0)}
                                      </span>
                                      <span className={`text-xs font-semibold tabular-nums ${
                                        isSistema ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'
                                      }`}>
                                        {formatarTempoAudio(audioStates[msg.id]?.duration || 0)}
                                      </span>
                                    </div>
                                    
                                    {/* Barra de Progresso */}
                                    <div 
                                      className={`relative h-2.5 rounded-full overflow-visible cursor-pointer group ${
                                        isSistema ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'
                                      }`}
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        if (rect && audioStates[msg.id]?.duration) {
                                          const clickX = e.clientX - rect.left;
                                          const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                                          const newTime = percentage * audioStates[msg.id].duration;
                                          handleSeekAudio(msg.id, newTime);
                                        }
                                      }}
                                    >
                                      {/* Barra preenchida */}
                                      <div
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-150 ease-out ${
                                          isSistema
                                            ? 'bg-white'
                                            : 'bg-slate-600 dark:bg-slate-400'
                                        }`}
                                        style={{
                                          width: `${audioStates[msg.id]?.duration 
                                            ? Math.min(100, (audioStates[msg.id].currentTime / audioStates[msg.id].duration) * 100)
                                            : 0}%`
                                        }}
                                      />
                                      {/* Indicador de posição (bolinha) - mais visível */}
                                      {audioStates[msg.id]?.duration && audioStates[msg.id].duration > 0 && (
                                        <div
                                          className={`absolute top-1/2 w-4 h-4 rounded-full transition-all duration-150 ease-out ${
                                            isSistema
                                              ? 'bg-white shadow-lg border-2 border-blue-500/50'
                                              : 'bg-slate-700 dark:bg-slate-300 shadow-lg border-2 border-slate-400/50'
                                          } group-hover:scale-125`}
                                          style={{
                                            left: `${Math.min(100, (audioStates[msg.id].currentTime / audioStates[msg.id].duration) * 100)}%`,
                                            transform: `translate(-50%, -50%)`
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Botão Menu (3 pontinhos) */}
                                  <div className="relative flex-shrink-0">
                                    <button
                                      onClick={() => toggleAudioMenu(msg.id)}
                                      className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                                        isSistema
                                          ? 'text-white/80 hover:text-white hover:bg-white/20'
                                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                      }`}
                                      aria-label="Mais opções"
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {/* Menu Dropdown */}
                                    {audioMenuOpen[msg.id] && (
                                      <div
                                        ref={(el) => {
                                          if (el) menuRefs.current[msg.id] = el;
                                        }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
                                      >
                                        <button
                                          onClick={() => downloadAudio(msg.id, msg.midiaId!, msg.midiaNome)}
                                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                                        >
                                          <Download className="w-4 h-4" />
                                          <span>Baixar áudio</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Transcrição do áudio */}
                                {msg.transcricao && (
                                  <div className={`mt-3 pt-3 border-t ${
                                    isSistema
                                      ? 'border-white/20'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}>
                                    <p className={`text-sm ${
                                      isSistema
                                        ? 'text-white/90'
                                        : 'text-slate-700 dark:text-slate-200'
                                    }`}>
                                      <span className="font-semibold">Transcrição: </span>
                                      {msg.transcricao}
                                    </p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  isSistema
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                  <Play className="w-5 h-5 ml-0.5" />
                                </div>
                                <div className="text-sm text-slate-400 dark:text-slate-500 italic">
                                  Áudio não disponível
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.tipo === 'video' && (
                          <video
                            controls
                            className="max-w-full h-auto rounded-lg shadow-md"
                            preload="metadata"
                          >
                            <source
                              src={`/api/mensagens/${msg.midiaId}/midia`}
                              type={msg.midiaMimeType || 'video/mp4'}
                            />
                            Seu navegador não suporta o elemento de vídeo.
                          </video>
                        )}
                        {msg.tipo === 'documento' && (
                          <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-600 rounded-lg">
                            <span className="text-2xl">📄</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{msg.midiaNome || 'Documento'}</p>
                              {msg.midiaTamanho && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {(msg.midiaTamanho / 1024).toFixed(2)} KB
                                </p>
                              )}
                            </div>
                            <a
                              href={`/api/mensagens/${msg.midiaId}/midia`}
                              download={msg.midiaNome}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Baixar
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Renderiza texto da mensagem se houver (só mostra se não for apenas placeholder) */}
                    {msg.mensagem && 
                     msg.mensagem !== '[Imagem]' && 
                     msg.mensagem !== '[Áudio]' && 
                     msg.mensagem !== '[Vídeo]' && 
                     msg.mensagem !== '[Documento]' && (
                      <p className="text-sm sm:text-base break-words mt-2">{msg.mensagem}</p>
                    )}
                    
                    <p
                      className={`text-xs mt-1 ${
                        isSistema
                          ? 'text-blue-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {formatarHora(msg.dataHora)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={enviarMensagem} className="p-3 sm:p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative">
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              ref={inputRef}
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem(e);
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all overflow-y-auto scrollbar-thin"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={enviando}
            />
            {/* Botão de Templates */}
            <button
              type="button"
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="p-2 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
              aria-label="Templates"
            >
              <HiOutlineQueueList className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="submit"
              disabled={!novaMensagem.trim() || enviando}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm sm:text-base font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex-shrink-0"
            >
              {enviando ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="hidden sm:inline">Enviar</span>
              )}
            </button>
          </div>

          {/* Box de Templates */}
          {templatesOpen && (
            <div
              ref={templatesBoxRef}
              className="absolute bottom-full right-0 mb-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm max-h-96 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Templates
                </h3>
              </div>

              {/* Lista de Templates */}
              <div className="overflow-y-auto max-h-80 scrollbar-elegant">
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Carregando...</p>
                    </div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum template encontrado
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => {
                          setNovaMensagem(template.conteudo);
                          setTemplatesOpen(false);
                          // Foca no textarea após preencher
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                        className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer mb-1 active:scale-[0.98]"
                      >
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                          {template.nome}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {template.conteudo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
          </div>

          {/* Painel de Informações */}
          <div className={`sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 overflow-hidden ${
            painelInfoAberto 
              ? 'absolute sm:relative inset-0 sm:inset-auto w-full sm:w-1/3 opacity-100 z-10' 
              : 'w-0 opacity-0 pointer-events-none'
          }`}>
            {painelInfoAberto && contatoCompleto && (
              <PainelInformacoes
                contato={contatoCompleto}
                onSave={salvarContato}
                onUpdate={fetchContatoCompleto}
                onClose={() => setPainelInfoAberto(false)}
              />
            )}
          </div>

          {/* Painel de Analytics */}
          <div className={`sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 overflow-hidden ${
            painelAnalyticsAberto 
              ? 'absolute sm:relative inset-0 sm:inset-auto w-full sm:w-1/3 opacity-100 z-10' 
              : 'w-0 opacity-0 pointer-events-none'
          }`}>
            {painelAnalyticsAberto && mensagens.length > 0 && (
              <PainelAnalytics
                mensagens={mensagens}
                contato={contato}
                onClose={() => setPainelAnalyticsAberto(false)}
              />
            )}
          </div>

          {/* Painel de IA (Resumo da Conversa) */}
          <div className={`sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 overflow-hidden ${
            painelIAAberto 
              ? 'absolute sm:relative inset-0 sm:inset-auto w-full sm:w-1/3 opacity-100 z-10' 
              : 'w-0 opacity-0 pointer-events-none'
          }`}>
            {painelIAAberto && (
              <PainelIA 
                contatoId={contatoId}
                onClose={() => setPainelIAAberto(false)}
              />
            )}
          </div>

          {/* Painel de Notas */}
          <div className={`sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 overflow-hidden ${
            painelNotasAberto 
              ? 'absolute sm:relative inset-0 sm:inset-auto w-full sm:w-1/3 opacity-100 z-10' 
              : 'w-0 opacity-0 pointer-events-none'
          }`}>
            {painelNotasAberto && contatoCompleto && (
              <PainelNotas
                contato={contatoCompleto}
                onSave={salvarContato}
                onUpdate={fetchContatoCompleto}
                onClose={() => setPainelNotasAberto(false)}
              />
            )}
          </div>

          {/* Painel de Configuração */}
          <div className={`sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 overflow-hidden ${
            painelConfiguracaoAberto 
              ? 'absolute sm:relative inset-0 sm:inset-auto w-full sm:w-1/3 opacity-100 z-10' 
              : 'w-0 opacity-0 pointer-events-none'
          }`}>
            {painelConfiguracaoAberto && contatoCompleto && (
              <PainelConfiguracao
                contato={contatoCompleto}
                onSave={salvarContato}
                onUpdate={fetchContatoCompleto}
                onClose={() => setPainelConfiguracaoAberto(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal de Imagem Ampliada */}
      {imagemAmpliada && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImagemAmpliada(null)}
        >
          <button
            onClick={() => setImagemAmpliada(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={imagemAmpliada}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Histórico */}
      {modalDeletarAberto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Fecha o modal se clicar no overlay
            if (e.target === e.currentTarget) {
              setModalDeletarAberto(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Excluir Histórico
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Deseja mesmo excluir o histórico de conversa com <strong>{contato?.contatoNome || contato?.contato || 'este contato'}</strong>?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setModalDeletarAberto(false)}
                  disabled={deletando}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={deletarHistorico}
                  disabled={deletando}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Contato e Conversa */}
      {modalDeletarContatoAberto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Fecha o modal se clicar no overlay
            if (e.target === e.currentTarget) {
              setModalDeletarContatoAberto(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Excluir Contato e Conversa
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                Tem certeza que deseja excluir o contato <strong>{contato?.contatoNome || contato?.contato || 'este contato'}</strong> e toda a conversa? Esta ação é permanente e não pode ser desfeita.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setModalDeletarContatoAberto(false)}
                  disabled={deletandoContato}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={deletarContatoEConversa}
                  disabled={deletandoContato}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletandoContato ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Excluir Contato
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// Componente do Painel de Informações
interface PainelInformacoesProps {
  contato: Contato;
  onSave: (dados: Partial<Contato>) => Promise<void>;
  onUpdate: () => void;
  onClose: () => void;
}

function PainelInformacoes({ contato, onSave, onUpdate, onClose }: PainelInformacoesProps) {
  const [status, setStatus] = useState<Contato['status']>('Novo Contato');
  const [tags, setTags] = useState<Contato['tags']>([]);
  const [nota, setNota] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [arquivar, setArquivar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (contato) {
      setStatus(contato.status || 'Novo Contato');
      setTags(contato.tags || []);
      setNota(contato.nota || '');
      setFavorito(contato.favorito || false);
      setArquivar(contato.arquivar || false);
    }
  }, [contato]);

  const toggleTag = (tag: NonNullable<Contato['tags']>[number]) => {
    setTags((prev) => {
      if (prev?.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...(prev || []), tag];
      }
    });
  };

  const handleSalvar = async () => {
    if (salvando) return;

    setSalvando(true);
    try {
      await onSave({
        status,
        tags,
        nota,
        favorito,
        arquivar,
      });
      setEditando(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  };

  // Função para obter cor do status (mesmo padrão da página de Automações)
  const getStatusColor = (statusValue: Contato['status']) => {
    const statusColors: Record<string, { selected: string; text: string }> = {
      'Novo Contato': {
        selected: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
        text: 'text-blue-600 dark:text-blue-400',
      },
      'Triagem em Andamento': {
        selected: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
        text: 'text-purple-600 dark:text-purple-400',
      },
      'Triagem Jurídica Concluída': {
        selected: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30',
        text: 'text-green-600 dark:text-green-400',
      },
      'Caso Urgente': {
        selected: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
        text: 'text-red-600 dark:text-red-400',
      },
      'Encaminhado para Atendimento Humano': {
        selected: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30',
        text: 'text-yellow-600 dark:text-yellow-400',
      },
      'Não é caso Jurídico': {
        selected: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30',
        text: 'text-gray-600 dark:text-gray-400',
      },
    };
    return statusColors[statusValue || 'Novo Contato'] || statusColors['Novo Contato'];
  };

  const statusOptions: Array<{ value: Contato['status']; label: string }> = [
    { value: 'Novo Contato', label: 'Novo Contato' },
    { value: 'Triagem em Andamento', label: 'Triagem em Andamento' },
    { value: 'Triagem Jurídica Concluída', label: 'Triagem Jurídica Concluída' },
    { value: 'Caso Urgente', label: 'Caso Urgente' },
    { value: 'Encaminhado para Atendimento Humano', label: 'Encaminhado para Atendimento Humano' },
    { value: 'Não é caso Jurídico', label: 'Não é caso Jurídico' },
  ];

  const tagOptions: Array<{ value: NonNullable<Contato['tags']>[number]; label: string; color: string }> = [
    { value: 'Urgente', label: 'Urgente', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    { value: 'Importante', label: 'Importante', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    { value: 'Seguimento', label: 'Seguimento', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    { value: 'Cliente', label: 'Cliente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'Prospecto', label: 'Prospecto', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
  ];

  const primeiraLetra = contato.contatoNome
    ? contato.contatoNome.charAt(0).toUpperCase()
    : contato.contato.charAt(contato.contato.length - 1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header do Painel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex-1 min-w-0">
            Informações do Contato
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!editando ? (
              <button
                onClick={() => setEditando(true)}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="hidden sm:inline">Editar</span>
                <span className="sm:hidden">Editar</span>
              </button>
            ) : (
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setEditando(false);
                    // Restaura valores originais
                    setStatus(contato.status || 'Novo Contato');
                    setTags(contato.tags || []);
                    setNota(contato.nota || '');
                    setFavorito(contato.favorito || false);
                    setArquivar(contato.arquivar || false);
                  }}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="hidden sm:inline">Cancelar</span>
                  <span className="sm:hidden">Cancelar</span>
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0"
              aria-label="Fechar painel"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
            {primeiraLetra}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {contato.contatoNome || contato.contato}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {contato.contato}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-elegant">
        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Status
          </label>
          {editando ? (
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => {
                const statusColor = getStatusColor(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
          ) : (
            <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <span className={`text-sm font-medium ${getStatusColor(status || 'Novo Contato').text}`}>
                {status || 'Novo Contato'}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Tags
          </label>
          {editando ? (
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((option) => {
                const isSelected = tags?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleTag(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? `${option.color} ring-2 ring-offset-2 ring-current`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {option.label}
                    {isSelected && ' ✓'}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags && tags.length > 0 ? (
                tags.map((tag) => {
                  const tagOption = tagOptions.find((o) => o.value === tag);
                  return (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        tagOption?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tag}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">Nenhuma tag</span>
              )}
            </div>
          )}
        </div>

        {/* Favorito e Arquivar */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => editando && setFavorito(!favorito)}
            disabled={!editando}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              favorito
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-slate-200 dark:border-slate-700'
            } ${!editando ? 'cursor-default' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
            <span className={`text-xl ${favorito ? 'text-yellow-400' : 'text-slate-400'}`}>
              ⭐
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {favorito ? 'Favorito' : 'Favoritar'}
            </span>
          </button>

          <button
            onClick={() => editando && setArquivar(!arquivar)}
            disabled={!editando}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              arquivar
                ? 'border-slate-400 bg-slate-100 dark:bg-slate-700'
                : 'border-slate-200 dark:border-slate-700'
            } ${!editando ? 'cursor-default' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
            <span className={`text-xl ${arquivar ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
              📁
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {arquivar ? 'Arquivado' : 'Arquivar'}
            </span>
          </button>
        </div>

        {/* Nota */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Nota
          </label>
          {editando ? (
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Adicione uma nota sobre este contato..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          ) : (
            <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 min-h-[100px]">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {nota || 'Nenhuma nota adicionada'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente do Painel de Analytics
interface PainelAnalyticsProps {
  mensagens: Mensagem[];
  contato: Contato | null;
  onClose: () => void;
}

function PainelAnalytics({ mensagens, contato, onClose }: PainelAnalyticsProps) {
  // Importação dinâmica do recharts para evitar problemas de SSR
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [ChartComponents, setChartComponents] = useState<any>(null);

  useEffect(() => {
    import('recharts').then((module) => {
      setChartComponents({
        BarChart: module.BarChart,
        Bar: module.Bar,
        XAxis: module.XAxis,
        YAxis: module.YAxis,
        CartesianGrid: module.CartesianGrid,
        Tooltip: module.Tooltip,
        ResponsiveContainer: module.ResponsiveContainer,
        LineChart: module.LineChart,
        Line: module.Line,
        PieChart: module.PieChart,
        Pie: module.Pie,
        Cell: module.Cell,
      });
      setChartsLoaded(true);
    });
  }, []);

  if (!chartsLoaded || !ChartComponents) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
  } = ChartComponents;

  // Análise de dados
  const analisarDados = () => {
    if (mensagens.length === 0) return null;

    // Primeira e última mensagem
    const mensagensOrdenadas = [...mensagens].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );
    const primeiraMensagem = mensagensOrdenadas[0];
    const ultimaMensagem = mensagensOrdenadas[mensagensOrdenadas.length - 1];

    // Contagem de mensagens por tipo
    const mensagensSistema = mensagens.filter((m) => m.contatoID === '1').length;
    const mensagensCliente = mensagens.length - mensagensSistema;

    // Análise por dia da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mensagensPorDia = [0, 0, 0, 0, 0, 0, 0];
    mensagens.forEach((msg) => {
      const dia = new Date(msg.dataHora).getDay();
      mensagensPorDia[dia]++;
    });

    // Análise por hora do dia
    const mensagensPorHora = Array(24).fill(0);
    mensagens.forEach((msg) => {
      const hora = new Date(msg.dataHora).getHours();
      mensagensPorHora[hora]++;
    });

    // Tempo médio de resposta (em horas)
    let temposResposta: number[] = [];
    for (let i = 0; i < mensagens.length - 1; i++) {
      const msgAtual = mensagens[i];
      const msgProxima = mensagens[i + 1];
      
      // Se a mensagem atual é do cliente e a próxima é do sistema (resposta)
      if (msgAtual.contatoID !== '1' && msgProxima.contatoID === '1') {
        const tempo = (new Date(msgProxima.dataHora).getTime() - new Date(msgAtual.dataHora).getTime()) / (1000 * 60 * 60);
        if (tempo > 0 && tempo < 168) { // Menos de 7 dias (resposta válida)
          temposResposta.push(tempo);
        }
      }
    }
    const tempoMedioResposta = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0;

    return {
      primeiraMensagem,
      ultimaMensagem,
      totalMensagens: mensagens.length,
      mensagensSistema,
      mensagensCliente,
      mensagensPorDia: diasSemana.map((dia, index) => ({
        dia,
        quantidade: mensagensPorDia[index],
      })),
      mensagensPorHora: mensagensPorHora.map((qtd, hora) => ({
        hora: `${hora}h`,
        quantidade: qtd,
      })),
      tempoMedioResposta,
    };
  };

  const dados = analisarDados();

  if (!dados) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-slate-500 dark:text-slate-400">Sem dados para análise</p>
      </div>
    );
  }

  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarTempo = (horas: number) => {
    if (horas < 1) {
      return `${Math.round(horas * 60)} minutos`;
    } else if (horas < 24) {
      return `${horas.toFixed(1)} horas`;
    } else {
      return `${(horas / 24).toFixed(1)} dias`;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-1 min-w-0">
            <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="truncate">Analytics da Conversa</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-elegant">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-90">Total de Mensagens</p>
            <p className="text-2xl font-bold">{dados.totalMensagens}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-90">Tempo Médio de Resposta</p>
            <p className="text-2xl font-bold">{formatarTempo(dados.tempoMedioResposta)}</p>
          </div>
        </div>

        {/* Primeiro Contato */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Primeiro Contato
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatarData(dados.primeiraMensagem.dataHora)}
          </p>
        </div>

        {/* Distribuição de Mensagens */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Distribuição de Mensagens
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Cliente', value: dados.mensagensCliente },
                  { name: 'Sistema', value: dados.mensagensSistema },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mensagens por Dia da Semana */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Atividade por Dia da Semana
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dados.mensagensPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mensagens por Hora do Dia */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Atividade por Hora do Dia
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dados.mensagensPorHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hora" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="quantidade"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mensagens do Cliente</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{dados.mensagensCliente}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mensagens do Sistema</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{dados.mensagensSistema}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente do Painel de IA (Resumo da Conversa)
interface PainelIAProps {
  contatoId: string | null;
  onClose: () => void;
}

function PainelIA({ contatoId, onClose }: PainelIAProps) {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para gerar o resumo
  const gerarResumo = useCallback(async () => {
    if (!contatoId) {
      setError('ID do contato não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResumo(null);

      const response = await fetch(`/api/contatos/${contatoId}/resumo`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResumo(data.resumo);
      } else {
        setError(data.error || 'Erro ao gerar resumo');
      }
    } catch (err) {
      console.error('Erro ao gerar resumo:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [contatoId]);

  useEffect(() => {
    // Gera o resumo quando o painel abre
    gerarResumo();
  }, [gerarResumo]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header do Painel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-1 min-w-0">
            <RiRobotLine className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="truncate">Resumo da Conversa</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-elegant">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Gerando resumo da conversa
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {error}
              </p>
              <button
                onClick={gerarResumo}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : resumo ? (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {resumo}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum resumo disponível
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente do Painel de Notas
interface PainelNotasProps {
  contato: Contato;
  onSave: (dados: Partial<Contato>) => Promise<void>;
  onUpdate: () => void;
  onClose: () => void;
}

function PainelNotas({ contato, onSave, onUpdate, onClose }: PainelNotasProps) {
  const [informacoesCaso, setInformacoesCaso] = useState(contato.informacoesCaso || '');
  const [salvando, setSalvando] = useState(false);

  // Atualiza o textarea quando o contato muda
  useEffect(() => {
    if (contato) {
      setInformacoesCaso(contato.informacoesCaso || '');
    }
  }, [contato]);

  const handleSalvar = async () => {
    if (salvando) return;

    setSalvando(true);
    try {
      await onSave({
        informacoesCaso: informacoesCaso.trim(),
      });
      // Atualiza o contato após salvar
      await onUpdate();
    } catch (error) {
      console.error('Erro ao salvar informações do caso:', error);
      alert('Erro ao salvar informações do caso');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header do Painel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="truncate">Notas do Caso</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <textarea
          value={informacoesCaso}
          onChange={(e) => setInformacoesCaso(e.target.value)}
          placeholder="Aqui você pode informar a situação atual do caso e informações relevantes, para que quando o cliente entre em contato, essas informações poderão ser repassadas para ele poder acompanhar a evolução do seu respectivo processo"
          className="flex-1 w-full resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all scrollbar-elegant"
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {salvando ? (
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
  );
}

interface PainelConfiguracaoProps {
  contato: Contato;
  onSave: (dados: Partial<Contato>) => Promise<void>;
  onUpdate: () => void;
  onClose: () => void;
}

function PainelConfiguracao({ contato, onSave, onUpdate, onClose }: PainelConfiguracaoProps) {
  // O estado sempre reflete o valor do contato.atendimentoIa (true = enable, false = disable)
  // IMPORTANTE: Se atendimentoIa for false, o toggle deve estar desabilitado (cinza)
  // Se for true ou undefined, o toggle deve estar habilitado (azul)
  const atendimentoIAHabilitado = contato.atendimentoIa === false ? false : (contato.atendimentoIa ?? true);
  const [salvando, setSalvando] = useState(false);
  const [ativandoAtendimentoPadrao, setAtivandoAtendimentoPadrao] = useState(false);

  // Debug: verifica o valor recebido
  useEffect(() => {
    console.log('🔍 PainelConfiguracao - contato completo:', contato);
    console.log('🔍 PainelConfiguracao - atendimentoIa do contato:', contato.atendimentoIa, typeof contato.atendimentoIa);
    console.log('🔍 PainelConfiguracao - atendimentoIAHabilitado calculado:', atendimentoIAHabilitado);
  }, [contato, atendimentoIAHabilitado]);

  // Verifica se todas as propriedades do fluxo estão true
  const todasPropriedadesTrue = 
    contato.saudacao === true &&
    contato.pedidoResumo === true &&
    contato.confirmacaoResumo === true &&
    contato.urgenciaDefinida === true &&
    contato.selecionandoData === true &&
    contato.propostaAgendamento === true &&
    contato.confirmaAgendamento === true;

  const handleToggle = async () => {
    if (salvando) return;

    const novoValor = !atendimentoIAHabilitado;
    setSalvando(true);

    try {
      await onSave({
        atendimentoIa: novoValor,
      });
      // Atualiza o contato para refletir a mudança
      await onUpdate();
    } catch (error) {
      console.error('Erro ao salvar configuração de atendimento IA:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSalvando(false);
    }
  };

  const handleAtivarAtendimentoPadrao = async () => {
    if (ativandoAtendimentoPadrao || todasPropriedadesTrue) return;

    setAtivandoAtendimentoPadrao(true);

    try {
      await onSave({
        saudacao: true,
        pedidoResumo: true,
        confirmacaoResumo: true,
        urgenciaDefinida: true,
        selecionandoData: true,
        propostaAgendamento: true,
        confirmaAgendamento: true,
      });
      // Atualiza o contato para refletir a mudança
      await onUpdate();
    } catch (error) {
      console.error('Erro ao ativar atendimento padrão:', error);
      alert('Erro ao ativar atendimento padrão');
    } finally {
      setAtivandoAtendimentoPadrao(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header do Painel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-1 min-w-0">
            <HiOutlineCog6Tooth className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <span className="truncate">Configurações</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0 ml-2"
            aria-label="Fechar painel"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">
            Atendimento com IA
          </span>
          <button
            onClick={handleToggle}
            disabled={salvando}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              atendimentoIAHabilitado
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
            aria-label="Ativar/Desativar atendimento com IA"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                atendimentoIAHabilitado ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">
            Iniciar Atendimento Padrão
          </span>
          <button
            onClick={handleAtivarAtendimentoPadrao}
            disabled={todasPropriedadesTrue || ativandoAtendimentoPadrao}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-500"
            aria-label="Ativar atendimento padrão"
          >
            {ativandoAtendimentoPadrao ? 'Ativando...' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}
