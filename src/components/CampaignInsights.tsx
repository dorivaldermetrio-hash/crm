'use client';

import { AlertTriangle, Globe, TrendingUp, CheckCircle } from 'lucide-react';

interface CampaignData {
  campaign?: {
    id?: string;
    name?: string;
    status?: string;
  };
  metrics?: {
    costMicros?: number;
    conversions?: number;
    costPerConversion?: number;
    ctr?: number;
    clicks?: number;
  };
}

interface CampaignInsightsProps {
  campaignsData: CampaignData[];
}

interface Insight {
  type: 'warning' | 'error' | 'success';
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  campaignName: string;
}

export default function CampaignInsights({ campaignsData }: CampaignInsightsProps) {
  const insights: Insight[] = [];

  // Filtra campanhas válidas (com nome e métricas)
  const validCampaigns = campaignsData.filter((item) => {
    return item.campaign?.name && item.metrics;
  });

  // Se não houver campanhas válidas, não renderiza nada
  if (validCampaigns.length === 0) {
    return null;
  }

  // 1. Alerta de Anúncio Chato: CTR < 3%
  validCampaigns.forEach((item) => {
    const campaignName = item.campaign?.name || 'Campanha sem nome';
    const ctr = item.metrics?.ctr || 0;

    if (ctr > 0 && ctr < 0.03) {
      insights.push({
        type: 'warning',
        title: 'Anúncio com baixo engajamento',
        message: `Os anúncios de ${campaignName} estão sendo pouco clicados. Vamos testar novos títulos?`,
        icon: AlertTriangle,
        campaignName,
      });
    }
  });

  // 2. Alerta de Site Ruim: Muitos cliques mas poucas conversões
  validCampaigns.forEach((item) => {
    const campaignName = item.campaign?.name || 'Campanha sem nome';
    const clicks = item.metrics?.clicks || 0;
    const conversions = item.metrics?.conversions || 0;

    if (clicks > 50 && conversions < 2) {
      insights.push({
        type: 'error',
        title: 'Problema de conversão',
        message: `Muitas pessoas estão entrando no seu site em ${campaignName}, mas ninguém chama no Zap. Verifique se o botão de contato está bem visível.`,
        icon: Globe,
        campaignName,
      });
    }
  });

  // 3. Sugestão de Investimento: Menor CPA
  let bestCampaign: CampaignData | null = null;
  let lowestCPA = Infinity;

  validCampaigns.forEach((item) => {
    const costPerConversion = item.metrics?.costPerConversion || 0;
    const conversions = item.metrics?.conversions || 0;

    // Só considera campanhas com conversões reais
    if (conversions > 0 && costPerConversion > 0) {
      // Converte micros para Reais para comparação
      const cpaInReais = costPerConversion / 1000000;
      if (cpaInReais < lowestCPA) {
        lowestCPA = cpaInReais;
        bestCampaign = item;
      }
    }
  });

  if (bestCampaign && bestCampaign.campaign) {
    const campaignName = bestCampaign.campaign.name || 'Campanha sem nome';
    insights.push({
      type: 'success',
      title: 'Oportunidade de investimento',
      message: `A área de ${campaignName} está trazendo clientes mais baratos. Recomendamos focar mais verba aqui para maximizar o retorno.`,
      icon: TrendingUp,
      campaignName,
    });
  }

  // Se não houver insights, mostra mensagem positiva
  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
          💡 Insights da Inteligência Artificial
        </h3>
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Tudo rodando bem! Não há alertas críticos no momento.
          </p>
        </div>
      </div>
    );
  }

  // Função para obter estilos baseados no tipo
  const getInsightStyles = (type: 'warning' | 'error' | 'success') => {
    switch (type) {
      case 'warning':
        return {
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'error':
        return {
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-600 dark:text-red-400',
        };
      case 'success':
        return {
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-600 dark:text-green-400',
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
        💡 Insights da Inteligência Artificial
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const styles = getInsightStyles(insight.type);
          const Icon = insight.icon;

          return (
            <div
              key={index}
              className={`${styles.bgColor} border-l-4 ${styles.borderColor} rounded p-4 flex items-start gap-3`}
            >
              <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm mb-1 ${styles.textColor}`}>
                  {insight.title}
                </h4>
                <p className={`text-sm ${styles.textColor}`}>
                  {insight.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
