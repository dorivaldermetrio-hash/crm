import { NextResponse } from 'next/server';

// Service Worker básico para Push Notifications
const serviceWorkerCode = `// Service Worker básico para Push Notifications
const CACHE_NAME = 'whatsapp-crm-v1';
const urlsToCache = [
  '/',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json',
];

// Instala o service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativa o service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listener para eventos de push
self.addEventListener('push', function(event) {
  console.log('📬 Push event recebido:', event);

  let notificationData = {
    title: 'Nova mensagem',
    body: 'Você recebeu uma nova mensagem',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: '/conversas',
    },
  };

  // Se houver dados no push event, usa eles
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || notificationData.data,
      };
    } catch (e) {
      console.error('Erro ao parsear dados do push:', e);
    }
  }

  // Mostra a notificação
  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    requireInteraction: false,
    tag: 'whatsapp-message',
  });

  event.waitUntil(promiseChain);
});

// Listener para quando o usuário clica na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notificação clicada:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/conversas';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fetch handler para cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
`;

export async function GET() {
  return new NextResponse(serviceWorkerCode, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
