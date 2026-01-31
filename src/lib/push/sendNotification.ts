import webpush from 'web-push';
import connectDB from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';

// Suprime o warning de depreciação do url.parse() usado pela biblioteca web-push
// Isso evita que o warning interrompa o fluxo da aplicação
if (typeof process !== 'undefined') {
  // Captura warnings antes de serem emitidos
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function(warning: any, type?: string, code?: string, ...args: any[]) {
    // Ignora apenas o warning específico do url.parse() (DEP0169)
    if (code === 'DEP0169' || 
        (typeof warning === 'string' && warning.includes('url.parse()')) ||
        (warning && typeof warning === 'object' && warning.message && warning.message.includes('url.parse()'))) {
      return;
    }
    // Para todos os outros warnings, chama o comportamento padrão
    return originalEmitWarning.apply(process, [warning, type, code, ...args] as any);
  };
}

// Configura VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.warn('⚠️ VAPID keys não configuradas. Push notifications não funcionarão.');
} else {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    contatoId?: string;
    [key: string]: any;
  };
}

/**
 * Envia notificação push para uma subscription específica
 */
export async function sendPushToSubscription(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: NotificationPayload
): Promise<boolean> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.warn('VAPID keys não configuradas');
      return false;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      data: payload.data || {},
    });

    // Envolve em Promise para garantir que warnings não interrompam o fluxo
    await Promise.resolve().then(async () => {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        notificationPayload
      );
    });

    return true;
  } catch (error: any) {
    // Se a subscription for inválida (usuário desinstalou, etc), remove do banco
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription inválida, removendo do banco:', subscription.endpoint);
      try {
        await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
      } catch (deleteError) {
        // Ignora erros ao remover subscription - não deve interromper o fluxo
        console.error('Erro ao remover subscription inválida:', deleteError);
      }
    } else {
      // Log do erro mas não propaga - notificações não devem interromper o fluxo principal
      console.error('Erro ao enviar notificação push:', error);
    }
    return false;
  }
}

/**
 * Envia notificação push para todas as subscriptions cadastradas
 */
export async function sendPushToAllSubscriptions(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    await connectDB();
    const subscriptions = await PushSubscription.find({});
    
    if (subscriptions.length === 0) {
      console.log('Nenhuma subscription cadastrada');
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Envia para todas as subscriptions em paralelo
    const promises = subscriptions.map(async (sub) => {
      const success = await sendPushToSubscription(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
      
      if (success) {
        sent++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    console.log(`📤 Push notifications: ${sent} enviadas, ${failed} falharam`);
    return { sent, failed };
  } catch (error) {
    console.error('Erro ao buscar subscriptions:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Envia notificação quando recebe mensagem do WhatsApp
 */
export async function sendMessageNotification(
  contatoNome: string,
  mensagemTexto: string,
  contatoId: string
): Promise<void> {
  console.log('📨 Enviando notificação push para mensagem do WhatsApp...');
  console.log('   Contato:', contatoNome);
  console.log('   Mensagem:', mensagemTexto.substring(0, 50) + '...');
  
  const payload: NotificationPayload = {
    title: `Nova mensagem de ${contatoNome}`,
    body: mensagemTexto.length > 100 
      ? mensagemTexto.substring(0, 100) + '...' 
      : mensagemTexto,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: `/conversas?contatoId=${contatoId}`,
      contatoId: contatoId,
    },
  };

  const result = await sendPushToAllSubscriptions(payload);
  console.log(`📊 Resultado: ${result.sent} enviadas, ${result.failed} falharam`);
}
