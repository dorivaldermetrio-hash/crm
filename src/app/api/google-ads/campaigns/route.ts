import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsCustomer, cleanCustomerId } from '@/lib/googleAds';
import { enums, resources, toMicros, ResourceNames, MutateOperation } from 'google-ads-api';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para listar campanhas do Google Ads
 * GET /api/google-ads/campaigns
 * 
 * Query params:
 * - customerId: ID da conta do Google Ads (opcional, usa GOOGLE_ADS_CUSTOMER_ID do .env se não fornecido)
 * - userId: ID do usuário (opcional, padrão: obtido da sessão/mock)
 * - status: Status das campanhas (opcional: ENABLED, PAUSED, REMOVED)
 * - limit: Limite de resultados (opcional, padrão: 100)
 * 
 * O refresh_token é buscado automaticamente do MongoDB (reaproveitando do Google Calendar).
 * 
 * Exemplo:
 * GET /api/google-ads/campaigns
 * GET /api/google-ads/campaigns?customerId=1234567890
 * GET /api/google-ads/campaigns?customerId=123-456-7890&status=ENABLED&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém os parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const customerIdParam = searchParams.get('customerId');
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    
    // Obtém userId (mockado por enquanto, será da sessão em produção)
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam || await getUserId(request);

    // Obtém customerId (pode vir do query param ou do .env)
    const customerId = customerIdParam || process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId é obrigatório. Forneça via query param (?customerId=1234567890) ou configure GOOGLE_ADS_CUSTOMER_ID no .env.local',
        },
        { status: 400 }
      );
    }

    // Limpa o customer_id (remove traços)
    let cleanCustomerIdValue: string;
    try {
      cleanCustomerIdValue = cleanCustomerId(customerId);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'customerId inválido',
        },
        { status: 400 }
      );
    }

    // Prepara opções para listagem
    const options: {
      status?: enums.CampaignStatus;
      limit?: number;
    } = {};

    // Processa status se fornecido
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase();
      if (statusUpper === 'ENABLED') {
        options.status = enums.CampaignStatus.ENABLED;
      } else if (statusUpper === 'PAUSED') {
        options.status = enums.CampaignStatus.PAUSED;
      } else if (statusUpper === 'REMOVED') {
        options.status = enums.CampaignStatus.REMOVED;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Status inválido. Use: ENABLED, PAUSED ou REMOVED',
          },
          { status: 400 }
        );
      }
    }

    // Processa limit se fornecido
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 10000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Limit deve ser um número entre 1 e 10000',
          },
          { status: 400 }
        );
      }
      options.limit = limit;
    } else {
      options.limit = 100; // Limite padrão
    }

    console.log('📋 Listando campanhas do Google Ads...');
    console.log('👤 User ID:', userId);
    console.log('📝 Customer ID:', cleanCustomerIdValue);
    console.log('📝 Status:', options.status || 'TODOS');
    console.log('📝 Limit:', options.limit);

    // Obtém a instância do Customer (busca refresh_token automaticamente do MongoDB)
    const customer = await getGoogleAdsCustomer(userId, cleanCustomerIdValue);

    // Prepara os atributos que serão retornados
    const attributes = [
      'campaign.id',
      'campaign.name',
      'campaign.status',
      'campaign.advertising_channel_type',
      'campaign.start_date',
      'campaign.end_date',
    ];

    // Prepara as constraints (filtros)
    const constraints: any = {};

    // Filtra por status se fornecido
    if (options.status !== undefined) {
      constraints['campaign.status'] = options.status;
    }

    // Executa a query para obter as campanhas
    const campaigns = await customer.report({
      entity: 'campaign',
      attributes: attributes as any,
      constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
      limit: options.limit,
    });

    console.log(`✅ ${campaigns.length} campanha(s) encontrada(s)`);

    // Formata os resultados para facilitar o uso
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      id: campaign.campaign?.id?.toString() || null,
      name: campaign.campaign?.name || null,
      status: campaign.campaign?.status || null,
      advertisingChannelType: campaign.campaign?.advertising_channel_type || null,
      startDate: campaign.campaign?.start_date || null,
      endDate: campaign.campaign?.end_date || null,
    }));

    return NextResponse.json(
      {
        success: true,
        total: formattedCampaigns.length,
        customerId: cleanCustomerIdValue,
        campaigns: formattedCampaigns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao listar campanhas:', error);

    // Trata erros específicos
    if (error instanceof Error) {
      // Erro de conta não encontrada no banco
      if (error.message.includes('Conta do Google Calendar não encontrada')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize o Google Calendar primeiro através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 404 }
        );
      }

      // Erro de refresh token não encontrado
      if (error.message.includes('Refresh token não encontrado')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize o Google Calendar novamente através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 401 }
        );
      }

      // Erro de autenticação
      if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token de autenticação inválido ou expirado. Renove o refresh_token autorizando novamente.',
            hint: 'Autorize o Google Calendar novamente através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 401 }
        );
      }

      // Erro de permissão
      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sem permissão para acessar esta conta do Google Ads.',
            hint: 'Verifique se a conta tem permissão para acessar este customer_id',
          },
          { status: 403 }
        );
      }

      // Erro de customer ID
      if (error.message.includes('customerId deve ter 10 dígitos')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'O customer_id deve ter 10 dígitos (formato: 1234567890)',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao listar campanhas',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para criar campanhas do Google Ads
 * POST /api/google-ads/campaigns
 * 
 * Body (JSON):
 * {
 *   campaignName: string;
 *   status: 'ENABLED' | 'PAUSED' | 'REMOVED';
 *   dailyBudget: number; // em centavos (ex: 10000 = R$ 100,00)
 *   startDate?: string; // formato: YYYY-MM-DD
 *   endDate?: string; // formato: YYYY-MM-DD
 *   locations: string[]; // códigos de localização (ex: ['BR'])
 *   language: string; // código de idioma (ex: 'pt-BR')
 *   manualCpc: number; // em centavos (ex: 100 = R$ 1,00)
 *   adGroupName: string;
 *   adGroupCpc?: number; // em centavos (opcional)
 *   keywords: Array<{ keyword: string; matchType: 'BROAD' | 'PHRASE' | 'EXACT' }>;
 *   adTitles: string[]; // pelo menos 1 título
 *   adDescriptions: string[]; // pelo menos 1 descrição
 *   finalUrl: string;
 *   displayPath?: string; // caminho de exibição (opcional)
 *   customerId?: string; // opcional, usa GOOGLE_ADS_CUSTOMER_ID do .env se não fornecido
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignName,
      status,
      dailyBudget,
      startDate,
      endDate,
      locations,
      language,
      manualCpc,
      adGroupName,
      adGroupCpc,
      keywords,
      adTitles,
      adDescriptions,
      finalUrl,
      displayPath,
      customerId: customerIdParam,
    } = body;

    // Validações básicas
    if (!campaignName || !dailyBudget || !locations || !language || !manualCpc || !adGroupName || !keywords || !adTitles || !adDescriptions || !finalUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios faltando: campaignName, dailyBudget, locations, language, manualCpc, adGroupName, keywords, adTitles, adDescriptions, finalUrl',
        },
        { status: 400 }
      );
    }

    // Obtém userId
    const userId = await getUserId(request);

    // Obtém customerId (pode vir do body ou do .env)
    const customerId = customerIdParam || process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId é obrigatório. Forneça no body ou configure GOOGLE_ADS_CUSTOMER_ID no .env.local',
        },
        { status: 400 }
      );
    }

    // Limpa o customer_id (remove traços)
    let cleanCustomerIdValue: string;
    try {
      cleanCustomerIdValue = cleanCustomerId(customerId);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'customerId inválido',
        },
        { status: 400 }
      );
    }

    console.log('🚀 Criando campanha no Google Ads...');
    console.log(`👤 User ID: ${userId}`);
    console.log(`🏢 Customer ID: ${cleanCustomerIdValue}`);
    console.log(`📝 Nome da campanha: ${campaignName}`);

    // Obtém a instância do Customer (busca refresh_token automaticamente do MongoDB)
    const customer = await getGoogleAdsCustomer(userId, cleanCustomerIdValue);

    // 1. Criar Campaign Budget e Campaign atomicamente
    console.log('💰 Criando orçamento e campanha atomicamente...');
    
    // Create a resource name with a temporary resource id (-1)
    const budgetResourceName = ResourceNames.campaignBudget(
      cleanCustomerIdValue,
      "-1"
    );

    // Cria as operações atomicamente (Budget e Campaign juntos)
    const operations: any[] = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          name: `${campaignName} - Budget`,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          amount_micros: dailyBudget, // já vem em micros do frontend
        },
      },
      {
        entity: "campaign",
        operation: "create",
        resource: {
          name: campaignName,
          advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
          status: status === 'ENABLED' ? enums.CampaignStatus.ENABLED : enums.CampaignStatus.PAUSED,
          contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING, // Campo obrigatório - nome correto é contains_eu_political_advertising com valor do enum!
          manual_cpc: {
            enhanced_cpc_enabled: false,
          },
          campaign_budget: budgetResourceName,
          network_settings: {
            target_google_search: true,
            target_search_network: true,
            target_content_network: false,
            target_partner_search_network: false,
          },
          ...(startDate && { start_date: startDate.replace(/-/g, '') }),
          ...(endDate && { end_date: endDate.replace(/-/g, '') }),
        },
      },
    ];

    let result;
    try {
      result = await customer.mutateResources(operations);
    } catch (error: any) {
      console.error('❌ Erro ao criar budget/campanha:', error);
      throw error;
    }

    // Extrai os resource_names da resposta
    const budgetResult = result.mutate_operation_responses?.[0]?.campaign_budget_result;
    const campaignResult = result.mutate_operation_responses?.[1]?.campaign_result;

    const budgetResourceNameFinal = budgetResult?.resource_name;
    const campaignResourceName = campaignResult?.resource_name;

    if (!budgetResourceNameFinal || !campaignResourceName) {
      console.error('❌ Resultado completo:', JSON.stringify(result, null, 2));
      throw new Error('Falha ao criar budget ou campanha - resource_name não encontrado na resposta');
    }

    const budgetId = budgetResourceNameFinal.split('/').pop();
    const campaignId = campaignResourceName.split('/').pop();
    
    console.log(`✅ Budget criado: ${budgetId}`);
    console.log(`✅ Campanha criada: ${campaignId}`);

    // 3. Configurar targeting (localizações e idioma)
    // NOTA: Temporariamente comentado para testar se a campanha completa é criada
    // Os erros de targeting não devem bloquear a criação da campanha
    /*
    console.log('🌍 Configurando targeting...');
    const criterionOperations: any[] = [];

    // Adicionar localizações
    for (const locationCode of locations) {
      criterionOperations.push({
        entity: 'campaign_criterion',
        operation: 'create',
        resource: {
          campaign: campaignResourceName,
          location: {
            geo_target_constant: `geoTargetConstants/${locationCode}`,
          },
          type: enums.CriterionType.LOCATION,
        },
      });
    }

    // Adicionar idioma
    // Para português do Brasil, o código do idioma é 1000 (português)
    const languageMap: Record<string, string> = {
      'pt-BR': '1000', // Português
      'pt': '1000',    // Português
      'en-US': '1001', // Inglês
      'en': '1001',    // Inglês
      'es': '1002',    // Espanhol
      'es-ES': '1002', // Espanhol
    };
    
    const languageCode = languageMap[language] || languageMap[language.split('-')[0]] || '1000';
    criterionOperations.push({
      entity: 'campaign_criterion',
      operation: 'create',
      resource: {
        campaign: campaignResourceName,
        language: {
          language_constant: `languageConstants/${languageCode}`,
        },
        type: enums.CriterionType.LANGUAGE,
      },
    });

    if (criterionOperations.length > 0) {
      try {
        await customer.mutateResources(criterionOperations);
        console.log('✅ Targeting configurado');
      } catch (error: any) {
        console.error('⚠️ Erro ao configurar targeting (continuando mesmo assim):', error);
        // Não bloqueia a criação da campanha se o targeting falhar
      }
    }
    */

    // 4. Criar Ad Group
    console.log('📦 Criando grupo de anúncios...');
    const adGroupResponse = await customer.mutateResources([
      {
        entity: 'ad_group',
        operation: 'create',
        resource: {
          name: adGroupName,
          campaign: campaignResourceName,
          status: enums.AdGroupStatus.ENABLED,
          cpc_bid_micros: (adGroupCpc || manualCpc), // já vem em micros do frontend
        },
      },
    ]);

    const adGroupResourceName = adGroupResponse.mutate_operation_responses?.[0]?.ad_group_result?.resource_name;
    if (!adGroupResourceName) {
      console.error('❌ Ad Group Response completa:', JSON.stringify(adGroupResponse, null, 2));
      throw new Error('Falha ao criar grupo de anúncios');
    }

    const adGroupId = adGroupResourceName.split('/').pop();
    console.log(`✅ Grupo de anúncios criado: ${adGroupId}`);

    // 5. Criar Keywords
    console.log('🔑 Criando palavras-chave...');
    const keywordOperations = keywords.map((kw: any) => ({
      entity: 'ad_group_criterion',
      operation: 'create',
      resource: {
        ad_group: adGroupResourceName,
        keyword: {
          text: kw.keyword,
          match_type:
            kw.matchType === 'BROAD'
              ? enums.KeywordMatchType.BROAD
              : kw.matchType === 'PHRASE'
              ? enums.KeywordMatchType.PHRASE
              : enums.KeywordMatchType.EXACT,
        },
        cpc_bid_micros: manualCpc, // já vem em micros do frontend
      },
    }));

    if (keywordOperations.length > 0) {
      await customer.mutateResources(keywordOperations);
      console.log(`✅ ${keywordOperations.length} palavra(s)-chave criada(s)`);
    }

    // 6. Criar Ad (Responsive Search Ad)
    console.log('📄 Criando anúncio (Responsive Search Ad)...');
    
    // Validação: finalUrl é obrigatório e deve ser uma URL válida
    if (!finalUrl || typeof finalUrl !== 'string' || finalUrl.trim().length === 0) {
      throw new Error('URL final é obrigatória para criar o anúncio');
    }

    // Garante que a URL começa com http:// ou https://
    let finalUrlFormatted = finalUrl.trim();
    if (!finalUrlFormatted.startsWith('http://') && !finalUrlFormatted.startsWith('https://')) {
      finalUrlFormatted = `https://${finalUrlFormatted}`;
    }

    // Responsive Search Ad requer pelo menos 3 headlines e 2 descriptions
    // Garante que temos pelo menos o mínimo necessário
    const headlines = adTitles
      .filter((title) => title.trim().length > 0)
      .slice(0, 15) // Máximo de 15 headlines
      .map((title) => ({ text: title.trim() }));
    
    const descriptions = adDescriptions
      .filter((desc) => desc.trim().length > 0)
      .slice(0, 4) // Máximo de 4 descriptions
      .map((desc) => ({ text: desc.trim() }));

    // Validação: Responsive Search Ad precisa de pelo menos 3 headlines e 2 descriptions
    if (headlines.length < 3) {
      throw new Error('Responsive Search Ad requer pelo menos 3 títulos');
    }
    if (descriptions.length < 2) {
      throw new Error('Responsive Search Ad requer pelo menos 2 descrições');
    }

    console.log('🔍 Dados do anúncio:', {
      headlinesCount: headlines.length,
      descriptionsCount: descriptions.length,
      finalUrl: finalUrlFormatted,
      finalUrlOriginal: finalUrl,
      displayPath,
    });

    // Monta o objeto do anúncio
    // Para Responsive Search Ad, o final_urls deve estar no nível do ad, NÃO dentro de responsive_search_ad
    // Garante que final_urls é um array não vazio
    const finalUrlsArray = [finalUrlFormatted].filter(Boolean);
    if (finalUrlsArray.length === 0) {
      throw new Error('final_urls deve conter pelo menos uma URL válida');
    }

    const adObject: any = {
      responsive_search_ad: {
        headlines: headlines,
        descriptions: descriptions,
      },
      // final_urls deve estar no nível do ad, não dentro de responsive_search_ad
      final_urls: finalUrlsArray, // Array com pelo menos 1 URL válida
    };

    // Adiciona paths apenas se displayPath existir e não estiver vazio
    if (displayPath && displayPath.trim()) {
      const paths = displayPath.split('/').filter(Boolean);
      if (paths[0]) adObject.responsive_search_ad.path1 = paths[0];
      if (paths[1]) adObject.responsive_search_ad.path2 = paths[1];
    }

    console.log('📋 Objeto do anúncio completo:', JSON.stringify(adObject, null, 2));
    console.log('🔍 Verificando final_urls:', {
      noNivelAd: adObject.final_urls,
      arrayLength: adObject.final_urls?.length,
      primeiroElemento: adObject.final_urls?.[0],
      tipo: typeof adObject.final_urls,
      isArray: Array.isArray(adObject.final_urls),
    });

    // Garante que o objeto está correto antes de enviar
    if (!adObject.final_urls || !Array.isArray(adObject.final_urls) || adObject.final_urls.length === 0) {
      throw new Error('final_urls deve ser um array não vazio no nível do ad');
    }

    const adResponse = await customer.mutateResources([
      {
        entity: 'ad_group_ad',
        operation: 'create',
        resource: {
          ad_group: adGroupResourceName,
          ad: adObject,
          status: enums.AdGroupAdStatus.ENABLED,
        },
      },
    ]);

    const adResourceName = adResponse.mutate_operation_responses?.[0]?.ad_group_ad_result?.resource_name;
    if (!adResourceName) {
      console.error('❌ Ad Response completa:', JSON.stringify(adResponse, null, 2));
      throw new Error('Falha ao criar anúncio');
    }

    const adId = adResourceName.split('/').pop();
    console.log(`✅ Anúncio Responsive Search Ad criado: ${adId}`);

    console.log('✅ Campanha criada com sucesso!');

    return NextResponse.json(
      {
        success: true,
        campaignId,
        budgetId,
        adGroupId,
        adId,
        message: 'Campanha criada com sucesso no Google Ads',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar campanha:', error);

    // Log detalhado dos erros da API do Google Ads
    if (error.errors && Array.isArray(error.errors)) {
      console.error(`\n🔴 Total de erros da API: ${error.errors.length}`);
      error.errors.forEach((err: any, index: number) => {
        console.error(`\n🔴 Erro ${index + 1} da API:`);
        console.error('   Error Code:', err.error_code);
        console.error('   Message:', err.message);
        
        if (err.location) {
          console.error('   Location:', JSON.stringify(err.location, null, 2));
          if (err.location.field_path_elements && Array.isArray(err.location.field_path_elements)) {
            const fieldPath = err.location.field_path_elements
              .map((e: any) => e.field_name || e.index || '?')
              .join(' -> ');
            console.error('   🔴 Campo faltante/inválido:', fieldPath);
          }
        }
        
        if (err.trigger) {
          console.error('   Trigger:', err.trigger);
        }
      });
    }

    // Trata erros específicos
    if (error instanceof Error) {
      // Erro de conta não encontrada no banco
      if (error.message.includes('Conta do Google Calendar não encontrada')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize o Google Calendar primeiro através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 404 }
        );
      }

      // Erro de refresh token não encontrado
      if (error.message.includes('Refresh token não encontrado')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            hint: 'Autorize o Google Calendar novamente através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 401 }
        );
      }

      // Erro de autenticação
      if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token de autenticação inválido ou expirado. Renove o refresh_token autorizando novamente.',
            hint: 'Autorize o Google Calendar novamente através do OAuth: GET /api/google-calendar/auth',
          },
          { status: 401 }
        );
      }

      // Erro de permissão
      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sem permissão para criar campanhas nesta conta do Google Ads.',
            hint: 'Verifique se a conta tem permissão para acessar este customer_id',
          },
          { status: 403 }
        );
      }

      // Erro de validação
      if (error.message.includes('INVALID_ARGUMENT') || error.message.includes('FIELD_ERROR')) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro de validação: ${error.message}`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar campanha',
      },
      { status: 500 }
    );
  }
}