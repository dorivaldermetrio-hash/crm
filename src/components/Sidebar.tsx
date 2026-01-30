'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  HiOutlineChartBar, 
  HiOutlineUserGroup, 
  HiOutlineChatBubbleLeftRight,
  HiOutlineMegaphone,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineUser,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeft,
  HiOutlineCalendarDays,
  HiOutlineCurrencyDollar,
  HiOutlineArrowDownTray
} from 'react-icons/hi2';
import { RiRobotLine, RiInstagramLine } from 'react-icons/ri';
import { IconType } from 'react-icons';

interface MenuItem {
  id: string;
  label: string;
  icon: IconType;
  href: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HiOutlineChartBar, href: '/' },
  { id: 'contatos', label: 'Contatos', icon: HiOutlineUserGroup, href: '/contatos' },
  { id: 'contatos-email', label: 'Contatos Email', icon: HiOutlineEnvelope, href: '/contatos-email' },
  { id: 'conversas', label: 'Conversas', icon: HiOutlineChatBubbleLeftRight, href: '/conversas' },
  { id: 'agenda', label: 'Agenda', icon: HiOutlineCalendarDays, href: '/agenda' },
  { id: 'campanhas', label: 'Campanhas', icon: HiOutlineMegaphone, href: '/campanhas' },
  { id: 'templates', label: 'Templates', icon: HiOutlineDocumentText, href: '/templates' },
  { id: 'automacoes', label: 'Automações', icon: RiRobotLine, href: '/automacoes' },
  { id: 'produtos-servicos', label: 'Produtos e Serviços', icon: HiOutlineCube, href: '/produtos-servicos' },
  { id: 'instagram-dm', label: 'Instagram DM', icon: RiInstagramLine, href: '/instagram-dm' },
  { id: 'google-ads', label: 'Google ADS', icon: HiOutlineCurrencyDollar, href: '/google-ads' },
  { id: 'comentarios', label: 'Comentários', icon: HiOutlineChatBubbleLeft, href: '/comentarios' },
  { id: 'relatorios', label: 'Relatórios', icon: HiOutlineDocumentChartBar, href: '/relatorios' },
  { id: 'configuracoes', label: 'Configurações', icon: HiOutlineCog6Tooth, href: '/configuracoes' },
  { id: 'download-app', label: 'Download App', icon: HiOutlineArrowDownTray, href: '/download-app' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, isMobile } = useSidebar();

  // Determina o item ativo baseado na rota atual
  const getActiveItem = () => {
    const currentItem = menuItems.find((item) => item.href === pathname);
    return currentItem?.id || 'dashboard';
  };

  const activeItem = getActiveItem();

  return (
    <>
      {/* Mobile Overlay - só aparece quando sidebar está expandido no mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 transition-all duration-300 ease-in-out z-50 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50">
            {isOpen && (
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                WhatsApp CRM
              </h1>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-auto p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${!isOpen && 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-elegant">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (isMobile) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 group ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <item.icon className="text-lg sm:text-xl flex-shrink-0 w-5 h-5" />
                {isOpen && (
                  <span className="font-medium text-xs sm:text-sm tracking-wide">
                    {item.label}
                  </span>
                )}
                {activeItem === item.id && isOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-700/50">
            <div
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 ${
                !isOpen && 'justify-center'
              }`}
            >
              <HiOutlineUser className="text-lg sm:text-xl w-5 h-5" />
              {isOpen && (
                <span className="text-xs sm:text-sm font-medium">Perfil</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

