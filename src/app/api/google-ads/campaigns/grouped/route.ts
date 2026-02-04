import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsCustomer, cleanCustomerId } from '@/lib/googleAds';
import { getUserId } from '@/lib/utils/getUserId';
import { enums } from 'google-ads-api';

/**
 * API Route para listar campanhas agrupadas por grupo de anúncios
 * GET /api/google-ads/campaigns/grouped
 * 
 * Query params:
 * - customerId: ID da conta do Google Ads (opcional, usa GOOGLE_ADS_CUSTOMER_ID do .env se não fornecido)
 * 
 * Retorna um objeto onde as chaves são os nomes dos grupos e os valores são arrays de campanhas.
 * Campanhas sem grupo são colocadas em "Sem Grupo".
 */
export async function GET(request: NextRequest) {
  try {
    // Obtém os parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const customerIdParam = searchParams.get('customerId');

    // Obtém userId
    const userId = await getUserId(request);

    // Obtém customerId (pode vir do query param ou do .env)
    const customerId = customerIdParam || process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'customerId é obrigatório. Forneça no query param ou configure GOOGLE_ADS_CUSTOMER_ID no .env.local',
        },
        { status: 400 }
      );
    }

    // Limpa o customer_id (remove traços)
    const cleanCustomerIdValue = cleanCustomerId(customerId);

    console.log('📋 Buscando campanhas agrupadas por grupo de anúncios...');
    console.log('👤 User ID:', userId);
    console.log('📝 Customer ID:', cleanCustomerIdValue);

    // Obtém a instância do Customer (busca refresh_token automaticamente do MongoDB)
    const customer = await getGoogleAdsCustomer(userId, cleanCustomerIdValue);

    // No Google Ads, os grupos são "Ad Groups" (ad_group), não "Campaign Groups"
    // campaign_group não existe na API. Precisamos buscar ad_groups separadamente e fazer join
    console.log('🔍 Buscando campanhas e ad_groups separadamente...');

    // 1. Busca todas as campanhas
    // Usa constraints simples (não objetos) conforme a biblioteca espera
    const campaigns = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.id',
        'campaign.name',
        'campaign.status',
      ] as any,
      // Não filtra por status aqui, vamos filtrar depois
      // A biblioteca pode não aceitar NOT_EQUAL dessa forma
    });

    console.log(`✅ ${campaigns.length} campanha(s) encontrada(s)`);

    // 2. Busca todos os ad_groups com suas campanhas
    const adGroups = await customer.report({
      entity: 'ad_group',
      attributes: [
        'ad_group.id',
        'ad_group.name',
        'ad_group.campaign',
      ] as any,
    });

    console.log(`✅ ${adGroups.length} ad_group(s) encontrado(s)`);

    // 3. Agrupa ad_groups por nome (pode haver múltiplos ad_groups com o mesmo nome em campanhas diferentes)
    // E cria um mapa: campaignId -> [groupNames]
    const campaignToGroups: Record<string, Set<string>> = {};
    
    // Log do primeiro ad_group para debug
    if (adGroups.length > 0) {
      console.log('🔍 Estrutura do primeiro ad_group:', JSON.stringify(adGroups[0], null, 2));
    }
    
    for (const ag of adGroups) {
      const adGroup = ag.ad_group;
      if (!adGroup) continue;
      
      // Extrai o campaignId de diferentes formas possíveis
      let campaignId: string | null = null;
      const campaignRef = adGroup.campaign;
      
      if (campaignRef) {
        // Pode ser resource_name: "customers/2943358156/campaigns/23516625582"
        if (typeof campaignRef === 'string' && campaignRef.includes('/campaigns/')) {
          const match = campaignRef.match(/\/campaigns\/(\d+)/);
          if (match) {
            campaignId = match[1];
          } else {
            campaignId = campaignRef;
          }
        }
        // Pode ser objeto com id
        else if (typeof campaignRef === 'object' && campaignRef !== null && 'id' in campaignRef) {
          campaignId = String((campaignRef as any).id);
        }
        // Pode ser apenas o ID
        else {
          campaignId = campaignRef.toString();
        }
      }
      
      const groupName = adGroup.name;
      
      if (campaignId && groupName) {
        if (!campaignToGroups[campaignId]) {
          campaignToGroups[campaignId] = new Set();
        }
        campaignToGroups[campaignId].add(groupName);
        console.log(`✅ Mapeado: Campanha ${campaignId} -> Grupo "${groupName}"`);
      } else {
        console.warn('⚠️ Ad Group sem campaignId ou groupName:', {
          campaignRef: campaignRef,
          groupName: groupName,
          adGroup: adGroup,
        });
      }
    }

    console.log(`✅ Mapeamento criado para ${Object.keys(campaignToGroups).length} campanha(s)`);
    console.log('📋 Mapeamento completo:', Object.fromEntries(
      Object.entries(campaignToGroups).map(([id, groups]) => [id, Array.from(groups)])
    ));

    // 4. Monta resultados combinando campanhas com seus grupos
    // Filtra campanhas removidas manualmente (já que não podemos usar NOT_EQUAL na constraint)
    const results = campaigns
      .map((camp: any) => {
        const campaign = camp.campaign;
        if (!campaign) return null;
        
        // Filtra campanhas removidas manualmente
        // Status pode ser string ('REMOVED') ou número (3 = REMOVED enum)
        const status = campaign.status;
        if (status === 'REMOVED' || status === 3 || (typeof status === 'string' && status.toUpperCase() === 'REMOVED')) {
          return null;
        }
        
        // Extrai o campaignId (pode vir como id direto ou dentro de resource_name)
        let campaignId: string;
        if (campaign.id) {
          campaignId = campaign.id.toString();
        } else if (campaign.resource_name) {
          // Extrai do resource_name: "customers/2943358156/campaigns/23516625582"
          const match = campaign.resource_name.match(/\/campaigns\/(\d+)/);
          campaignId = match ? match[1] : campaign.resource_name;
        } else {
          campaignId = String(campaign.id || 'unknown');
        }
        
        const groupNames = Array.from(campaignToGroups[campaignId] || []);
        // Usa o primeiro grupo encontrado, ou null se não tiver
        const groupName = groupNames[0] || null;
        
        // Log para debug se não encontrar grupo
        if (!groupName) {
          console.log(`⚠️ Nenhum grupo encontrado para campanha ${campaignId} (${campaign.name}). Grupos disponíveis:`, Object.keys(campaignToGroups));
        }
        
        return {
          campaign: campaign,
          campaign_group: groupName ? { name: groupName } : null,
        };
      })
      .filter(Boolean) as any[];

    console.log(`✅ ${results.length} resultado(s) montado(s) com join manual`);

    console.log(`✅ ${results.length} resultado(s) encontrado(s)`);
    
    // Log do primeiro resultado para debug
    if (results.length > 0) {
      console.log('🔍 Estrutura do primeiro resultado:', JSON.stringify(results[0], null, 2));
    }

    // Processa os resultados para agrupar por grupo de anúncios
    const groupedCampaigns: Record<string, Array<{
      id: string;
      name: string;
      status: string;
    }>> = {};

    // Contador para garantir IDs únicos mesmo quando o ID da campanha não está disponível
    let campaignCounter = 0;

    for (const row of results) {
      // Extrai os dados do resultado
      // A estrutura do customer.report() retorna: { campaign: { id, name, status }, campaign_group: { id, name } }
      let campaignGroup: any = null;
      let campaign: any = null;

      // Os resultados já vêm com a estrutura: { campaign: {...}, campaign_group: {...} }
      // Extrai diretamente
      campaign = row.campaign;
      campaignGroup = row.campaign_group || null;

      if (!campaign) {
        console.warn('⚠️ Resultado sem campaign:', row);
        continue;
      }

      // Determina o nome do grupo (ou "Sem Grupo" se não tiver)
      // campaign_group já vem como { name: "..." } do join manual
      let groupName = 'Sem Grupo';
      
      if (campaignGroup) {
        if (typeof campaignGroup === 'string') {
          groupName = campaignGroup;
        } else if (campaignGroup.name) {
          groupName = campaignGroup.name;
        } else if (campaignGroup.campaign_group?.name) {
          groupName = campaignGroup.campaign_group.name;
        } else {
          // Log se campaignGroup existe mas não tem name
          console.log('⚠️ campaignGroup existe mas não tem name:', {
            campaignGroup,
            campaignId: campaign.id,
            campaignName: campaign.name,
          });
        }
      }
      
      // Log para debug se grupo não for encontrado (apenas se realmente não tiver)
      if (groupName === 'Sem Grupo' && campaign) {
        console.log('⚠️ Usando "Sem Grupo" para campanha:', {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignGroup: campaignGroup,
          campaignGroupType: typeof campaignGroup,
          campaignGroupKeys: campaignGroup ? Object.keys(campaignGroup) : null,
          rowStructure: { hasCampaign: !!row.campaign, hasCampaignGroup: !!row.campaign_group },
        });
      } else if (groupName !== 'Sem Grupo') {
        // Log quando encontra o grupo (para confirmar que está funcionando)
        console.log(`✅ Campanha "${campaign.name}" agrupada em "${groupName}"`);
      }

      // Inicializa o array do grupo se não existir
      if (!groupedCampaigns[groupName]) {
        groupedCampaigns[groupName] = [];
      }

      // Adiciona a campanha ao grupo
      // Garante que o ID seja único e válido
      campaignCounter++;
      let campaignId: string;
      
      // Extrai o ID da campanha (pode ser número ou string)
      const rawCampaignId = campaign?.id;
      if (rawCampaignId !== null && rawCampaignId !== undefined) {
        campaignId = String(rawCampaignId);
      } else {
        // Se não tiver ID, cria um ID único baseado no índice e timestamp
        campaignId = `campaign-${campaignCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`⚠️ Campanha sem ID, criando ID temporário: ${campaignId}`);
      }
      
      // Extrai nome e status
      const campaignName = campaign?.name || null;
      const rawStatus = campaign?.status;
      
      // Converte status de enum numérico para string
      // Enum do google-ads-api: 
      // - 2 = ENABLED (Ativa)
      // - 3 = PAUSED (Pausada)  
      // - 4 = REMOVED (Removida)
      let campaignStatus: string;
      if (typeof rawStatus === 'number') {
        // Usa os valores do enum do google-ads-api
        if (rawStatus === 2 || rawStatus === enums.CampaignStatus.ENABLED) {
          campaignStatus = 'ENABLED';
        } else if (rawStatus === 3 || rawStatus === enums.CampaignStatus.PAUSED) {
          campaignStatus = 'PAUSED';
        } else if (rawStatus === 4 || rawStatus === enums.CampaignStatus.REMOVED) {
          campaignStatus = 'REMOVED';
        } else {
          // Log para debug de valores inesperados
          console.warn(`⚠️ Status numérico desconhecido: ${rawStatus} para campanha ${campaignId}`);
          campaignStatus = 'UNKNOWN';
        }
      } else if (typeof rawStatus === 'string') {
        campaignStatus = rawStatus.toUpperCase();
      } else {
        campaignStatus = 'UNKNOWN';
      }
      
      // Log para debug (apenas para algumas campanhas para não poluir o console)
      if (campaignCounter <= 3) {
        console.log(`🔍 Status convertido: ${rawStatus} (${typeof rawStatus}) -> ${campaignStatus}`);
      }
      
      // Log para debug se dados estiverem faltando
      if (!campaignName || !rawStatus) {
        console.warn('⚠️ Dados faltando na campanha:', {
          id: campaignId,
          name: campaignName,
          rawStatus: rawStatus,
          convertedStatus: campaignStatus,
          rawCampaign: campaign,
        });
      }
      
      // Filtra campanhas removidas - não devem aparecer na lista
      if (campaignStatus === 'REMOVED') {
        console.log(`⏭️ Campanha removida ignorada: ${campaignName} (ID: ${campaignId})`);
        continue;
      }
      
      // Verifica se já existe uma campanha com o mesmo ID no grupo (evita duplicatas)
      const existingCampaign = groupedCampaigns[groupName].find(c => c.id === campaignId);
      if (!existingCampaign) {
        groupedCampaigns[groupName].push({
          id: campaignId,
          name: campaignName || 'Sem nome',
          status: campaignStatus,
        });
      }
    }

    console.log(`✅ Campanhas agrupadas em ${Object.keys(groupedCampaigns).length} grupo(s)`);

    // Agora busca os detalhes completos de todas as campanhas em paralelo
    console.log('🔍 Buscando detalhes completos de todas as campanhas...');
    const allCampaignIds = Object.values(groupedCampaigns)
      .flat()
      .filter(c => c.status !== 'REMOVED') // Filtra campanhas removidas
      .map(c => c.id)
      .filter(id => id && !id.startsWith('campaign-')); // Filtra IDs temporários

    // Função auxiliar para buscar detalhes de uma campanha
    const fetchCampaignDetails = async (campaignId: string) => {
      try {
        // Busca informações básicas
        const campaignData = await customer.report({
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

        if (campaignData.length === 0) return null;

        const campaign = campaignData[0].campaign;
        const budgetResourceName = campaign?.campaign_budget;

        // Busca orçamento
        let budgetAmountMicros = 0;
        if (budgetResourceName) {
          try {
            const budgetId = budgetResourceName.split('/').pop();
            if (budgetId) {
              const budgets = await customer.report({
                entity: 'campaign_budget',
                attributes: ['campaign_budget.amount_micros'] as any,
                constraints: { 'campaign_budget.id': budgetId },
                limit: 1,
              });
              if (budgets.length > 0) {
                budgetAmountMicros = budgets[0].campaign_budget?.amount_micros || 0;
              }
            }
          } catch (error) {
            // Ignora erro de orçamento
          }
        }

        // Busca ad groups
        const adGroups = await customer.report({
          entity: 'ad_group',
          attributes: [
            'ad_group.id',
            'ad_group.name',
            'ad_group.cpc_bid_micros',
          ] as any,
          constraints: {
            'ad_group.campaign': `customers/${cleanCustomerIdValue}/campaigns/${campaignId}`,
          },
          limit: 1,
        });

        let manualCpcMicros = 0;
        let adGroupName = '';
        let adGroupCpc = 0;
        if (adGroups.length > 0 && adGroups[0].ad_group) {
          manualCpcMicros = adGroups[0].ad_group.cpc_bid_micros || 0;
          adGroupName = adGroups[0].ad_group.name || '';
          adGroupCpc = adGroups[0].ad_group.cpc_bid_micros ? adGroups[0].ad_group.cpc_bid_micros / 1000000 : 0;
        }

        // Busca keywords do primeiro ad group
        const keywords: Array<{ keyword: string; matchType: string }> = [];
        if (adGroups.length > 0 && adGroups[0].ad_group?.id) {
          try {
            const adGroupId = adGroups[0].ad_group.id;
            const adGroupKeywords = await customer.report({
              entity: 'ad_group_criterion',
              attributes: [
                'ad_group_criterion.keyword.text',
                'ad_group_criterion.keyword.match_type',
              ] as any,
              constraints: {
                'ad_group_criterion.ad_group': `customers/${cleanCustomerIdValue}/adGroups/${adGroupId}`,
                'ad_group_criterion.type': 'KEYWORD',
              },
            });

            for (const kw of adGroupKeywords) {
              const keywordData = kw.ad_group_criterion?.keyword;
              if (keywordData?.text) {
                // Converte matchType para string
                let matchTypeStr = 'BROAD';
                const matchType = keywordData.match_type;
                if (typeof matchType === 'number') {
                  // Mapeia enum numérico para string
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
                });
              }
            }
          } catch (error) {
            // Ignora erro de keywords
          }
        }

        // Busca anúncios
        let ads = { headlines: [] as string[], descriptions: [] as string[], finalUrl: '' };
        if (adGroups.length > 0 && adGroups[0].ad_group?.id) {
          try {
            const adGroupId = adGroups[0].ad_group.id;
            const adGroupAds = await customer.report({
              entity: 'ad_group_ad',
              attributes: [
                'ad_group_ad.ad.responsive_search_ad.headlines',
                'ad_group_ad.ad.responsive_search_ad.descriptions',
                'ad_group_ad.ad.final_urls',
              ] as any,
              constraints: {
                'ad_group_ad.ad_group': `customers/${cleanCustomerIdValue}/adGroups/${adGroupId}`,
              },
              limit: 1,
            });

            if (adGroupAds.length > 0) {
              const adData = adGroupAds[0].ad_group_ad?.ad;
              const responsiveAd = adData?.responsive_search_ad;
              if (responsiveAd) {
                ads.headlines = responsiveAd.headlines?.map((h: any) => h.text).filter((t: string) => t) || [];
                ads.descriptions = responsiveAd.descriptions?.map((d: any) => d.text).filter((t: string) => t) || [];
                ads.finalUrl = adData?.final_urls?.[0] || '';
              }
            }
          } catch (error) {
            // Ignora erro de anúncios
          }
        }

        // Tenta buscar datas
        let startDate: string | undefined;
        let endDate: string | undefined;
        try {
          const campaignWithDates = await customer.report({
            entity: 'campaign',
            attributes: ['campaign.start_date', 'campaign.end_date'] as any,
            constraints: { 'campaign.id': campaignId },
            limit: 1,
          });
          if (campaignWithDates.length > 0) {
            const campaignData = campaignWithDates[0].campaign as any;
            startDate = campaignData?.start_date;
            endDate = campaignData?.end_date;
          }
        } catch (error) {
          // Ignora erro de datas
        }

        // Função para converter data
        const formatDate = (dateStr: string | undefined | null): string => {
          if (!dateStr) return '';
          if (dateStr.includes('-')) return dateStr;
          if (dateStr.length === 8) {
            return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
          return '';
        };

        const getStatusString = (status: any): string => {
          if (typeof status === 'string') return status;
          if (status === 2) return 'ENABLED';
          if (status === 3) return 'PAUSED';
          if (status === 4) return 'REMOVED';
          return 'ENABLED';
        };

        return {
          id: campaignId,
          name: campaign?.name || '',
          status: getStatusString(campaign?.status),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dailyBudget: budgetAmountMicros > 0 ? (budgetAmountMicros / 1000000).toFixed(2) : '',
          manualCpc: manualCpcMicros > 0 ? (manualCpcMicros / 1000000).toFixed(2) : '',
          adGroupName,
          adGroupCpc: adGroupCpc > 0 ? adGroupCpc.toFixed(2) : '',
          keywords: keywords.map(k => ({
            keyword: k.keyword,
            matchType: k.matchType || 'BROAD',
          })),
          adTitles: ads.headlines.length > 0 ? ads.headlines : ['', '', ''],
          adDescriptions: ads.descriptions.length > 0 ? ads.descriptions : ['', ''],
          finalUrl: ads.finalUrl || '',
        };
      } catch (error) {
        console.error(`❌ Erro ao buscar detalhes da campanha ${campaignId}:`, error);
        return null;
      }
    };

    // Busca detalhes de todas as campanhas em paralelo (limitado a 10 por vez para não sobrecarregar)
    const campaignDetailsMap: Record<string, any> = {};
    const batchSize = 10;
    for (let i = 0; i < allCampaignIds.length; i += batchSize) {
      const batch = allCampaignIds.slice(i, i + batchSize);
      const details = await Promise.all(batch.map(id => fetchCampaignDetails(id)));
      
      batch.forEach((id, index) => {
        if (details[index]) {
          campaignDetailsMap[id] = details[index];
        }
      });
    }

    console.log(`✅ Detalhes de ${Object.keys(campaignDetailsMap).length} campanha(s) carregados`);

    // Adiciona os detalhes às campanhas agrupadas
    // Remove grupos vazios e filtra campanhas removidas
    const finalGroupedCampaigns: Record<string, any[]> = {};
    Object.keys(groupedCampaigns).forEach(groupName => {
      // Filtra campanhas removidas e adiciona detalhes
      const filteredCampaigns = groupedCampaigns[groupName]
        .filter(campaign => campaign.status !== 'REMOVED')
        .map(campaign => ({
          ...campaign,
          details: campaignDetailsMap[campaign.id] || null,
        }));
      
      // Só adiciona o grupo se tiver campanhas (não vazio)
      if (filteredCampaigns.length > 0) {
        finalGroupedCampaigns[groupName] = filteredCampaigns;
      }
    });
    
    // Atualiza groupedCampaigns com os dados filtrados
    Object.keys(groupedCampaigns).forEach(groupName => {
      if (!finalGroupedCampaigns[groupName]) {
        delete groupedCampaigns[groupName];
      }
    });
    Object.assign(groupedCampaigns, finalGroupedCampaigns);

    return NextResponse.json({
      success: true,
      data: groupedCampaigns,
      totalGroups: Object.keys(groupedCampaigns).length,
      totalCampaigns: Object.values(groupedCampaigns).reduce((sum, campaigns) => sum + campaigns.length, 0),
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar campanhas agrupadas:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar campanhas agrupadas',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
