'use client';

import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

interface CampaignData {
  metrics?: {
    costMicros?: number;
    conversions?: number;
    costPerConversion?: number;
    ctr?: number;
  };
}

interface GoogleAdsDashboardProps {
  campaignsData: CampaignData[];
}

export default function GoogleAdsDashboard({ campaignsData }: GoogleAdsDashboardProps) {
  // Calcula as métricas agregadas
  const totalInvestment = campaignsData.reduce((sum, campaign) => {
    const costMicros = campaign.metrics?.costMicros || 0;
    return sum + costMicros;
  }, 0) / 1000000; // Converte micros para Reais

  const totalConversions = campaignsData.reduce((sum, campaign) => {
    return sum + (campaign.metrics?.conversions || 0);
  }, 0);

  // CPA Médio: Soma do Custo Real / Soma das Conversões
  const totalCost = campaignsData.reduce((sum, campaign) => {
    const costMicros = campaign.metrics?.costMicros || 0;
    return sum + costMicros;
  }, 0) / 1000000; // Converte para Reais
  
  const averageCPA = totalConversions > 0 
    ? totalCost / totalConversions 
    : 0;

  // CTR Médio: Média aritmética
  const ctrValues = campaignsData
    .map(campaign => campaign.metrics?.ctr || 0)
    .filter(ctr => ctr > 0);
  
  const averageCTR = ctrValues.length > 0
    ? ctrValues.reduce((sum, ctr) => sum + ctr, 0) / ctrValues.length
    : 0;

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Determina a cor do badge para Saúde dos Anúncios
  const getHealthBadgeColor = (ctr: number) => {
    return ctr > 0.03 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getHealthBadgeText = (ctr: number) => {
    return ctr > 0.03 ? 'Bom' : 'Atenção';
  };

  const cards = [
    {
      title: 'Investimento Total',
      value: formatCurrency(totalInvestment),
      icon: DollarSign,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Novos Contatos',
      value: totalConversions.toLocaleString('pt-BR'),
      icon: Users,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Custo por Cliente (CPA Médio)',
      value: formatCurrency(averageCPA),
      icon: TrendingUp,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Saúde dos Anúncios (CTR Médio)',
      value: formatPercentage(averageCTR),
      icon: Activity,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      badge: {
        text: getHealthBadgeText(averageCTR),
        color: getHealthBadgeColor(averageCTR),
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {card.value}
                </p>
                {card.badge && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${card.badge.color}`}
                  >
                    {card.badge.text}
                  </span>
                )}
              </div>
              <div className={`${card.iconColor} flex-shrink-0 ml-3`}>
                <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
