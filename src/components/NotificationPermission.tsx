'use client';

import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

export default function NotificationPermission() {
  const { isMobile } = useSidebar();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Verifica permissão atual
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      console.log('🔔 Permissão de notificações:', currentPermission);
      
      // Verifica se o service worker está registrado
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        }).catch((error) => {
          console.error('❌ Erro ao verificar Service Worker:', error);
        });
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta notificações push. Use Chrome, Edge ou Firefox.');
      return;
    }

    try {
      setIsSubscribing(true);
      setSubscriptionStatus('idle');

      // 1. Solicita permissão para notificações
      const notificationPermission = await Notification.requestPermission();
      setPermission(notificationPermission);

      if (notificationPermission !== 'granted') {
        alert('Permissão de notificações negada. Você não receberá notificações.');
        setIsSubscribing(false);
        return;
      }

      // 2. Registra service worker (já deve estar registrado pelo next-pwa)
      const registration = await navigator.serviceWorker.ready;

      // 3. Busca VAPID public key do servidor
      const vapidPublicKeyResponse = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await vapidPublicKeyResponse.json();

      if (!publicKey) {
        throw new Error('VAPID public key não encontrada');
      }

      // 4. Converte a chave pública para formato Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // 5. Cria subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // 6. Envia subscription para o backend
      console.log('📤 Enviando subscription para o backend...');
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(subscription.getKey('auth')!),
            },
          },
        }),
      });

      const data = await response.json();
      console.log('📥 Resposta do backend:', data);

      if (data.success) {
        setSubscriptionStatus('success');
        console.log('✅ Subscription salva com sucesso!');
        console.log('🔔 Notificações ativadas! Você receberá notificações quando chegar mensagens.');
      } else {
        throw new Error(data.error || 'Erro ao salvar subscription');
      }
    } catch (error: any) {
      console.error('Erro ao configurar notificações:', error);
      setSubscriptionStatus('error');
      alert('Erro ao configurar notificações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubscribing(false);
    }
  };

  // Helper para converter ArrayBuffer para Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Não mostra nada se já tiver permissão concedida
  if (permission === 'granted' && subscriptionStatus === 'success') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <HiOutlineBell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            Notificações Push
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            {permission === 'granted'
              ? 'Receba notificações quando chegar mensagens do WhatsApp'
              : 'Ative as notificações para receber alertas de novas mensagens'}
          </p>
          {subscriptionStatus === 'success' ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs">
              <HiOutlineCheckCircle className="w-4 h-4" />
              <span>Notificações ativadas com sucesso!</span>
            </div>
          ) : subscriptionStatus === 'error' ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
              <HiOutlineXCircle className="w-4 h-4" />
              <span>Erro ao ativar notificações. Tente novamente.</span>
            </div>
          ) : (
            <button
              onClick={requestPermission}
              disabled={isSubscribing || permission === 'denied'}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                permission === 'denied'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : isSubscribing
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubscribing
                ? 'Configurando...'
                : permission === 'denied'
                ? 'Permissão negada'
                : permission === 'granted'
                ? 'Ativar notificações'
                : 'Ativar notificações'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
