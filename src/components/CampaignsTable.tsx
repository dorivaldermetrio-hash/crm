'use client';

interface CampaignData {
  campaign?: {
    name?: string;
    status?: string;
  };
  metrics?: {
    costMicros?: number;
    conversions?: number;
    costPerConversion?: number;
  };
}

interface CampaignsTableProps {
  campaignsData: CampaignData[];
}

export default function CampaignsTable({ campaignsData }: CampaignsTableProps) {
  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Converte micros para Reais
  const microsToReais = (micros: number) => {
    return micros / 1000000;
  };

  // Filtra campanhas que têm dados válidos (pelo menos o nome da campanha)
  const validCampaigns = campaignsData.filter((item) => {
    return item.campaign?.name;
  });

  // Se não houver campanhas válidas, não renderiza nada
  if (validCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
          Desempenho por Especialidade
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Compare o desempenho de cada campanha
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Campanha
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Gasto (Investimento)
              </th>
              <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Contatos (WhatsApp)
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                CPA (Custo por Contato)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {validCampaigns.map((item, index) => {
              const campaignName = item.campaign?.name || 'Sem nome';
              const status = item.campaign?.status || 'UNKNOWN';
              const costMicros = item.metrics?.costMicros || 0;
              const conversions = item.metrics?.conversions || 0;
              const costPerConversion = item.metrics?.costPerConversion || 0;

              // Converte valores
              const gasto = microsToReais(costMicros);
              const cpa = costPerConversion > 0 
                ? microsToReais(costPerConversion)
                : (conversions > 0 ? gasto / conversions : 0);

              // Determina se CPA está acima de R$ 50
              const isHighCPA = cpa > 50;

              // Determina cor do badge de status
              const getStatusBadge = (status: string) => {
                if (status === 'ENABLED') {
                  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                } else if (status === 'PAUSED') {
                  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                } else {
                  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                }
              };

              const getStatusText = (status: string) => {
                if (status === 'ENABLED') {
                  return 'Ativa';
                } else if (status === 'PAUSED') {
                  return 'Pausada';
                } else {
                  return 'Removida';
                }
              };

              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {campaignName}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}
                    >
                      {getStatusText(status)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {formatCurrency(gasto)}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {conversions.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-medium ${
                        isHighCPA
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(cpa)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
