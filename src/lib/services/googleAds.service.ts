import { GoogleAdsApi, enums } from 'google-ads-api';
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

  return googleAdsClient;
}

/**
 * Busca o refresh_token do MongoDB para um usuário e customerId específicos
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890)
 * @returns Refresh token armazenado no banco
 */
/**
 * Busca o refresh_token do MongoDB (reaproveitando do Google Calendar)
 * 
 * IMPORTANTE: Como ambos usam o mesmo projeto OAuth, o mesmo refresh_token funciona para ambos.
 * Não precisamos de um modelo separado para Google Ads - reutilizamos o do Google Calendar.
 * 
 * @param userId - ID do usuário
 * @returns Refresh token armazenado no banco (do Google Calendar)
 */
async function getRefreshTokenFromDB(userId: string): Promise<string> {
  // Conecta ao banco de dados
  await connectDB();

  // Importa o modelo do Google Calendar (reaproveitamos o refresh_token)
  const GoogleCalendarAccount = (await import('@/lib/models/GoogleCalendarAccount')).default;

  // Busca a conta do Google Calendar (que contém o refresh_token)
  const account = await GoogleCalendarAccount.findOne({ userId: userId }).lean();

  if (!account) {
    throw new Error(
      `Conta do Google Calendar não encontrada para userId: ${userId}. Autorize primeiro através do OAuth do Google Calendar.`
    );
  }

  if (!account.refreshToken || account.refreshToken.trim() === '') {
    throw new Error('Refresh token não encontrado na conta. Autorize novamente através do OAuth do Google Calendar.');
  }

  console.log(`✅ Refresh token recuperado do MongoDB (reaproveitando do Google Calendar) para userId: ${userId}`);

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
export async function getCustomer(userId: string, customerId: string) {
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

  // Busca o refresh_token do MongoDB (reaproveitando do Google Calendar)
  const refreshToken = await getRefreshTokenFromDB(userId);

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
      attributes: attributes as any,
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

/**
 * Interface para os dados de criação de campanha
 */
export interface CreateCampaignData {
  campaignName: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  dailyBudget: number; // em centavos (ex: 10000 = R$ 100,00)
  startDate?: string; // formato: YYYY-MM-DD
  endDate?: string; // formato: YYYY-MM-DD
  locations: string[]; // códigos de localização (ex: ['BR'])
  language: string; // código de idioma (ex: 'pt-BR')
  manualCpc: number; // em centavos (ex: 100 = R$ 1,00)
  adGroupName: string;
  adGroupCpc?: number; // em centavos (opcional)
  keywords: Array<{ keyword: string; matchType: 'BROAD' | 'PHRASE' | 'EXACT' }>;
  adTitles: string[]; // pelo menos 1 título
  adDescriptions: string[]; // pelo menos 1 descrição
  finalUrl: string;
  displayPath?: string; // caminho de exibição (opcional)
}

/**
 * Cria uma campanha completa no Google Ads
 * Inclui: Campaign Budget, Campaign, Ad Group, Keywords e Ad
 * 
 * @param userId - ID do usuário
 * @param customerId - ID da conta do Google Ads (formato: 1234567890)
 * @param data - Dados da campanha a ser criada
 * @returns IDs dos recursos criados (campaign, budget, adGroup, ad)
 */
export async function createCampaign(
  userId: string,
  customerId: string,
  data: CreateCampaignData
) {
  try {
    console.log('🚀 Criando campanha no Google Ads...');
    console.log(`👤 User ID: ${userId}`);
    console.log(`🏢 Customer ID: ${customerId}`);
    console.log(`📝 Nome da campanha: ${data.campaignName}`);

    // Obtém a instância do Customer (busca refresh_token automaticamente)
    const customer = await getCustomer(userId, customerId);

    // 1. Criar Campaign Budget
    console.log('💰 Criando orçamento da campanha...');
    const budgetResourceName = `customers/${customerId}/campaignBudgets/-1`;
    const budgetOperation = {
      create: {
        name: `${data.campaignName} - Budget`,
        amount_micros: data.dailyBudget * 10000, // converte centavos para micros (1 real = 1.000.000 micros)
        delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        period: enums.BudgetPeriod.DAILY,
      },
    };

    const budgetResponse = await customer.campaignBudgets.create({
      resource_name: budgetResourceName,
      ...budgetOperation.create,
    });

    const budgetId = budgetResponse.results?.[0]?.resource_name?.split('/')?.pop();
    console.log(`✅ Orçamento criado: ${budgetId}`);

    // 2. Criar Campaign
    console.log('📢 Criando campanha...');
    const campaignResourceName = `customers/${customerId}/campaigns/-2`;
    const campaignOperation = {
      create: {
        name: data.campaignName,
        advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
        status: data.status === 'ENABLED' ? enums.CampaignStatus.ENABLED : enums.CampaignStatus.PAUSED,
        campaign_budget: budgetResourceName.replace('-1', budgetId || ''),
        manual_cpc: {
          enhanced_cpc_enabled: false,
        },
        network_settings: {
          target_google_search: true,
          target_search_network: true,
          target_content_network: false,
          target_partner_search_network: false,
        },
        ...(data.startDate && { start_date: data.startDate.replace(/-/g, '') }),
        ...(data.endDate && { end_date: data.endDate.replace(/-/g, '') }),
      },
    };

    const campaignResponse = await customer.campaigns.create({
      resource_name: campaignResourceName,
      ...campaignOperation.create,
    });

    const campaignId = campaignResponse.results?.[0]?.resource_name?.split('/')?.pop();
    console.log(`✅ Campanha criada: ${campaignId}`);

    // 3. Configurar targeting (localizações e idioma)
    console.log('🌍 Configurando targeting...');
    const campaignCriterionOperations = [];

    // Adicionar localizações
    for (const locationCode of data.locations) {
      campaignCriterionOperations.push({
        create: {
          campaign: `customers/${customerId}/campaigns/${campaignId}`,
          location: {
            geo_target_constant: `geoTargetConstants/${locationCode}`,
          },
          type: enums.CriterionType.LOCATION,
        },
      });
    }

    // Adicionar idioma
    const languageCode = data.language.split('-')[0].toUpperCase(); // 'pt-BR' -> 'PT'
    campaignCriterionOperations.push({
      create: {
        campaign: `customers/${customerId}/campaigns/${campaignId}`,
        language: {
          language_constant: `languageConstants/${languageCode}`,
        },
        type: enums.CriterionType.LANGUAGE,
      },
    });

    if (campaignCriterionOperations.length > 0) {
      await customer.campaignCriteria.batchCreate(campaignCriterionOperations);
      console.log('✅ Targeting configurado');
    }

    // 4. Criar Ad Group
    console.log('📦 Criando grupo de anúncios...');
    const adGroupResourceName = `customers/${customerId}/adGroups/-3`;
    const adGroupOperation = {
      create: {
        name: data.adGroupName,
        campaign: `customers/${customerId}/campaigns/${campaignId}`,
        status: enums.AdGroupStatus.ENABLED,
        cpc_bid_micros: (data.adGroupCpc || data.manualCpc) * 10000, // converte centavos para micros
      },
    };

    const adGroupResponse = await customer.adGroups.create({
      resource_name: adGroupResourceName,
      ...adGroupOperation.create,
    });

    const adGroupId = adGroupResponse.results?.[0]?.resource_name?.split('/')?.pop();
    console.log(`✅ Grupo de anúncios criado: ${adGroupId}`);

    // 5. Criar Keywords
    console.log('🔑 Criando palavras-chave...');
    const keywordOperations = data.keywords.map((kw, index) => ({
      create: {
        ad_group: `customers/${customerId}/adGroups/${adGroupId}`,
        keyword: {
          text: kw.keyword,
          match_type:
            kw.matchType === 'BROAD'
              ? enums.KeywordMatchType.BROAD
              : kw.matchType === 'PHRASE'
              ? enums.KeywordMatchType.PHRASE
              : enums.KeywordMatchType.EXACT,
        },
        cpc_bid_micros: data.manualCpc * 10000, // converte centavos para micros
      },
    }));

    if (keywordOperations.length > 0) {
      await customer.adGroupCriteria.batchCreate(keywordOperations);
      console.log(`✅ ${keywordOperations.length} palavra(s)-chave criada(s)`);
    }

    // 6. Criar Ad (Expanded Text Ad)
    console.log('📄 Criando anúncio...');
    const adResourceName = `customers/${customerId}/ads/-4`;
    const adOperation = {
      create: {
        ad_group: `customers/${customerId}/adGroups/${adGroupId}`,
        expanded_text_ad: {
          headline_part1: data.adTitles[0] || '',
          headline_part2: data.adTitles[1] || '',
          headline_part3: data.adTitles[2] || '',
          description: data.adDescriptions[0] || '',
          description2: data.adDescriptions[1] || '',
          path1: data.displayPath?.split('/')[0] || '',
          path2: data.displayPath?.split('/')[1] || '',
          final_urls: [data.finalUrl],
        },
        status: enums.AdGroupAdStatus.ENABLED,
      },
    };

    const adResponse = await customer.ads.create({
      resource_name: adResourceName,
      ...adOperation.create,
    });

    const adId = adResponse.results?.[0]?.resource_name?.split('/')?.pop();
    console.log(`✅ Anúncio criado: ${adId}`);

    console.log('✅ Campanha criada com sucesso!');

    return {
      success: true,
      campaignId,
      budgetId,
      adGroupId,
      adId,
      message: 'Campanha criada com sucesso no Google Ads',
    };
  } catch (error) {
    console.error('❌ Erro ao criar campanha:', error);

    // Trata erros específicos da Google Ads API
    if (error instanceof Error) {
      // Erro de autenticação
      if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
        throw new Error('Token de autenticação inválido ou expirado. Renove o refresh_token.');
      }

      // Erro de permissão
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Sem permissão para criar campanhas nesta conta do Google Ads.');
      }

      // Erro de validação
      if (error.message.includes('INVALID_ARGUMENT') || error.message.includes('FIELD_ERROR')) {
        throw new Error(`Erro de validação: ${error.message}`);
      }
    }

    throw error;
  }
}
