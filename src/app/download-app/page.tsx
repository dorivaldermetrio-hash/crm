'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { HiOutlineArrowDownTray, HiOutlineDevicePhoneMobile, HiOutlineCheckCircle } from 'react-icons/hi2';
import { X } from 'lucide-react';
import NotificationPermission from '@/components/NotificationPermission';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadAppPage() {
  const { isOpen, isMobile } = useSidebar();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const getMainMargin = () => {
    if (isMobile) {
      return isOpen ? 'ml-0' : 'ml-20';
    }
    return isOpen ? 'ml-64' : 'ml-20';
  };

  useEffect(() => {
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detecta iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Escuta o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se o app pode ser instalado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Service worker está pronto
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    try {
      // Mostra o prompt de instalação
      await deferredPrompt.prompt();

      // Espera pela escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      // Limpa o prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar app:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Sidebar />
      <main className={`flex-1 ${getMainMargin()} p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 w-0 min-w-0`}>
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Baixar App
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Instale o WhatsApp CRM no seu dispositivo para acesso rápido e offline
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Card de Instalação */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <HiOutlineDevicePhoneMobile className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Instalação
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isInstalled ? 'App instalado' : isInstallable ? 'Pronto para instalar' : 'Verificando...'}
                  </p>
                </div>
              </div>
              {isInstalled ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Aplicativo já está instalado</span>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  disabled={!isInstallable && !isIOS}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isInstallable || isIOS
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isIOS ? 'Ver Instruções iOS' : 'Instalar App'}
                </button>
              )}
            </div>

            {/* Card de Benefícios */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Benefícios
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Vantagens do app instalado
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Acesso rápido sem abrir navegador
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Funciona offline
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Notificações push
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Experiência nativa
                </li>
              </ul>
            </div>
          </div>

          {/* Instruções iOS */}
          {showIOSInstructions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Instalar no iOS
                    </h3>
                    <button
                      onClick={() => setShowIOSInstructions(false)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <p>Para instalar o app no iPhone ou iPad:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>Toque no botão de compartilhar <span className="font-semibold">(□↑)</span> na parte inferior da tela</li>
                      <li>Role para baixo e toque em <span className="font-semibold">"Adicionar à Tela de Início"</span></li>
                      <li>Toque em <span className="font-semibold">"Adicionar"</span> no canto superior direito</li>
                      <li>O app aparecerá na sua tela de início</li>
                    </ol>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>Dica:</strong> Use o Safari para instalar. O Chrome no iOS não suporta instalação de PWA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ativar Notificações */}
          <NotificationPermission />

          {/* Informações Adicionais */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Como funciona?
            </h3>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <p>
                O WhatsApp CRM é um Progressive Web App (PWA), o que significa que você pode instalá-lo
                diretamente no seu dispositivo sem precisar baixar da App Store ou Google Play.
              </p>
              <p>
                Após a instalação, o app funcionará como um aplicativo nativo, com acesso rápido,
                funcionamento offline e notificações push.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
