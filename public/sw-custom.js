// Service Worker customizado para Push Notifications
// Este arquivo será mesclado com o service worker gerado pelo next-pwa

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
    // Som padrão do sistema (não precisa especificar)
    requireInteraction: false,
    tag: 'whatsapp-message', // Tag para agrupar notificações
  });

  event.waitUntil(promiseChain);
});

// Listener para quando o usuário clica na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notificação clicada:', event);

  event.notification.close();

  // Abre ou foca na janela do app
  const urlToOpen = event.notification.data?.url || '/conversas';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Tenta focar em uma janela existente
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não encontrar, abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
