import { GoogleAdsApi, CustomerInstance, enums } from 'google-ads-api';
import connectDB from '@/lib/db';
import GoogleAdsAccount from '@/lib/models/GoogleAdsAccount';

/**
 * Service para interagir com a Google Ads API
 * 
 * Este service fornece funções para:
 * - Inicializar o cliente Google Ads
 * - Buscar refresh_token do MongoDB
 * - Obter instância de customer
 * - Listar campanhas existentes
 * 
 * SEGURANÇA: Os tokens nunca são expostos. Tudo é gerenciado no backend.
 */

// Instância única do cliente Google Ads (singleton)
let googleAdsClient: GoogleAdsApi | null = null;

/**
 * Inicializa e retorna o cliente Google Ads API
 * Usa padrão singleton para reutilizar a mesma instância
 */
function getGoogleAdsClient(): GoogleAdsApi {
  if (googleAdsClient) {
    return googleAdsClient;
  }

  // Obtém as variáveis de ambiente
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  // Valida se as variáveis de ambiente estão configuradas
  if (!clientId) {
    throw new Error('GOOGLE_ADS_CLIENT_ID não está configurado no .env.local');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_ADS_CLIENT_SECRET não está configurado no .env.local');
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

  return googleAdsClient;
}

/**
 * Busca o refresh_token do MongoDB para um usuário e customerId específicos
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890)
 * @returns Refresh token armazenado no banco
 */
async function getRefreshTokenFromDB(userId: string, customerId: string): Promise<string> {
  // Conecta ao banco de dados
  await connectDB();

  // Remove hífens do customerId se houver
  const cleanCustomerId = customerId.replace(/-/g, '');

  // Valida formato do customerId
  if (!/^\d{10}$/.test(cleanCustomerId)) {
    throw new Error('customerId deve ter 10 dígitos (formato: 1234567890)');
  }

  // Busca a conta no banco de dados
  const account = await GoogleAdsAccount.findOne({
    userId: userId,
    customerId: cleanCustomerId,
  }).lean();

  if (!account) {
    throw new Error(
      `Conta do Google Ads não encontrada para userId: ${userId} e customerId: ${cleanCustomerId}. Autorize a conta primeiro através do OAuth.`
    );
  }

  if (!account.refreshToken || account.refreshToken.trim() === '') {
    throw new Error('Refresh token não encontrado na conta. Autorize novamente através do OAuth.');
  }

  console.log(`✅ Refresh token recuperado do MongoDB para customerId: ${cleanCustomerId}`);

  return account.refreshToken;
}

/**
 * Obtém uma instância de Customer para interagir com uma conta específica do Google Ads
 * Busca o refresh_token automaticamente do MongoDB
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890, sem hífens)
 * @returns Instância do Customer configurada
 */
export async function getCustomer(userId: string, customerId: string): Promise<CustomerInstance> {
  // Valida parâmetros
  if (!userId || userId.trim() === '') {
    throw new Error('userId é obrigatório');
  }

  if (!customerId || customerId.trim() === '') {
    throw new Error('customerId é obrigatório');
  }

  // Remove hífens do customerId se houver
  const cleanCustomerId = customerId.replace(/-/g, '');

  // Valida formato do customerId
  if (!/^\d{10}$/.test(cleanCustomerId)) {
    throw new Error('customerId deve ter 10 dígitos (formato: 1234567890)');
  }

  // Busca o refresh_token do MongoDB
  const refreshToken = await getRefreshTokenFromDB(userId, cleanCustomerId);

  // Obtém o cliente Google Ads
  const client = getGoogleAdsClient();

  // Cria e retorna a instância do Customer
  const customer = client.Customer({
    customer_id: cleanCustomerId,
    refresh_token: refreshToken,
  });

  console.log(`✅ Instância de Customer criada para userId: ${userId}, customerId: ${cleanCustomerId}`);

  return customer;
}

/**
 * Lista todas as campanhas existentes de uma conta do Google Ads
 * Busca o refresh_token automaticamente do MongoDB
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890)
 * @param options - Opções opcionais para filtrar campanhas
 * @returns Array de campanhas com informações básicas
 */
export async function listCampaigns(
  userId: string,
  customerId: string,
  options?: {
    status?: enums.CampaignStatus;
    limit?: number;
  }
) {
  try {
    console.log(`📋 Listando campanhas para userId: ${userId}, customerId: ${customerId}...`);

    // Obtém a instância do Customer (busca refresh_token automaticamente)
    const customer = await getCustomer(userId, customerId);

    // Prepara os atributos que serão retornados
    const attributes = [
      'campaign.id',
      'campaign.name',
      'campaign.status',
      'campaign.advertising_channel_type',
      'campaign.start_date',
      'campaign.end_date',
      'campaign.budget',
    ];

    // Prepara as constraints (filtros)
    const constraints: any = {};

    // Filtra por status se fornecido (padrão: apenas campanhas ativas)
    if (options?.status !== undefined) {
      constraints['campaign.status'] = options.status;
    } else {
      // Por padrão, lista apenas campanhas ativas
      constraints['campaign.status'] = enums.CampaignStatus.ENABLED;
    }

    // Executa a query para obter as campanhas
    const campaigns = await customer.report({
      entity: 'campaign',
      attributes: attributes,
      constraints: constraints,
      limit: options?.limit || 1000, // Limite padrão de 1000 campanhas
    });

    console.log(`✅ ${campaigns.length} campanha(s) encontrada(s)`);

    // Formata os resultados para facilitar o uso
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      id: campaign.campaign?.id || null,
      name: campaign.campaign?.name || null,
      status: campaign.campaign?.status || null,
      advertisingChannelType: campaign.campaign?.advertising_channel_type || null,
      startDate: campaign.campaign?.start_date || null,
      endDate: campaign.campaign?.end_date || null,
      budget: campaign.campaign?.budget || null,
    }));

    return {
      success: true,
      total: formattedCampaigns.length,
      campaigns: formattedCampaigns,
    };
  } catch (error) {
    console.error('❌ Erro ao listar campanhas:', error);

    // Trata erros específicos da Google Ads API
    if (error instanceof Error) {
      // Erro de autenticação
      if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
        throw new Error('Token de autenticação inválido ou expirado. Renove o refresh_token.');
      }

      // Erro de permissão
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Sem permissão para acessar esta conta do Google Ads.');
      }

      // Erro de customer ID inválido
      if (error.message.includes('INVALID_CUSTOMER_ID')) {
        throw new Error('Customer ID inválido. Verifique o formato (10 dígitos).');
      }
    }

    throw error;
  }
}

/**
 * Função de teste para verificar a conexão com a Google Ads API
 * Lista as primeiras 10 campanhas ativas
 * Busca o refresh_token automaticamente do MongoDB
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890)
 * @returns Resultado do teste com informações das campanhas
 */
export async function testConnection(userId: string, customerId: string) {
  try {
    console.log('🧪 Testando conexão com Google Ads API...');
    console.log(`👤 User ID: ${userId}`);
    console.log(`🏢 Customer ID: ${customerId}`);

    // Testa listando campanhas (limitado a 10 para teste)
    const result = await listCampaigns(userId, customerId, {
      status: enums.CampaignStatus.ENABLED,
      limit: 10,
    });

    console.log('✅ Teste de conexão bem-sucedido!');

    return {
      success: true,
      message: 'Conexão com Google Ads API estabelecida com sucesso',
      customerId: customerId,
      campaignsFound: result.total,
      sampleCampaigns: result.campaigns.slice(0, 5), // Retorna apenas 5 como exemplo
    };
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error: error,
    };
  }
}

