import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agendamento from '@/lib/models/Agendamento';
import { getGoogleCalendarClient, getGoogleCalendarAccount } from '@/lib/google-calendar/client';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para receber webhooks do Google Calendar
 * POST /api/google-calendar/webhook
 * 
 * Este endpoint recebe notificações do Google Calendar quando eventos são
 * criados, atualizados ou deletados no calendário do usuário.
 */

// Verifica se a requisição é uma verificação inicial do Google
// O Google Calendar não usa GET para verificação, mas vamos manter para compatibilidade
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    // Google está verificando o webhook (formato PubSubHubbub)
    console.log('✅ Google Calendar webhook verificado:', challenge);
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// Recebe as notificações do Google Calendar
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Google Calendar envia notificações em formato específico
    const headers = request.headers;
    const xGoogChannelId = headers.get('X-Goog-Channel-Id');
    const xGoogChannelToken = headers.get('X-Goog-Channel-Token');
    const xGoogResourceId = headers.get('X-Goog-Resource-Id');
    const xGoogResourceUri = headers.get('X-Goog-Resource-URI');
    const xGoogResourceState = headers.get('X-Goog-Resource-State');

    console.log('📬 Webhook recebido do Google Calendar:', {
      channelId: xGoogChannelId,
      resourceId: xGoogResourceId,
      resourceState: xGoogResourceState,
    });

    // Se for uma notificação de sincronização (sync), precisamos buscar todos os eventos
    if (xGoogResourceState === 'sync') {
      console.log('🔄 Sincronização inicial do webhook');
      return NextResponse.json({ success: true, message: 'Sync notification received' }, { status: 200 });
    }

    // Se for uma notificação de mudança (exists, not_exists), processamos
    if (xGoogResourceState === 'exists' || xGoogResourceState === 'not_exists') {
      // O xGoogChannelToken contém o userId que configuramos
      const userId = xGoogChannelToken || 'default-user';
      
      console.log('🔄 Processando mudança no Google Calendar para userId:', userId);

      // Busca a conta do Google Calendar
      const account = await getGoogleCalendarAccount(userId);
      if (!account) {
        console.log('⚠️ Conta do Google Calendar não encontrada para userId:', userId);
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }

      const calendarId = account.calendarId || 'primary';

      // Obtém o cliente autenticado
      const auth = await getGoogleCalendarClient(userId);
      if (!auth) {
        console.log('⚠️ Cliente Google Calendar não disponível');
        return NextResponse.json({ success: false, error: 'Auth not available' }, { status: 500 });
      }

      // Busca os eventos do Google Calendar
      // Vamos buscar eventos modificados recentemente (últimas 24 horas)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const timeMin = yesterday.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Próximos 30 dias

      try {
        const response = await auth.request({
          url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          method: 'GET',
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          },
        });

        const events = response.data?.items || [];

        console.log(`📅 Encontrados ${events.length} eventos no Google Calendar`);

        // Sincroniza cada evento
        for (const event of events) {
          if (!event.id) continue;

          // Busca se já existe no nosso banco
          const agendamentoExistente = await Agendamento.findOne({
            googleEventId: event.id,
          });

          if (agendamentoExistente) {
            // Atualiza o agendamento existente
            const start = event.start?.dateTime || event.start?.date;
            const end = event.end?.dateTime || event.end?.date;

            if (start) {
              const startDate = new Date(start);
              agendamentoExistente.nome = event.summary || 'Sem título';
              agendamentoExistente.notas = event.description || '';
              agendamentoExistente.data = startDate.toISOString().split('T')[0];
              agendamentoExistente.horarioInicio = startDate.toTimeString().slice(0, 5);

              if (end) {
                const endDate = new Date(end);
                const durationMs = endDate.getTime() - startDate.getTime();
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                agendamentoExistente.duracao = `${hours}:${String(minutes).padStart(2, '0')}`;
              }

              await agendamentoExistente.save();
              console.log('✅ Agendamento atualizado:', agendamentoExistente._id.toString());
            }
          } else {
            // Cria novo agendamento
            const start = event.start?.dateTime || event.start?.date;
            const end = event.end?.dateTime || event.end?.date;

            if (start) {
              const startDate = new Date(start);
              let duracao = '1:00'; // Padrão

              if (end) {
                const endDate = new Date(end);
                const durationMs = endDate.getTime() - startDate.getTime();
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                duracao = `${hours}:${String(minutes).padStart(2, '0')}`;
              }

              const novoAgendamento = await Agendamento.create({
                nome: event.summary || 'Evento do Google Calendar',
                notas: event.description || '',
                data: startDate.toISOString().split('T')[0],
                horarioInicio: startDate.toTimeString().slice(0, 5),
                duracao,
                status: 'Agendado',
                googleEventId: event.id,
              });

              console.log('✅ Novo agendamento criado do Google Calendar:', novoAgendamento._id.toString());
            }
          }
        }

        // Verifica eventos deletados no Google Calendar
        // Busca todos os agendamentos com googleEventId
        const agendamentosComGoogleId = await Agendamento.find({
          googleEventId: { $exists: true, $ne: null },
        }).lean();

        const googleEventIds = new Set(events.map((e: any) => e.id));

        for (const agendamento of agendamentosComGoogleId) {
          if (agendamento.googleEventId && !googleEventIds.has(agendamento.googleEventId)) {
            // Evento foi deletado no Google Calendar, deleta localmente também
            await Agendamento.findByIdAndDelete(agendamento._id);
            console.log('🗑️ Agendamento deletado (evento removido do Google Calendar):', agendamento._id.toString());
          }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });
      } catch (error: any) {
        console.error('❌ Erro ao processar webhook:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Notification received' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook do Google Calendar:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
