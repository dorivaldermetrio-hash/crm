/**
 * Funções para configurar watch (webhooks) do Google Calendar
 * 
 * Permite receber notificações quando eventos são criados, atualizados ou deletados
 * no Google Calendar do usuário
 */

import { getGoogleCalendarClient, getGoogleCalendarAccount } from './client';
import { getUserId } from '@/lib/utils/getUserId';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';

/**
 * Configura um watch (webhook) para o Google Calendar
 * @param userId - ID do usuário (opcional)
 * @returns true se configurado com sucesso
 */
export async function configurarWatchGoogleCalendar(userId?: string): Promise<boolean> {
  try {
    const auth = await getGoogleCalendarClient(userId);
    if (!auth) {
      console.log('⚠️ Cliente Google Calendar não disponível');
      return false;
    }

    const account = await getGoogleCalendarAccount(userId);
    if (!account) {
      console.log('⚠️ Conta do Google Calendar não encontrada');
      return false;
    }

    const calendarId = account.calendarId || 'primary';
    const user = userId || await getUserId();

    // URL do webhook (deve ser acessível publicamente)
    const webhookUrl = process.env.GOOGLE_CALENDAR_WEBHOOK_URL || 
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google-calendar/webhook`;

    // Gera um ID único para este watch usando Base64 para evitar caracteres inválidos
    // O Google Calendar requer que o Channel ID corresponda ao padrão [A-Za-z0-9\-_\+/=]+
    // Base64 usa exatamente esses caracteres, então é perfeito para isso
    const userEncoded = Buffer.from(user).toString('base64')
      .replace(/\+/g, '-')  // Substitui + por - (Base64URL)
      .replace(/\//g, '_')  // Substitui / por _ (Base64URL)
      .replace(/=/g, '');    // Remove padding = (Base64URL)
    const timestamp = Date.now();
    const channelId = `watch-${userEncoded}-${timestamp}`;
    
    // Token para identificar o usuário no webhook
    const channelToken = user;

    console.log('📡 Configurando watch do Google Calendar...');
    console.log('   Calendar ID:', calendarId);
    console.log('   Webhook URL:', webhookUrl);
    console.log('   Channel ID:', channelId);

    // Configura o watch usando requisição manual
    const response = await auth.request({
      url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: channelToken,
      },
    });

    const responseData = response.data as { resourceId?: string; expiration?: string | number } | undefined;
    if (responseData) {
      console.log('✅ Watch configurado com sucesso');
      console.log('   Resource ID:', responseData.resourceId);
      const expirationValue = responseData.expiration 
        ? (typeof responseData.expiration === 'string' 
            ? parseInt(responseData.expiration) 
            : responseData.expiration)
        : null;
      console.log('   Expiration:', expirationValue ? new Date(expirationValue).toISOString() : 'não fornecido');
      
      // Salva o resourceId e expiration na conta para poder parar o watch depois
      await connectDB();
      await GoogleCalendarAccount.findOneAndUpdate(
        { userId: user },
        {
          watchResourceId: responseData.resourceId,
          watchExpiration: expirationValue ? new Date(expirationValue) : null,
        }
      );
      
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Erro ao configurar watch do Google Calendar:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Para um watch do Google Calendar
 * @param resourceId - ID do recurso do watch
 * @param userId - ID do usuário (opcional)
 * @returns true se parado com sucesso
 */
export async function pararWatchGoogleCalendar(resourceId: string, userId?: string): Promise<boolean> {
  try {
    const auth = await getGoogleCalendarClient(userId);
    if (!auth) {
      console.log('⚠️ Cliente Google Calendar não disponível');
      return false;
    }

    console.log('🛑 Parando watch do Google Calendar...');
    console.log('   Resource ID:', resourceId);

    // Para o watch usando requisição manual
    await auth.request({
      url: 'https://www.googleapis.com/calendar/v3/channels/stop',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        id: resourceId,
      },
    });

    console.log('✅ Watch parado com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao parar watch do Google Calendar:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}
