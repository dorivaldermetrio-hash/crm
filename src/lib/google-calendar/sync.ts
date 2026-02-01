/**
 * Funções de sincronização com Google Calendar
 * 
 * Cria, atualiza e deleta eventos no Google Calendar
 * baseado nos agendamentos do sistema
 */

import { getGoogleCalendarAccount, getGoogleCalendarClient } from './client';
import { getUserId } from '@/lib/utils/getUserId';
import type { IAgendamento } from '@/lib/models/Agendamento';

/**
 * Converte um agendamento para formato de evento do Google Calendar
 * Formato esperado pela API: https://developers.google.com/calendar/api/v3/reference/events/insert
 */
function agendamentoParaEventoGoogle(agendamento: IAgendamento) {
  // Combina data e horário de início
  // Formato esperado: YYYY-MM-DDTHH:MM:SS
  const dataHoraInicio = `${agendamento.data}T${agendamento.horarioInicio}:00`;
  
  // Calcula a data/hora de fim baseado na duração
  const [horas, minutos] = agendamento.duracao.split(':').map(Number);
  const dataHoraInicioObj = new Date(dataHoraInicio);
  const dataHoraFimObj = new Date(dataHoraInicioObj);
  dataHoraFimObj.setHours(dataHoraFimObj.getHours() + horas);
  dataHoraFimObj.setMinutes(dataHoraFimObj.getMinutes() + minutos);

  // Timezone do Brasil
  const timezone = 'America/Sao_Paulo';
  
  // Formata as datas para ISO 8601 com timezone
  // A API do Google Calendar aceita tanto formato com offset quanto sem (usa timeZone)
  // Vamos usar o formato ISO 8601 padrão que o Google aceita
  const formatDateTime = (date: Date): string => {
    // Usa toISOString() que retorna em UTC, mas o Google Calendar usa o timeZone para converter
    // Alternativamente, podemos formatar manualmente com o offset correto
    // Para simplificar e garantir compatibilidade, vamos usar o formato ISO com offset
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Para America/Sao_Paulo, o offset é sempre -03:00 (Brasil não usa mais horário de verão)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
  };
  
  // Constrói o objeto evento no formato esperado pela API do Google Calendar
  const evento = {
    summary: agendamento.nome || 'Agendamento',
    description: agendamento.notas || '',
    start: {
      dateTime: formatDateTime(dataHoraInicioObj),
      timeZone: timezone,
    },
    end: {
      dateTime: formatDateTime(dataHoraFimObj),
      timeZone: timezone,
    },
  };
  
  console.log('📋 Evento formatado para Google Calendar:', JSON.stringify(evento, null, 2));
  
  return evento;
}

/**
 * Cria um evento no Google Calendar
 * @param agendamento - Agendamento a ser criado
 * @param userId - ID do usuário (opcional)
 * @returns ID do evento criado no Google Calendar ou null
 */
export async function criarEventoNoGoogleCalendar(
  agendamento: IAgendamento,
  userId?: string
): Promise<string | null> {
  try {
    console.log('🔍 Verificando disponibilidade do Google Calendar API...');
    
    // Obtém o cliente OAuth2 autenticado PRIMEIRO
    const auth = await getGoogleCalendarClient(userId);
    if (!auth) {
      console.log('⚠️ Cliente Google Calendar não disponível - verifique se está conectado');
      return null;
    }

    // Verifica se tem access token nas credenciais
    const credentials = auth.credentials;
    if (!credentials.access_token) {
      console.error('❌ Access token não encontrado nas credenciais');
      console.error('   Credenciais disponíveis:', Object.keys(credentials));
      return null;
    }

    console.log('   Access token presente:', credentials.access_token.substring(0, 20) + '...');

    const account = await getGoogleCalendarAccount(userId);
    if (!account) {
      console.log('⚠️ Conta do Google Calendar não encontrada');
      return null;
    }

    const calendarId = account.calendarId || 'primary';

    const evento = agendamentoParaEventoGoogle(agendamento);

    console.log('📅 Criando evento no Google Calendar:', {
      nome: agendamento.nome,
      calendarId,
      userId: userId || 'default-user',
    });

    // IMPORTANTE: Verifica e atualiza o token ANTES de fazer a requisição
    const credentialsBeforeRequest = auth.credentials;
    const nowBeforeRequest = Date.now();
    const expiryTimeBeforeRequest = credentialsBeforeRequest.expiry_date || 0;
    const timeUntilExpiryBeforeRequest = expiryTimeBeforeRequest - nowBeforeRequest;
    
    // Se o token expira em menos de 2 minutos, renova AGORA
    if (timeUntilExpiryBeforeRequest < 120000) {
      console.log('   Token expira em breve, renovando antes da requisição...');
      try {
        const { credentials: newCredentials } = await auth.refreshAccessToken();
        auth.setCredentials({
          ...newCredentials,
          refresh_token: credentialsBeforeRequest.refresh_token,
        });
        console.log('   Token renovado com sucesso antes da requisição');
      } catch (refreshError) {
        console.error('   Erro ao renovar token:', refreshError);
      }
    }

    console.log('   Fazendo requisição à API (método manual)...');

    // Usa requisição manual diretamente (mais confiável que googleapis)
    const response = await auth.request({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: evento,
    });

    const responseData = response.data as { id?: string } | undefined;
    if (responseData?.id) {
      console.log('✅ Evento criado no Google Calendar:', responseData.id);
      return responseData.id;
    }

    console.warn('⚠️ Evento criado mas sem ID retornado');
    return null;
  } catch (error: any) {
    console.error('❌ Erro ao criar evento no Google Calendar:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.message) {
      console.error('   Mensagem:', error.message);
    }
    if (error.code) {
      console.error('   Código:', error.code);
    }
    return null;
  }
}

/**
 * Atualiza um evento no Google Calendar
 * @param googleEventId - ID do evento no Google Calendar
 * @param agendamento - Agendamento atualizado
 * @param userId - ID do usuário (opcional)
 * @returns true se atualizado com sucesso
 */
export async function atualizarEventoNoGoogleCalendar(
  googleEventId: string,
  agendamento: IAgendamento,
  userId?: string
): Promise<boolean> {
  try {
    const auth = await getGoogleCalendarClient(userId);
    if (!auth || !auth.credentials.access_token) {
      console.log('⚠️ Cliente Google Calendar não disponível');
      return false;
    }

    const account = await getGoogleCalendarAccount(userId);
    const calendarId = account?.calendarId || 'primary';

    const evento = agendamentoParaEventoGoogle(agendamento);

    console.log('📅 Atualizando evento no Google Calendar:', {
      googleEventId,
      nome: agendamento.nome,
    });

    // Usa requisição manual diretamente
    await auth.request({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: evento,
    });

    console.log('✅ Evento atualizado no Google Calendar');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar evento no Google Calendar:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Deleta um evento no Google Calendar
 * @param googleEventId - ID do evento no Google Calendar
 * @param userId - ID do usuário (opcional)
 * @returns true se deletado com sucesso
 */
export async function deletarEventoNoGoogleCalendar(
  googleEventId: string,
  userId?: string
): Promise<boolean> {
  try {
    const auth = await getGoogleCalendarClient(userId);
    if (!auth || !auth.credentials.access_token) {
      console.log('⚠️ Cliente Google Calendar não disponível');
      return false;
    }

    const account = await getGoogleCalendarAccount(userId);
    const calendarId = account?.calendarId || 'primary';

    console.log('📅 Deletando evento no Google Calendar:', googleEventId);

    // Usa requisição manual diretamente
    await auth.request({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      method: 'DELETE',
    });

    console.log('✅ Evento deletado no Google Calendar');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao deletar evento no Google Calendar:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}
