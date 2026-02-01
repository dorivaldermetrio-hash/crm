/**
 * Cliente Google Calendar API
 * 
 * Fornece funções para obter um cliente autenticado do Google Calendar
 * usando o refresh_token armazenado no MongoDB
 */

import { google } from 'googleapis';
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

    const user = userId || getUserId();
    
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
 * Obtém a instância do Google Calendar API
 * @param userId - ID do usuário (opcional)
 * @param oauth2Client - Cliente OAuth2 opcional (para reutilizar uma instância já autenticada)
 * @returns Instância do calendar API ou null
 */
export async function getCalendarAPI(userId?: string, oauth2Client?: OAuth2ClientType) {
  // Se um cliente OAuth2 já foi fornecido, usa ele
  // Caso contrário, obtém um novo
  let auth = oauth2Client;
  let account = null;
  
  if (!auth) {
    auth = await getGoogleCalendarClient(userId);
    if (!auth) {
      console.error('❌ Não foi possível obter cliente OAuth2');
      return null;
    }
  }
  
  // Busca a conta para ter acesso ao refresh_token se necessário
  try {
    await connectDB();
    const user = userId || getUserId();
    account = await GoogleCalendarAccount.findOne({ userId: user }).lean();
  } catch (error) {
    console.warn('⚠️ Não foi possível buscar conta do Google Calendar');
  }
  
  // Verifica se o auth tem access_token antes de criar a API
  const credentials = auth.credentials;
  if (!credentials.access_token) {
    console.error('❌ Access token não encontrado nas credenciais do cliente OAuth2');
    console.error('   Credenciais disponíveis:', Object.keys(credentials));
    return null;
  }
  
  // Garante que o auth está configurado corretamente
  // O googleapis usa o auth automaticamente, mas vamos garantir que está válido
  console.log('✅ Criando instância do Calendar API com auth válido');
  console.log('   Access token presente:', !!credentials.access_token);
  console.log('   Token expira em:', credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : 'não fornecido');
  console.log('   Scopes:', credentials.scope || 'não fornecido');
  
  // IMPORTANTE: Garante que o auth tem um interceptor configurado
  // O OAuth2Client do google-auth-library já tem isso, mas vamos garantir
  // que as credenciais estão corretas antes de criar a API
  
  // IMPORTANTE: O googleapis usa o OAuth2Client através do método request()
  // que automaticamente adiciona o header Authorization com o access_token
  // Mas precisamos garantir que o auth está configurado corretamente
  
  // Verifica se o auth tem o método request (deve ter, é OAuth2Client)
  if (typeof auth.request !== 'function') {
    console.error('❌ O auth não tem método request() - não é um OAuth2Client válido');
    return null;
  }
  
  // IMPORTANTE: O googleapis pode ter problemas se o auth não estiver totalmente sincronizado
  // Vamos garantir que o auth está atualizado e configurado corretamente ANTES de criar a API
  
  // Força uma verificação e renovação do token se necessário
  const now = Date.now();
  const expiryTime = credentials.expiry_date || 0;
  const timeUntilExpiry = expiryTime - now;
  
  // Se o token expira em menos de 5 minutos, renova AGORA
  if (timeUntilExpiry < 300000 && account) {
    console.log('   Token expira em breve, renovando antes de criar API...');
    try {
      const { credentials: newCredentials } = await auth.refreshAccessToken();
      auth.setCredentials({
        ...newCredentials,
        refresh_token: credentials.refresh_token || account.refreshToken,
      });
      console.log('   Token renovado com sucesso antes de criar API');
    } catch (refreshError) {
      console.error('   Erro ao renovar token:', refreshError);
    }
  }
  
  // IMPORTANTE: Garante que o auth tem um interceptor configurado
  // O OAuth2Client precisa ter o método on('tokens') configurado para o googleapis funcionar corretamente
  // Vamos verificar se o auth está configurado para atualizar tokens automaticamente
  
  // Cria a instância do Calendar API
  // O googleapis usa o auth através de um interceptor que adiciona o header Authorization
  // Mas pode haver problemas se o auth não estiver totalmente configurado
  const calendar = google.calendar({ 
    version: 'v3', 
    auth: auth, // Passa explicitamente o auth
  });
  
  // Log adicional para debug
  console.log('   Instância do Calendar API criada');
  console.log('   Auth type:', auth.constructor.name);
  console.log('   Auth tem método request:', typeof auth.request === 'function');
  console.log('   Access token (primeiros 20 chars):', auth.credentials.access_token?.substring(0, 20) + '...');
  console.log('   Token expira em:', auth.credentials.expiry_date ? new Date(auth.credentials.expiry_date).toISOString() : 'não fornecido');
  
  return calendar;
}

/**
 * Verifica se o usuário tem Google Calendar conectado
 * @param userId - ID do usuário (opcional)
 * @returns true se conectado, false caso contrário
 */
export async function isGoogleCalendarConnected(userId?: string): Promise<boolean> {
  try {
    await connectDB();
    const user = userId || getUserId();
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
    const user = userId || getUserId();
    const account = await GoogleCalendarAccount.findOne({ userId: user }).lean();
    return account;
  } catch (error) {
    console.error('❌ Erro ao obter conta Google Calendar:', error);
    return null;
  }
}
