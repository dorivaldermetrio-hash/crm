'use client';

import { useEffect, useRef } from 'react';

export type EventType = 'nova_mensagem' | 'mensagem_enviada' | 'contato_atualizado' | 'ollama_response' | 'heartbeat' | 'connected';

export interface ServerEvent {
  type: EventType;
  contatoId?: string;
  contato?: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

interface UseServerEventsOptions {
  onNovaMensagem?: (event: ServerEvent) => void;
  onMensagemEnviada?: (event: ServerEvent) => void;
  onContatoAtualizado?: (event: ServerEvent) => void;
  onOllamaResponse?: (event: ServerEvent) => void;
  enabled?: boolean;
}

/**
 * Hook para conectar ao Server-Sent Events e receber atualizações em tempo real
 */
export function useServerEvents({
  onNovaMensagem,
  onMensagemEnviada,
  onContatoAtualizado,
  onOllamaResponse,
  enabled = true,
}: UseServerEventsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connect = () => {
      // Fecha conexão anterior se existir
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const eventSource = new EventSource('/api/events');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('✅ Conectado ao servidor de eventos');
          // Limpa timeout de reconexão se conectou
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data: ServerEvent = JSON.parse(event.data);

            // Ignora heartbeats (mantém conexão viva)
            if (data.type === 'heartbeat' || (data as any).type === 'heartbeat') {
              return;
            }

            switch (data.type) {
              case 'nova_mensagem':
                onNovaMensagem?.(data);
                break;
              case 'mensagem_enviada':
                onMensagemEnviada?.(data);
                break;
              case 'contato_atualizado':
                onContatoAtualizado?.(data);
                break;
              case 'ollama_response':
                onOllamaResponse?.(data);
                break;
            }
          } catch (error) {
            console.error('Erro ao processar evento:', error);
          }
        };

        eventSource.onerror = (error) => {
          // Verifica o estado da conexão antes de tratar como erro
          if (eventSource.readyState === EventSource.CLOSED) {
            // Conexão foi fechada (pode ser timeout normal ou erro real)
            // Não loga como erro se foi fechada normalmente
            if (eventSourceRef.current === eventSource) {
              eventSourceRef.current = null;
              
              // Reconecta apenas se ainda estiver habilitado
              if (enabled) {
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log('🔄 Reconectando SSE após desconexão...');
                  connect();
                }, 3000);
              }
            }
          } else if (eventSource.readyState === EventSource.CONNECTING) {
            // Ainda está tentando conectar, não é um erro ainda
            return;
          } else {
            // Erro real durante a conexão
            console.warn('⚠️ Erro na conexão SSE, tentando reconectar...');
            if (eventSourceRef.current === eventSource && enabled) {
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log('🔄 Tentando reconectar...');
                connect();
              }, 3000);
            }
          }
        };
      } catch (error) {
        console.error('Erro ao criar conexão SSE:', error);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, onNovaMensagem, onMensagemEnviada, onContatoAtualizado, onOllamaResponse]);
}

