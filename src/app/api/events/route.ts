import { NextRequest } from 'next/server';

/**
 * Server-Sent Events (SSE) para atualização em tempo real
 * GET /api/events
 * 
 * Emite eventos quando mensagens são recebidas ou enviadas
 */
export async function GET(request: NextRequest) {
  // Cria um stream de eventos
  const stream = new ReadableStream({
    start(controller) {
      // Função para enviar evento
      const sendEvent = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          // Erro silencioso
        }
      };

      // Envia evento inicial de conexão
      sendEvent({ type: 'connected', message: 'Conectado ao servidor de eventos' });

      // Adiciona o cliente à lista global de clientes
      if (!global.eventClients) {
        global.eventClients = [];
      }

      const clientId = Date.now().toString();
      const client = {
        id: clientId,
        send: sendEvent,
      };
      
      global.eventClients.push(client);

      // Envia heartbeat a cada 30 segundos para manter a conexão viva
      const heartbeatInterval = setInterval(() => {
        try {
          sendEvent({ type: 'heartbeat', timestamp: Date.now() });
        } catch (error) {
          // Se não conseguir enviar, a conexão provavelmente foi fechada
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Limpa quando o cliente desconecta
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        if (global.eventClients) {
          global.eventClients = global.eventClients.filter(
            (client: any) => client.id !== clientId
          );
        }
        try {
          controller.close();
        } catch (error) {
          // Ignora erros ao fechar o controller
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Declaração global para TypeScript
declare global {
  var eventClients: Array<{
    id: string;
    send: (data: any) => void;
  }> | undefined;
}

/**
 * Função utilitária para emitir eventos para todos os clientes conectados
 */
export function emitEvent(event: {
  type: 'nova_mensagem' | 'mensagem_enviada' | 'contato_atualizado' | 'ollama_response';
  contatoId?: string;
  contato?: string;
  data?: any;
}) {
  if (!global.eventClients || global.eventClients.length === 0) {
    return;
  }

  global.eventClients.forEach((client) => {
    try {
      client.send(event);
    } catch (error) {
      // Erro silencioso
    }
  });
}

