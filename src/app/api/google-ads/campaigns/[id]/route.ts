import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsCustomer, cleanCustomerId } from '@/lib/googleAds';
import { getUserId } from '@/lib/utils/getUserId';
import { enums, ResourceNames } from 'google-ads-api';

/**
 * API Route para buscar detalhes completos de uma campanha do Google Ads
 * GET /api/google-ads/campaigns/[id]
 * 
 * Retorna informações detalhadas da campanha, incluindo:
 * - Informações básicas (nome, status, datas)
 * - Orçamento
 * - Grupos de anúncios
 * - Palavras-chave
 * - Anúncios
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;
    const userId = await getUserId(request);
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_ADS_CUSTOMER_ID não configurado',
        },
        { status: 400 }
      );
    }

    const cleanCustomerIdValue = cleanCustomerId(customerId);
    const customer = await getGoogleAdsCustomer(userId, cleanCustomerIdValue);

    console.log(`🔍 Buscando detalhes da campanha ID: ${campaignId}`);

    // Busca informações básicas da campanha
    // Nota: Alguns campos podem não estar disponíveis em todas as versões da API
    const campaigns = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.id',
        'campaign.name',
        'campaign.status',
        'campaign.campaign_budget',
      ] as any,
      constraints: {
        'campaign.id': campaignId,
      },
      limit: 1,
    });

    console.log(`📊 Campanhas encontradas: ${campaigns.length}`);

    if (campaigns.length === 0) {
      console.error(`❌ Campanha ${campaignId} não encontrada`);
      return NextResponse.json(
        {
          success: false,
          error: 'Campanha não encontrada',
        },
        { status: 404 }
      );
    }

    const campaign = campaigns[0].campaign;
    console.log('📋 Dados básicos da campanha:', {
      id: campaign?.id,
      name: campaign?.name,
      status: campaign?.status,
      campaign_budget: campaign?.campaign_budget,
    });

    // Tenta buscar datas usando uma segunda query com campos adicionais
    // Se falhar, as datas ficarão undefined (não são críticas para edição)
    let startDate: string | undefined;
    let endDate: string | undefined;
    try {
      // Tenta buscar datas em uma query separada
      const campaignWithDates = await customer.report({
        entity: 'campaign',
        attributes: [
          'campaign.id',
          'campaign.start_date',
          'campaign.end_date',
        ] as any,
        constraints: {
          'campaign.id': campaignId,
        },
        limit: 1,
      });
      
      if (campaignWithDates.length > 0) {
        const campaignData = campaignWithDates[0].campaign as any;
        startDate = campaignData?.start_date;
        endDate = campaignData?.end_date;
        console.log('📅 Datas da campanha encontradas:', { startDate, endDate });
      }
    } catch (error: any) {
      // Se os campos de data não estiverem disponíveis, apenas loga o aviso
      if (error.message?.includes('Unrecognized fields')) {
        console.warn('⚠️ Campos de data não disponíveis nesta versão da API. Datas não serão exibidas.');
      } else {
        console.warn('⚠️ Erro ao buscar datas da campanha:', error.message);
      }
    }

    // Busca grupos de anúncios da campanha
    const adGroups = await customer.report({
      entity: 'ad_group',
      attributes: [
        'ad_group.id',
        'ad_group.name',
        'ad_group.campaign',
        'ad_group.cpc_bid_micros',
      ] as any,
      constraints: {
        'ad_group.campaign': `customers/${cleanCustomerIdValue}/campaigns/${campaignId}`,
      },
    });

    // Busca palavras-chave dos grupos de anúncios
    const keywords: Array<{
      keyword: string;
      matchType: string;
      adGroupId: string;
      adGroupName: string;
    }> = [];

    for (const adGroup of adGroups) {
      const adGroupId = adGroup.ad_group?.id;
      const adGroupName = adGroup.ad_group?.name || '';
      
      if (adGroupId) {
        try {
          const adGroupKeywords = await customer.report({
            entity: 'ad_group_criterion',
            attributes: [
              'ad_group_criterion.keyword.text',
              'ad_group_criterion.keyword.match_type',
              'ad_group_criterion.ad_group',
            ] as any,
            constraints: {
              'ad_group_criterion.ad_group': `customers/${cleanCustomerIdValue}/adGroups/${adGroupId}`,
              'ad_group_criterion.type': 'KEYWORD',
            },
          });

          for (const keyword of adGroupKeywords) {
            const keywordData = keyword.ad_group_criterion?.keyword;
            if (keywordData?.text) {
              // Converte matchType para string
              let matchTypeStr = 'BROAD';
              const matchType = keywordData.match_type;
              if (typeof matchType === 'number') {
                if (matchType === enums.KeywordMatchType.EXACT) {
                  matchTypeStr = 'EXACT';
                } else if (matchType === enums.KeywordMatchType.PHRASE) {
                  matchTypeStr = 'PHRASE';
                } else {
                  matchTypeStr = 'BROAD';
                }
              } else if (typeof matchType === 'string') {
                matchTypeStr = matchType;
              }
              
              keywords.push({
                keyword: keywordData.text,
                matchType: matchTypeStr,
                adGroupId: adGroupId.toString(),
                adGroupName,
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar palavras-chave do grupo ${adGroupId}:`, error);
        }
      }
    }

    // Busca orçamento da campanha usando o resource_name do budget
    let budgetAmountMicros = 0;
    const budgetResourceName = campaign?.campaign_budget;
    if (budgetResourceName) {
      try {
        const budgetId = budgetResourceName.split('/').pop();
        if (budgetId) {
          console.log(`💰 Buscando orçamento ID: ${budgetId}`);
          const budgets = await customer.report({
            entity: 'campaign_budget',
            attributes: [
              'campaign_budget.id',
              'campaign_budget.amount_micros',
            ] as any,
            constraints: {
              'campaign_budget.id': budgetId,
            },
            limit: 1,
          });

          if (budgets.length > 0) {
            budgetAmountMicros = budgets[0].campaign_budget?.amount_micros || 0;
            console.log(`✅ Orçamento encontrado: ${budgetAmountMicros} micros (R$ ${budgetAmountMicros / 1000000})`);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar orçamento:', error);
      }
    } else {
      console.warn('⚠️ Campanha não tem orçamento associado');
    }

    // Busca CPC manual da campanha
    let manualCpcMicros = 0;
    try {
      const campaignDetails = await customer.report({
        entity: 'campaign',
        attributes: [
          'campaign.id',
          'campaign.manual_cpc.enhanced_cpc_enabled',
        ] as any,
        constraints: {
          'campaign.id': campaignId,
        },
        limit: 1,
      });

      // O CPC manual geralmente está no nível do grupo de anúncios, não da campanha
      // Vamos usar o CPC do primeiro grupo de anúncios como referência
      if (adGroups.length > 0 && adGroups[0].ad_group?.cpc_bid_micros) {
        manualCpcMicros = adGroups[0].ad_group.cpc_bid_micros;
      }
    } catch (error) {
      console.error('Erro ao buscar CPC:', error);
    }

    // Busca anúncios (headlines e descriptions)
    const ads: Array<{
      headlines: string[];
      descriptions: string[];
      finalUrl: string;
    }> = [];

    for (const adGroup of adGroups) {
      const adGroupId = adGroup.ad_group?.id;
      if (adGroupId) {
        try {
          const adGroupAds = await customer.report({
            entity: 'ad_group_ad',
            attributes: [
              'ad_group_ad.ad.responsive_search_ad.headlines',
              'ad_group_ad.ad.responsive_search_ad.descriptions',
              'ad_group_ad.ad.final_urls',
              'ad_group_ad.ad_group',
            ] as any,
            constraints: {
              'ad_group_ad.ad_group': `customers/${cleanCustomerIdValue}/adGroups/${adGroupId}`,
            },
          });

          for (const ad of adGroupAds) {
            const adData = ad.ad_group_ad?.ad;
            const responsiveAd = adData?.responsive_search_ad;
            
            if (responsiveAd) {
              const headlines = responsiveAd.headlines
                ?.map((h: any) => h.text)
                .filter((text: string) => text) || [];
              
              const descriptions = responsiveAd.descriptions
                ?.map((d: any) => d.text)
                .filter((text: string) => text) || [];
              
              const finalUrls = adData?.final_urls || [];
              
              ads.push({
                headlines,
                descriptions,
                finalUrl: finalUrls[0] || '',
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar anúncios do grupo ${adGroupId}:`, error);
        }
      }
    }

    // Função para converter data YYYYMMDD para YYYY-MM-DD
    const formatDateForInput = (dateStr: string | undefined | null): string => {
      if (!dateStr) return '';
      // Se já está no formato YYYY-MM-DD, retorna como está
      if (dateStr.includes('-')) return dateStr;
      // Se está no formato YYYYMMDD, converte para YYYY-MM-DD
      if (dateStr.length === 8) {
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
      }
      return '';
    };

    // Converte status numérico para string se necessário
    const getStatusString = (status: any): string => {
      if (typeof status === 'string') return status;
      if (status === 2) return 'ENABLED';
      if (status === 3) return 'PAUSED';
      if (status === 4) return 'REMOVED';
      return 'ENABLED';
    };

    return NextResponse.json({
      success: true,
      data: {
        id: campaign?.id?.toString(),
        name: campaign?.name || '',
        status: getStatusString(campaign?.status),
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
        dailyBudget: budgetAmountMicros > 0 ? budgetAmountMicros / 1000000 : 0, // Converte para Reais
        manualCpc: manualCpcMicros > 0 ? manualCpcMicros / 1000000 : 0, // Converte para Reais
        adGroups: adGroups.map((ag) => ({
          id: ag.ad_group?.id?.toString(),
          name: ag.ad_group?.name || '',
          cpc: ag.ad_group?.cpc_bid_micros ? ag.ad_group.cpc_bid_micros / 1000000 : 0,
        })),
        keywords: keywords.length > 0 ? keywords.map((k) => ({
          keyword: k.keyword,
          matchType: k.matchType || 'BROAD',
        })) : [],
        ads: ads.length > 0 ? ads[0] : { headlines: [], descriptions: [], finalUrl: '' },
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar detalhes da campanha:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar detalhes da campanha',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para atualizar uma campanha do Google Ads
 * PUT /api/google-ads/campaigns/[id]
 * 
 * Body:
 * - name: Nome da campanha
 * - status: Status (ENABLED, PAUSED)
 * - dailyBudget: Orçamento diário em Reais
 * - startDate: Data de início (YYYY-MM-DD)
 * - endDate: Data de fim (YYYY-MM-DD, opcional)
 * - adGroupName: Nome do grupo de anúncios
 * - adGroupCpc: CPC do grupo em Reais
 * - keywords: Array de { keyword: string, matchType: string }
 * - adTitles: Array de títulos
 * - adDescriptions: Array de descrições
 * - finalUrl: URL final
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;
    const userId = await getUserId(request);
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const body = await request.json();

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_ADS_CUSTOMER_ID não configurado',
        },
        { status: 400 }
      );
    }

    const cleanCustomerIdValue = cleanCustomerId(customerId);
    const customer = await getGoogleAdsCustomer(userId, cleanCustomerIdValue);

    console.log(`🔄 Atualizando campanha ID: ${campaignId}`);
    console.log('📋 Dados recebidos:', JSON.stringify(body, null, 2));

    // Primeiro, busca os dados atuais da campanha para obter os resource_names
    const campaigns = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.id',
        'campaign.name',
        'campaign.status',
        'campaign.campaign_budget',
      ] as any,
      constraints: {
        'campaign.id': campaignId,
      },
      limit: 1,
    });

    if (campaigns.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campanha não encontrada',
        },
        { status: 404 }
      );
    }

    const currentCampaign = campaigns[0].campaign;
    const campaignResourceName = ResourceNames.campaign(cleanCustomerIdValue, campaignId);
    const budgetResourceName = currentCampaign?.campaign_budget;

    // Busca o primeiro ad group da campanha
    const adGroups = await customer.report({
      entity: 'ad_group',
      attributes: [
        'ad_group.id',
        'ad_group.name',
        'ad_group.campaign',
      ] as any,
      constraints: {
        'ad_group.campaign': campaignResourceName,
      },
      limit: 1,
    });

    if (adGroups.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Grupo de anúncios não encontrado para esta campanha',
        },
        { status: 404 }
      );
    }

    const adGroupId = adGroups[0].ad_group?.id?.toString();
    const adGroupResourceName = ResourceNames.adGroup(cleanCustomerIdValue, adGroupId || '');

    // Prepara as operações de atualização
    const operations: any[] = [];

    // 1. Atualizar Budget (se dailyBudget foi alterado)
    if (body.dailyBudget && budgetResourceName) {
      const budgetId = budgetResourceName.split('/').pop();
      if (budgetId) {
        operations.push({
          entity: 'campaign_budget',
          operation: 'update',
          resource: {
            resource_name: budgetResourceName,
            amount_micros: Math.round(parseFloat(body.dailyBudget) * 1000000), // Converte Reais para micros
          },
        });
        console.log(`💰 Atualizando orçamento: ${body.dailyBudget} R$`);
      }
    }

    // 2. Atualizar Campaign (nome, status, datas)
    const campaignUpdate: any = {
      resource_name: campaignResourceName,
    };

    if (body.name) {
      campaignUpdate.name = body.name;
    }

    if (body.status) {
      campaignUpdate.status = body.status === 'ENABLED' 
        ? enums.CampaignStatus.ENABLED 
        : enums.CampaignStatus.PAUSED;
    }

    if (body.startDate && body.startDate.trim()) {
      campaignUpdate.start_date = body.startDate.replace(/-/g, ''); // YYYY-MM-DD -> YYYYMMDD
    }

    // Nota: end_date não pode ser atualizado via API do Google Ads
    // A data de fim só pode ser definida na criação da campanha
    // Para alterar ou remover a data de fim, é necessário fazer manualmente no Google Ads

    operations.push({
      entity: 'campaign',
      operation: 'update',
      resource: campaignUpdate,
    });

    // 3. Atualizar Ad Group (nome e CPC)
    if (adGroupId && (body.adGroupName || body.adGroupCpc)) {
      const adGroupUpdate: any = {
        resource_name: adGroupResourceName,
      };

      if (body.adGroupName) {
        adGroupUpdate.name = body.adGroupName;
      }

      if (body.adGroupCpc) {
        adGroupUpdate.cpc_bid_micros = Math.round(parseFloat(body.adGroupCpc) * 1000000);
      }

      operations.push({
        entity: 'ad_group',
        operation: 'update',
        resource: adGroupUpdate,
      });
    }

    // 4. Adicionar novas Keywords (apenas as que não existem)
    // Nota: Para remover keywords, seria necessário buscar os IDs e usar operation: 'remove'
    // Por enquanto, apenas adicionamos keywords que ainda não existem
    if (body.keywords && Array.isArray(body.keywords) && body.keywords.length > 0 && adGroupId) {
      // Busca keywords existentes no ad group
      let existingKeywords: Set<string> = new Set();
      try {
        const existingKeywordsData = await customer.report({
          entity: 'ad_group_criterion',
          attributes: [
            'ad_group_criterion.keyword.text',
            'ad_group_criterion.keyword.match_type',
          ] as any,
          constraints: {
            'ad_group_criterion.ad_group': adGroupResourceName,
            'ad_group_criterion.type': 'KEYWORD',
          },
        });

        // Cria um Set com as keywords existentes (texto + matchType como chave única)
        for (const kw of existingKeywordsData) {
          const keywordText = kw.ad_group_criterion?.keyword?.text?.toLowerCase().trim();
          const matchType = kw.ad_group_criterion?.keyword?.match_type;
          if (keywordText) {
            existingKeywords.add(`${keywordText}_${matchType}`);
          }
        }
        console.log(`📋 Encontradas ${existingKeywords.size} palavra(s)-chave existente(s) no grupo`);
      } catch (error) {
        console.warn('⚠️ Erro ao buscar keywords existentes, tentando adicionar todas:', error);
      }

      let keywordsAdded = 0;
      let keywordsSkipped = 0;
      
      for (const keyword of body.keywords) {
        if (keyword.keyword && keyword.keyword.trim()) {
          // Converte matchType de número ou string para enum
          let matchTypeEnum = enums.KeywordMatchType.BROAD; // padrão
          
          if (typeof keyword.matchType === 'number') {
            // Se for número, mapeia diretamente
            matchTypeEnum = keyword.matchType;
          } else if (typeof keyword.matchType === 'string') {
            // Se for string, converte para enum
            matchTypeEnum = 
              keyword.matchType.toUpperCase() === 'EXACT' ? enums.KeywordMatchType.EXACT :
              keyword.matchType.toUpperCase() === 'PHRASE' ? enums.KeywordMatchType.PHRASE :
              enums.KeywordMatchType.BROAD;
          }

          // Verifica se a keyword já existe (case-insensitive)
          const keywordKey = `${keyword.keyword.toLowerCase().trim()}_${matchTypeEnum}`;
          
          if (existingKeywords.has(keywordKey)) {
            keywordsSkipped++;
            console.log(`⏭️ Keyword já existe, pulando: "${keyword.keyword}" (${matchTypeEnum})`);
            continue;
          }

          // Adiciona a keyword apenas se não existir
          operations.push({
            entity: 'ad_group_criterion',
            operation: 'create',
            resource: {
              ad_group: adGroupResourceName,
              keyword: {
                text: keyword.keyword.trim(),
                match_type: matchTypeEnum,
              },
              type: enums.CriterionType.KEYWORD,
            },
          });
          keywordsAdded++;
        }
      }
      
      if (keywordsAdded > 0) {
        console.log(`🔑 Adicionando ${keywordsAdded} palavra(s)-chave nova(s)`);
      }
      if (keywordsSkipped > 0) {
        console.log(`⏭️ ${keywordsSkipped} palavra(s)-chave já existente(s), não serão adicionadas novamente`);
      }
    }

    // 5. Atualizar/Criar Ad (headlines, descriptions, finalUrl)
    // Só atualiza se houver dados válidos
    if (body.adTitles && body.adDescriptions && body.finalUrl && adGroupId) {
      const validTitles = body.adTitles.filter((t: string) => t && t.trim()).slice(0, 15);
      const validDescriptions = body.adDescriptions.filter((d: string) => d && d.trim()).slice(0, 4);
      const validFinalUrl = body.finalUrl.trim();

      // Só atualiza se tiver pelo menos 3 títulos, 2 descrições e uma URL válida
      if (validTitles.length >= 3 && validDescriptions.length >= 2 && validFinalUrl) {
        // Busca anúncios existentes para atualizar ou criar novo
        const existingAds = await customer.report({
          entity: 'ad_group_ad',
          attributes: [
            'ad_group_ad.ad.id',
            'ad_group_ad.ad_group',
          ] as any,
          constraints: {
            'ad_group_ad.ad_group': adGroupResourceName,
          },
          limit: 1,
        });

        if (existingAds.length > 0 && existingAds[0].ad_group_ad?.ad?.id) {
          // Atualiza anúncio existente
          const adId = existingAds[0].ad_group_ad.ad.id.toString();
          const adResourceName = ResourceNames.ad(cleanCustomerIdValue, adId);

          operations.push({
            entity: 'ad',
            operation: 'update',
            resource: {
              resource_name: adResourceName,
              responsive_search_ad: {
                headlines: validTitles.map((text: string) => ({ text: text.trim() })),
                descriptions: validDescriptions.map((text: string) => ({ text: text.trim() })),
              },
              final_urls: [body.finalUrl],
            },
          });
          console.log(`📢 Atualizando anúncio existente`);
        } else {
          // Cria novo anúncio
          const adResourceName = ResourceNames.ad(cleanCustomerIdValue, '-1');

          operations.push({
            entity: 'ad',
            operation: 'create',
            resource: {
              resource_name: adResourceName,
              responsive_search_ad: {
                headlines: validTitles.map((text: string) => ({ text: text.trim() })),
                descriptions: validDescriptions.map((text: string) => ({ text: text.trim() })),
              },
              final_urls: [body.finalUrl],
            },
          });

          // Cria o ad_group_ad para associar o anúncio ao grupo
          operations.push({
            entity: 'ad_group_ad',
            operation: 'create',
            resource: {
              ad_group: adGroupResourceName,
              ad: adResourceName,
            },
          });
          console.log(`📢 Criando novo anúncio`);
        }
      }
    }

    // Executa todas as operações
    if (operations.length > 0) {
      console.log(`🚀 Executando ${operations.length} operação(ões) de atualização...`);
      const result = await customer.mutateResources(operations);
      console.log('✅ Campanha atualizada com sucesso!');
      console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    } else {
      console.warn('⚠️ Nenhuma operação de atualização foi preparada');
    }

    return NextResponse.json({
      success: true,
      message: 'Campanha atualizada com sucesso',
      operationsCount: operations.length,
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar campanha:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao atualizar campanha',
        details: error.errors || error,
      },
      { status: 500 }
    );
  }
}
