'use client';

import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function InstagramDMPage() {
  const { isOpen, isMobile } = useSidebar();

  // Calcula o margin-left baseado no estado do sidebar
  const getMainMargin = () => {
    if (isMobile) {
      // No mobile, quando fechado mostra w-20 (reduzido), quando aberto tem overlay
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20'; // Desktop: 256px quando aberto, 80px quando fechado
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              DM's Instagram
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Gerencie suas mensagens diretas do Instagram
            </p>
          </div>

          {/* Painel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                DM's Instagram
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Painel de gerenciamento de mensagens diretas do Instagram
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

