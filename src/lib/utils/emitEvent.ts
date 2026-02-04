/**
 * Função utilitária para emitir eventos para todos os clientes conectados via SSE
 */

// Declaração global para TypeScript
declare global {
  var eventClients: Array<{
    id: string;
    send: (data: any) => void;
  }> | undefined;
}

/**
 * Emite um evento para todos os clientes conectados via Server-Sent Events
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
