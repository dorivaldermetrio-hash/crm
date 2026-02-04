/**
 * Cliente Google Ads API
 * 
 * Fornece funções para obter um cliente autenticado do Google Ads
 * usando o refresh_token armazenado no MongoDB (reaproveitando do Google Calendar)
 * 
 * IMPORTANTE: Este módulo reutiliza as credenciais OAuth do Google Calendar
 * e o refresh_token armazenado, já que ambos usam o mesmo projeto no Google Cloud.
 */

import { GoogleAdsApi } from 'google-ads-api';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';
import { getUserId } from '@/lib/utils/getUserId';

// Instância única do cliente Google Ads (singleton)
let googleAdsClient: GoogleAdsApi | null = null;

/**
 * Inicializa e retorna o cliente Google Ads API
 * Usa padrão singleton para reutilizar a mesma instância
 * 
 * Reutiliza GOOGLE_CALENDAR_CLIENT_ID e GOOGLE_CALENDAR_CLIENT_SECRET
 * pois ambos usam o mesmo projeto no Google Cloud
 */
function getGoogleAdsClient(): GoogleAdsApi {
  if (googleAdsClient) {
    return googleAdsClient;
  }

  // Obtém as variáveis de ambiente
  // Reutiliza as credenciais do Google Calendar (mesmo projeto no Google Cloud)
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  // Valida se as variáveis de ambiente estão configuradas
  if (!clientId) {
    throw new Error('GOOGLE_CALENDAR_CLIENT_ID não está configurado no .env.local');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_CALENDAR_CLIENT_SECRET não está configurado no .env.local');
  }

  if (!developerToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN não está configurado no .env.local');
  }

  // Cria e retorna a instância do cliente
  googleAdsClient = new GoogleAdsApi({
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: developerToken,
  });

  console.log('✅ Cliente Google Ads API inicializado com sucesso');
  console.log('   Usando credenciais do Google Calendar (mesmo projeto)');
  console.log('   Login Customer ID (MCC): 7221154001');

  return googleAdsClient;
}

/**
 * Busca o refresh_token do MongoDB (reaproveitando do Google Calendar)
 * 
 * @param userId - ID do usuário
 * @returns Refresh token armazenado no banco
 */
async function getRefreshTokenFromDB(userId: string): Promise<string> {
  // Conecta ao banco de dados
  await connectDB();

  // Busca a conta do Google Calendar (que contém o refresh_token)
  // Como ambos usam o mesmo projeto OAuth, o mesmo refresh_token funciona para ambos
  const account = await GoogleCalendarAccount.findOne({ userId: userId }).lean();

  if (!account) {
    throw new Error(
      `Conta do Google Calendar não encontrada para userId: ${userId}. Autorize primeiro através do OAuth.`
    );
  }

  if (!account.refreshToken || account.refreshToken.trim() === '') {
    throw new Error('Refresh token não encontrado na conta. Autorize novamente através do OAuth.');
  }

  console.log(`✅ Refresh token recuperado do MongoDB para userId: ${userId}`);

  return account.refreshToken;
}

/**
 * Limpa o customer_id removendo traços e validando formato
 * 
 * @param customerId - ID da conta do Google Ads (pode ter traços)
 * @returns Customer ID limpo (apenas números, 10 dígitos)
 */
export function cleanCustomerId(customerId: string): string {
  // Remove hífens e espaços
  const clean = customerId.replace(/[-\s]/g, '');

  // Valida formato (deve ter 10 dígitos)
  if (!/^\d{10}$/.test(clean)) {
    throw new Error('customerId deve ter 10 dígitos (formato: 1234567890)');
  }

  return clean;
}

/**
 * Obtém uma instância de Customer para interagir com uma conta específica do Google Ads
 * Busca o refresh_token automaticamente do MongoDB (reaproveitando do Google Calendar)
 * 
 * @param userId - ID do usuário (opcional, usa getUserId se não fornecido)
 * @param customerId - ID da conta do Google Ads (formato: 1234567890 ou 123-456-7890)
 * @returns Instância do Customer configurada
 */
export async function getGoogleAdsCustomer(userId?: string, customerId?: string) {
  // Valida parâmetros
  const user = userId || await getUserId();
  
  // Se customerId não foi fornecido, tenta obter do .env.local
  let finalCustomerId = customerId || process.env.GOOGLE_ADS_CUSTOMER_ID;
  
  if (!finalCustomerId) {
    throw new Error('customerId é obrigatório. Forneça como parâmetro ou configure GOOGLE_ADS_CUSTOMER_ID no .env.local');
  }

  // Limpa o customer_id (remove traços)
  const cleanCustomerIdValue = cleanCustomerId(finalCustomerId);

  // Busca o refresh_token do MongoDB (reaproveitando do Google Calendar)
  const refreshToken = await getRefreshTokenFromDB(user);

  // Obtém o cliente Google Ads
  const client = getGoogleAdsClient();

  // Cria e retorna a instância do Customer seguindo o padrão da documentação oficial
  // customer_id: ID da subconta
  // login_customer_id: ID da MCC de teste
  // refresh_token: token de autenticação do banco
  const customer = client.Customer({
    customer_id: cleanCustomerIdValue,
    login_customer_id: '7221154001', // ID da MCC de Teste
    refresh_token: refreshToken,
  });

  console.log(`✅ Instância de Customer criada para userId: ${user}, customerId: ${cleanCustomerIdValue}, loginCustomerId: 7221154001`);

  return customer;
}

/**
 * Verifica se o usuário tem Google Calendar conectado (necessário para Google Ads)
 * @param userId - ID do usuário (opcional)
 * @returns true se conectado, false caso contrário
 */
export async function isGoogleAdsReady(userId?: string): Promise<boolean> {
  try {
    await connectDB();
    const user = userId || await getUserId();
    const account = await GoogleCalendarAccount.findOne({ userId: user }).lean();
    
    // Verifica se tem refresh_token e se o developer token está configurado
    const hasRefreshToken = !!account && !!account.refreshToken;
    const hasDeveloperToken = !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const hasCustomerId = !!process.env.GOOGLE_ADS_CUSTOMER_ID;
    
    return hasRefreshToken && hasDeveloperToken && hasCustomerId;
  } catch (error) {
    console.error('❌ Erro ao verificar se Google Ads está pronto:', error);
    return false;
  }
}
