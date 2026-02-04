'use client';

import { AlertTriangle } from 'lucide-react';

interface SearchTermData {
  searchTerm?: string;
  clicks?: number;
  conversions?: number;
  costMicros?: number;
}

interface SearchTermsTableProps {
  searchTermsData: SearchTermData[];
}

export default function SearchTermsTable({ searchTermsData }: SearchTermsTableProps) {
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

  // Verifica se o termo contém palavras indesejadas
  const hasUnwantedKeywords = (term: string): boolean => {
    const unwantedKeywords = ['grátis', 'gratuito', 'defensoria', 'modelo', 'pdf', 'vagas'];
    const lowerTerm = term.toLowerCase();
    return unwantedKeywords.some(keyword => lowerTerm.includes(keyword));
  };

  // Filtra termos válidos e limita a 15
  const validTerms = searchTermsData
    .filter((item) => item.searchTerm && item.searchTerm.trim().length > 0)
    .slice(0, 15);

  // Se não houver termos válidos, não renderiza nada
  if (validTerms.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
          🔍 O que as pessoas estão buscando?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Estes são os termos exatos que as pessoas digitaram no Google. Identifique termos indesejados (como "grátis" ou "modelo") para negativá-los.
        </p>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/50 z-10">
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Termo de Pesquisa
              </th>
              <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Cliques
              </th>
              <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Conversões
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Custo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {validTerms.map((item, index) => {
              const searchTerm = item.searchTerm || 'Sem termo';
              const clicks = item.clicks || 0;
              const conversions = item.conversions || 0;
              const costMicros = item.costMicros || 0;
              const cost = microsToReais(costMicros);
              const isUnwanted = hasUnwantedKeywords(searchTerm);

              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isUnwanted && (
                        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isUnwanted
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {searchTerm}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {clicks.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {conversions.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {formatCurrency(cost)}
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
