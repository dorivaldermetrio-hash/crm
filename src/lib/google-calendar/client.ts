/**
 * Cliente Google Calendar API
 * 
 * Fornece funções para obter um cliente autenticado do Google Calendar
 * usando o refresh_token armazenado no MongoDB
 */

import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * Obtém um cliente OAuth2 autenticado do Google Calendar
 * @param userId - ID do usuário (opcional, usa getUserId se não fornecido)
 * @returns Cliente OAuth2 autenticado ou null se não houver tokens
 */
export async function getGoogleCalendarClient(userId?: string): Promise<OAuth2Client | null> {
  try {
    await connectDB();

    const user = userId || await getUserId();
    
    // Busca a conta do Google Calendar no MongoDB
    const account = await GoogleCalendarAccount.findOne({ userId: user }).lean();

    if (!account || !account.refreshToken) {
      console.log('⚠️ Conta do Google Calendar não encontrada para o usuário:', user);
      return null;
    }

    // Obtém as variáveis de ambiente
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;
    
    // Log para debug - verificar se está usando as credenciais corretas
    console.log('   Usando Client ID:', clientId?.substring(0, 30) + '...');

    if (!clientId || !clientSecret) {
      console.error('❌ Credenciais do Google Calendar não configuradas');
      return null;
    }

    // Cria o cliente OAuth2
    const oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
    });

    // Define o refresh token
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    // Tenta obter um novo access token
    try {
      console.log('🔄 Renovando access token do Google Calendar...');
      console.log('   Client ID:', clientId?.substring(0, 20) + '...');
      console.log('   Refresh Token presente:', !!account.refreshToken);
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        console.error('❌ Access token não foi retornado após renovação');
        console.error('   Credentials recebidas:', Object.keys(credentials));
        return null;
      }
      
      // IMPORTANTE: Define TODAS as credenciais, não apenas o access_token
      // Inclui o refresh_token para futuras renovações
      const allCredentials = {
        ...credentials,
        refresh_token: account.refreshToken, // Garante que o refresh_token está presente
      };
      
      oauth2Client.setCredentials(allCredentials);
      
      console.log('✅ Access token renovado com sucesso');
      console.log('   Access token (primeiros 20 chars):', credentials.access_token.substring(0, 20) + '...');
      console.log('   Expiry date:', credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'não fornecido');
      console.log('   Scopes:', credentials.scope || 'não fornecido');
      
      // Verifica se o token tem os escopos necessários
      const requiredScope = 'https://www.googleapis.com/auth/calendar.events';
      const hasRequiredScope = credentials.scope?.includes(requiredScope) || 
                               credentials.scope?.includes('https://www.googleapis.com/auth/calendar');
      
      if (!hasRequiredScope) {
        console.warn('⚠️ ATENÇÃO: O token pode não ter os escopos necessários!');
        console.warn('   Escopo atual:', credentials.scope);
        console.warn('   Escopo necessário:', requiredScope);
      }
    } catch (error: any) {
      console.error('❌ Erro ao renovar access token:', error);
      if (error.response) {
        console.error('   Status:', error.response.status);
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

    return oauth2Client;
  } catch (error) {
    console.error('❌ Erro ao obter cliente Google Calendar:', error);
    return null;
  }
}

/**
 * @deprecated Esta função não é mais usada. Use getGoogleCalendarClient() e faça requisições manuais com auth.request()
 * Obtém a instância do Google Calendar API
 * @param userId - ID do usuário (opcional)
 * @param oauth2Client - Cliente OAuth2 opcional (para reutilizar uma instância já autenticada)
 * @returns Instância do calendar API ou null
 */
export async function getCalendarAPI(userId?: string, oauth2Client?: OAuth2Client) {
  // Esta função foi descontinuada porque removemos googleapis
  // Use getGoogleCalendarClient() e faça requisições manuais com auth.request()
  console.warn('⚠️ getCalendarAPI está deprecada. Use getGoogleCalendarClient() e faça requisições manuais.');
  return null;
}

/**
 * Verifica se o usuário tem Google Calendar conectado
 * @param userId - ID do usuário (opcional)
 * @returns true se conectado, false caso contrário
 */
export async function isGoogleCalendarConnected(userId?: string): Promise<boolean> {
  try {
    await connectDB();
    const user = userId || await getUserId();
    const account = await GoogleCalendarAccount.findOne({ userId: user }).lean();
    return !!account && !!account.refreshToken;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão Google Calendar:', error);
    return false;
  }
}

/**
 * Obtém informações da conta do Google Calendar
 * @param userId - ID do usuário (opcional)
 * @returns Informações da conta ou null
 */
export async function getGoogleCalendarAccount(userId?: string) {
  try {
    await connectDB();
    const user = userId || await getUserId();
    const account = await GoogleCalendarAccount.findOne({ userId: user }).lean();
    return account;
  } catch (error) {
    console.error('❌ Erro ao obter conta Google Calendar:', error);
    return null;
  }
}
