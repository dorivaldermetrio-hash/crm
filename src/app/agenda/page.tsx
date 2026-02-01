'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import CriarAgendamentoModal from '@/components/CriarAgendamentoModal';
import VisualizarAgendamentoModal from '@/components/VisualizarAgendamentoModal';
import { Plus, X } from 'lucide-react';
import { obterDatasDisponiveis } from '@/lib/utils/obterDatasDisponiveis';
import './agenda.css';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface Agendamento {
  id: string;
  nome: string;
  notas: string;
  data: string;
  horarioInicio: string;
  duracao: string;
  status: string;
}

export default function AgendaPage() {
  const { isOpen, isMobile } = useSidebar();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalVisualizarAberto, setModalVisualizarAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<string | null>(null);
  const [modalConfirmarMovimento, setModalConfirmarMovimento] = useState(false);
  const [eventoMovido, setEventoMovido] = useState<{
    id: string;
    novaData: string;
    novoHorario: string;
    eventoOriginal: CalendarEvent | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para configurações
  const [config, setConfig] = useState({
    horarioInicio: '08:00',
    horarioFim: '18:00',
    horarioInicioSab: '08:00',
    horarioFimSab: '18:00',
    duracaoAgendamento: '0:00',
  });
  const [finsDeSemana, setFinsDeSemana] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // Para forçar re-render do calendário
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<Array<{ data: string; horario: string; dataFormatada: string }>>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [verificandoGoogleCalendar, setVerificandoGoogleCalendar] = useState(true);
  const [googleCalendarMessage, setGoogleCalendarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verifica status do Google Calendar
  const verificarGoogleCalendar = async () => {
    try {
      setVerificandoGoogleCalendar(true);
      const response = await fetch('/api/google-calendar/status');
      const result = await response.json();
      
      if (result.success) {
        setGoogleCalendarConnected(result.connected);
        setGoogleCalendarEmail(result.account?.email || null);
      }
    } catch (error) {
      console.error('Erro ao verificar Google Calendar:', error);
    } finally {
      setVerificandoGoogleCalendar(false);
    }
  };

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  // Carrega agendamentos do banco
  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agendamentos');
      const result = await response.json();

      if (result.success && result.agendamentos) {
        // Função para determinar a cor baseada no status
        const getColorByStatus = (status: string) => {
          const statusLower = status?.toLowerCase() || '';
          if (statusLower === 'realizado') {
            return '#10b981'; // Verde (green-500)
          } else if (statusLower === 'faltou') {
            return '#ef4444'; // Vermelho (red-500)
          } else {
            return '#3b82f6'; // Azul (blue-500) - padrão para 'agendado' ou qualquer outro
          }
        };

        // Converte agendamentos para eventos do calendário
        const eventosCalendario: CalendarEvent[] = result.agendamentos.map((agendamento: any) => {
          // Combina data e horário de início
          const dataHoraInicio = `${agendamento.data}T${agendamento.horarioInicio}`;
          
          // Calcula a data/hora de fim baseado na duração
          const [horas, minutos] = agendamento.duracao.split(':').map(Number);
          const dataHoraInicioObj = new Date(dataHoraInicio);
          const dataHoraFimObj = new Date(dataHoraInicioObj);
          dataHoraFimObj.setHours(dataHoraFimObj.getHours() + horas);
          dataHoraFimObj.setMinutes(dataHoraFimObj.getMinutes() + minutos);

          const eventColor = getColorByStatus(agendamento.status || 'agendado');
          
          // Debug: log para verificar status e cor
          console.log('Evento:', {
            nome: agendamento.nome,
            status: agendamento.status,
            cor: eventColor,
          });
          
          return {
            id: agendamento._id || agendamento.id,
            title: agendamento.nome,
            start: dataHoraInicio,
            end: dataHoraFimObj.toISOString(),
            allDay: false,
            color: eventColor,
            backgroundColor: eventColor,
            borderColor: eventColor,
            textColor: '#ffffff',
          };
        });

        setEvents(eventosCalendario);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega configurações
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const result = await response.json();

      if (result.success && result.data) {
        setConfig({
          horarioInicio: result.data.horarioInicio || '08:00',
          horarioFim: result.data.horarioFim || '18:00',
          horarioInicioSab: result.data.horarioInicioSab || '08:00',
          horarioFimSab: result.data.horarioFimSab || '18:00',
          duracaoAgendamento: result.data.duracaoAgendamento || '0:00',
        });
        // Se houver horários de sábado configurados, assume que fins de semana está ativado
        if (result.data.horarioInicioSab && result.data.horarioInicioSab !== '08:00') {
          setFinsDeSemana(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Calcula os horários mínimos e máximos para exibição no calendário
  const getSlotMinMaxTime = () => {
    try {
      // Valores padrão caso algo dê errado
      let minTime = '08:00';
      let maxTime = '18:00';

      // Verifica se os valores de config existem e são válidos
      if (config.horarioInicio && config.horarioFim) {
        // Converte horários para minutos para comparação
        const timeToMinutes = (time: string) => {
          if (!time || !time.includes(':')) return 0;
          const parts = time.split(':');
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          return hours * 60 + minutes;
        };

        const inicioMinutos = timeToMinutes(config.horarioInicio);
        const fimMinutos = timeToMinutes(config.horarioFim);
        
        minTime = config.horarioInicio;
        maxTime = config.horarioFim;

        // Se fins de semana estiver ativado, considera os horários de sábado também
        if (finsDeSemana && config.horarioInicioSab && config.horarioFimSab) {
          const inicioSabMinutos = timeToMinutes(config.horarioInicioSab);
          const fimSabMinutos = timeToMinutes(config.horarioFimSab);
          
          // Pega o menor horário de início e o maior horário de fim
          const minInicio = Math.min(inicioMinutos, inicioSabMinutos);
          const maxFim = Math.max(fimMinutos, fimSabMinutos);
          
          // Converte de volta para formato HH:mm
          const minHours = Math.floor(minInicio / 60);
          const minMins = minInicio % 60;
          const maxHours = Math.floor(maxFim / 60);
          const maxMins = maxFim % 60;
          
          minTime = `${String(minHours).padStart(2, '0')}:${String(minMins).padStart(2, '0')}`;
          maxTime = `${String(maxHours).padStart(2, '0')}:${String(maxMins).padStart(2, '0')}`;
        }
      }

      return { minTime, maxTime };
    } catch (error) {
      console.error('Erro ao calcular horários:', error);
      return { minTime: '08:00', maxTime: '18:00' };
    }
  };

  // Calcula businessHours para destacar horários de expediente
  const getBusinessHours = () => {
    try {
      const businessHours: Array<{
        daysOfWeek: number[];
        startTime: string;
        endTime: string;
      }> = [];

      // Segunda a Sexta - só adiciona se os horários forem válidos
      if (config.horarioInicio && config.horarioFim) {
        businessHours.push({
          daysOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
          startTime: config.horarioInicio,
          endTime: config.horarioFim,
        });
      }

      // Se fins de semana estiver ativado, adiciona sábado
      if (finsDeSemana && config.horarioInicioSab && config.horarioFimSab) {
        businessHours.push({
          daysOfWeek: [6], // Sábado
          startTime: config.horarioInicioSab,
          endTime: config.horarioFimSab,
        });
      }

      return businessHours;
    } catch (error) {
      console.error('Erro ao calcular businessHours:', error);
      return [];
    }
  };

  // Salva configurações
  const handleSalvarConfig = async () => {
    setSalvando(true);
    setSalvoSucesso(false);

    try {
      const body: any = {
        horarioInicio: config.horarioInicio,
        horarioFim: config.horarioFim,
        duracaoAgendamento: config.duracaoAgendamento,
      };

      // Só envia horários de sábado se fins de semana estiver ativado
      if (finsDeSemana) {
        body.horarioInicioSab = config.horarioInicioSab;
        body.horarioFimSab = config.horarioFimSab;
      } else {
        // Se desativado, reseta para valores padrão
        body.horarioInicioSab = '08:00';
        body.horarioFimSab = '18:00';
      }

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setSalvoSucesso(true);
        setTimeout(() => setSalvoSucesso(false), 3000);
        // Força atualização do calendário para aplicar novos horários
        setCalendarKey((prev) => prev + 1);
      } else {
        console.error('Erro ao salvar configurações:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSalvando(false);
    }
  };

  // Carrega agendamentos e configurações ao montar o componente
  useEffect(() => {
    fetchAgendamentos();
    fetchConfig();
    verificarGoogleCalendar();
  }, []);

  // Verifica novamente quando volta para a página (após callback OAuth)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'true') {
      setGoogleCalendarMessage({
        type: 'success',
        text: '✅ Google Calendar conectado com sucesso! Seus agendamentos serão sincronizados automaticamente.',
      });
      verificarGoogleCalendar();
      // Remove os parâmetros da URL
      window.history.replaceState({}, '', '/agenda');
      // Remove mensagem após 5 segundos
      setTimeout(() => setGoogleCalendarMessage(null), 5000);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'no_code': 'Código de autorização não recebido',
        'no_refresh_token': 'Token de renovação não obtido',
        'invalid_grant': 'Código de autorização inválido ou expirado',
        'config': 'Configuração incorreta',
        'no_tokens': 'Não foi possível obter os tokens',
      };
      
      setGoogleCalendarMessage({
        type: 'error',
        text: `Erro ao conectar Google Calendar: ${errorMessages[error] || 'Erro desconhecido'}`,
      });
      verificarGoogleCalendar();
      // Remove os parâmetros da URL
      window.history.replaceState({}, '', '/agenda');
      // Remove mensagem após 10 segundos
      setTimeout(() => setGoogleCalendarMessage(null), 10000);
    }
  }, []);

  // Detecta dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDark(true);
      } else {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Handler para quando uma data é selecionada - desabilitado
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Apenas limpa a seleção, não cria evento
    selectInfo.view.calendar.unselect();
  };

  // Handler para quando um evento é clicado
  const handleEventClick = (clickInfo: EventClickArg) => {
    // Abre o modal de visualização com o ID do agendamento
    setAgendamentoSelecionado(clickInfo.event.id);
    setModalVisualizarAberto(true);
  };

  // Handler para quando um evento é arrastado
  const handleEventDrop = (dropInfo: EventDropArg) => {
    // Reverte a mudança visualmente
    dropInfo.revert();

    // Extrai a nova data e horário
    const novaDataHora = new Date(dropInfo.event.start!);
    const novaData = novaDataHora.toISOString().split('T')[0]; // YYYY-MM-DD
    const novoHorario = novaDataHora.toTimeString().slice(0, 5); // HH:MM

    // Encontra o evento original
    const eventoOriginal = events.find((e) => e.id === dropInfo.event.id);

    // Abre o modal de confirmação
    setEventoMovido({
      id: dropInfo.event.id,
      novaData,
      novoHorario,
      eventoOriginal: eventoOriginal || null,
    });
    setModalConfirmarMovimento(true);
  };

  // Confirma a mudança de data/horário do evento
  const handleConfirmarMovimento = async () => {
    if (!eventoMovido) return;

    try {
      setLoading(true);

      // Busca o agendamento atual para pegar a duração
      const response = await fetch(`/api/agendamentos/${eventoMovido.id}`);
      const result = await response.json();

      if (!result.success || !result.agendamento) {
        alert('Erro ao buscar agendamento');
        return;
      }

      // Atualiza o agendamento com a nova data e horário
      const updateResponse = await fetch(`/api/agendamentos/${eventoMovido.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: eventoMovido.novaData,
          horarioInicio: eventoMovido.novoHorario,
        }),
      });

      const updateResult = await updateResponse.json();

      if (updateResult.success) {
        // Recarrega os agendamentos para atualizar o calendário
        await fetchAgendamentos();
        setModalConfirmarMovimento(false);
        setEventoMovido(null);
      } else {
        alert('Erro ao atualizar agendamento: ' + (updateResult.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao confirmar movimento:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Formata data e horário para exibição
  const formatarDataHora = (data: string, horario: string) => {
    const dataObj = new Date(data + 'T' + horario);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const horarioFormatado = horario;
    return { dataFormatada, horarioFormatado };
  };

  // Busca horários disponíveis
  const handleBuscarHorariosDisponiveis = async () => {
    setCarregandoHorarios(true);
    setMostrarHorarios(false);
    try {
      const horarios = await obterDatasDisponiveis();
      setHorariosDisponiveis(horarios);
      setMostrarHorarios(true);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      alert('Erro ao buscar horários disponíveis. Verifique o console para mais detalhes.');
    } finally {
      setCarregandoHorarios(false);
    }
  };

  // Handler para mudança de view
  const handleDatesSet = (arg: any) => {
    try {
      if (arg && arg.view && arg.view.type) {
        const viewType = arg.view.type;
        if (viewType === 'dayGridMonth' || viewType === 'timeGridWeek' || viewType === 'timeGridDay') {
          setCurrentView(viewType as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay');
        }
      }
    } catch (error) {
      console.error('Erro ao processar mudança de view:', error);
    }
  };

  // Calcula os valores de slotMinTime e slotMaxTime baseado na view atual
  const getSlotTimes = () => {
    // Sempre retorna os valores para timeGrid views, mesmo que currentView ainda não tenha sido atualizado
    // Isso garante que os horários sejam limitados corretamente
    const { minTime, maxTime } = getSlotMinMaxTime();
    return {
      slotMinTime: minTime,
      slotMaxTime: maxTime,
    };
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-full">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            {/* Mensagens de feedback do Google Calendar */}
            {googleCalendarMessage && (
              <div className={`mb-4 p-3 rounded-lg border ${
                googleCalendarMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm ${
                  googleCalendarMessage.type === 'success'
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {googleCalendarMessage.text}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 truncate">
                  Agenda
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 truncate">
                  Gerencie seus agendamentos e compromissos
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Botão Google Calendar */}
                {googleCalendarConnected ? (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-xl text-xs sm:text-sm font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                    </svg>
                    <span className="hidden sm:inline">
                      {googleCalendarEmail ? `Conectado (${googleCalendarEmail})` : 'Conectado'}
                    </span>
                    <span className="sm:hidden">Google</span>
                    <button
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja desconectar o Google Calendar? Os agendamentos futuros não serão mais sincronizados.')) {
                          try {
                            const response = await fetch('/api/google-calendar/disconnect', {
                              method: 'DELETE',
                            });
                            const result = await response.json();
                            
                            if (result.success) {
                              setGoogleCalendarMessage({
                                type: 'success',
                                text: 'Google Calendar desconectado com sucesso.',
                              });
                              verificarGoogleCalendar();
                              setTimeout(() => setGoogleCalendarMessage(null), 3000);
                            } else {
                              setGoogleCalendarMessage({
                                type: 'error',
                                text: `Erro ao desconectar: ${result.error || 'Erro desconhecido'}`,
                              });
                              setTimeout(() => setGoogleCalendarMessage(null), 5000);
                            }
                          } catch (error) {
                            console.error('Erro ao desconectar:', error);
                            setGoogleCalendarMessage({
                              type: 'error',
                              text: 'Erro ao conectar com o servidor',
                            });
                            setTimeout(() => setGoogleCalendarMessage(null), 5000);
                          }
                        }
                      }}
                      className="ml-2 p-1 hover:bg-green-700 rounded transition-colors"
                      title="Desconectar Google Calendar"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <a
                    href="/api/google-calendar/auth"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 justify-center flex-shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                    </svg>
                    <span className="hidden sm:inline">Conectar Google Calendar</span>
                    <span className="sm:hidden">Google</span>
                  </a>
                )}
                {/* Botão Criar Evento */}
                <button
                  onClick={() => setModalAberto(true)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start flex-shrink-0"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Criar Evento</span>
                  <span className="sm:hidden">Criar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-slate-800 rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-slate-700 shadow-sm overflow-x-auto min-w-0">
            <div className="min-w-0 w-full">
              <FullCalendar
                key={calendarKey}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={currentView}
                locale={ptBrLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                height="auto"
                aspectRatio={isMobile ? 1.2 : 1.8}
                eventDisplay="block"
                editable={true}
                droppable={true}
                buttonText={{
                  today: isMobile ? 'Hoje' : 'Hoje',
                  month: isMobile ? 'Mês' : 'Mês',
                  week: isMobile ? 'Sem' : 'Semana',
                  day: isMobile ? 'Dia' : 'Dia',
                }}
                allDayText="Dia todo"
                moreLinkText="mais"
                noEventsText="Nenhum evento"
                // Limita os horários visíveis apenas ao expediente (apenas para views com timeGrid)
                slotMinTime={getSlotMinMaxTime().minTime}
                slotMaxTime={getSlotMinMaxTime().maxTime}
                // Remove businessHours para não destacar horários (queremos que não apareçam)
                // businessHours={getBusinessHours()}
                // Handler para mudança de view
                datesSet={handleDatesSet}
                // Configurações de hora para português
                slotLabelFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false,
                }}
              />
            </div>
          </div>

          {/* Painel de Configurações */}
          <div className="mt-4 sm:mt-6 bg-slate-800 rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-sm min-w-0">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 md:mb-6 truncate">Configurações de Expediente</h2>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Horário de Início do Expediente */}
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Horário de início do expediente
                </label>
                <input
                  type="time"
                  value={config.horarioInicio}
                  onChange={(e) => setConfig({ ...config, horarioInicio: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Horário de Fim do Expediente */}
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Horário de fim do expediente
                </label>
                <input
                  type="time"
                  value={config.horarioFim}
                  onChange={(e) => setConfig({ ...config, horarioFim: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Fins de Semana Toggle */}
              <div className="min-w-0">
                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={finsDeSemana}
                      onChange={(e) => setFinsDeSemana(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors duration-200 ${
                        finsDeSemana ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          finsDeSemana ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'
                        } mt-0.5`}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">Fins de Semana</span>
                </label>
              </div>

              {/* Horários de Sábado (aparece apenas se fins de semana estiver ativado) */}
              {finsDeSemana && (
                <>
                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                      Horário de início do expediente, Sábado
                    </label>
                    <input
                      type="time"
                      value={config.horarioInicioSab}
                      onChange={(e) => setConfig({ ...config, horarioInicioSab: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                      Horário de fim do expediente, Sábado
                    </label>
                    <input
                      type="time"
                      value={config.horarioFimSab}
                      onChange={(e) => setConfig({ ...config, horarioFimSab: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Agendamentos por IA duração */}
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Agendamentos por IA duração de:
                </label>
                <input
                  type="text"
                  value={config.duracaoAgendamento}
                  onChange={(e) => setConfig({ ...config, duracaoAgendamento: e.target.value })}
                  pattern="^\d+:\d{2}$"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ex: 1:30 (1 hora e 30 minutos)"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                  Formato: horas:minutos (ex: 1:30 para 1 hora e 30 minutos)
                </p>
              </div>

              {/* Botão Salvar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-700">
                {salvoSucesso && (
                  <div className="flex items-center gap-2 text-green-400 text-xs sm:text-sm font-medium flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Salvo com sucesso!</span>
                  </div>
                )}
                <button
                  onClick={handleSalvarConfig}
                  disabled={salvando}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>

          {/* Botão e Lista de Horários Disponíveis */}
          <div className="mt-4 sm:mt-6 bg-slate-800 rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-sm min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">Testar Horários Disponíveis</h2>
              <button
                onClick={handleBuscarHorariosDisponiveis}
                disabled={carregandoHorarios}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm md:text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {carregandoHorarios ? 'Buscando...' : <><span className="hidden sm:inline">Buscar Horários Disponíveis</span><span className="sm:hidden">Buscar Horários</span></>}
              </button>
            </div>

            {mostrarHorarios && (
              <div className="mt-3 sm:mt-4 min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 truncate">
                  Próximos {horariosDisponiveis.length} Horários Disponíveis:
                </h3>
                {horariosDisponiveis.length > 0 ? (
                  <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto min-w-0">
                    {horariosDisponiveis.map((horario, index) => (
                      <div
                        key={index}
                        className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg text-xs sm:text-sm text-white truncate"
                        title={horario.dataFormatada}
                      >
                        {horario.dataFormatada}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400">Nenhum horário disponível encontrado.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Criar Agendamento */}
      <CriarAgendamentoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => {
          fetchAgendamentos();
        }}
      />

      {/* Modal Visualizar Agendamento */}
      <VisualizarAgendamentoModal
        isOpen={modalVisualizarAberto}
        onClose={() => {
          setModalVisualizarAberto(false);
          setAgendamentoSelecionado(null);
        }}
        agendamentoId={agendamentoSelecionado}
        onSuccess={() => {
          fetchAgendamentos();
        }}
      />

      {/* Modal Confirmar Movimento */}
      {modalConfirmarMovimento && eventoMovido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setModalConfirmarMovimento(false);
              setEventoMovido(null);
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 my-auto min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Confirmar Alteração</h2>
              <button
                onClick={() => {
                  setModalConfirmarMovimento(false);
                  setEventoMovido(null);
                }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 min-w-0">
              <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">
                Você gostaria de alterar o evento para:
              </p>
              {(() => {
                const { dataFormatada, horarioFormatado } = formatarDataHora(
                  eventoMovido.novaData,
                  eventoMovido.novoHorario
                );
                return (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-900 border border-slate-600 rounded-lg min-w-0">
                    <p className="text-sm sm:text-base text-white font-semibold capitalize truncate">{dataFormatada}</p>
                    <p className="text-blue-400 text-base sm:text-lg font-medium mt-1">{horarioFormatado}</p>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setModalConfirmarMovimento(false);
                    setEventoMovido(null);
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarMovimento}
                  disabled={loading}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {loading ? 'Atualizando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

