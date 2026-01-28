'use client';

import { useServerEvents } from '@/hooks/useServerEvents';
import { ServerEvent } from '@/hooks/useServerEvents';

/**
 * Componente global para logar respostas do Ollama no console do navegador
 * Deve ser usado no layout ou em uma página principal
 */
export default function OllamaResponseLogger() {
  useServerEvents({
    onOllamaResponse: (event: ServerEvent) => {
      // Exibe JSON do Ollama no console do navegador
      console.log('\n📋 ========================================');
      console.log('📋 RESPOSTA JSON DO OLLAMA (NO NAVEGADOR):');
      console.log('📋 ========================================');
      console.log('Status Atual:', event.data?.statusAtual || 'N/A');
      console.log('Resposta JSON:', event.data?.ollamaResponse || event.data);
      console.log(JSON.stringify(event.data?.ollamaResponse || event.data, null, 2));
      console.log('📋 ========================================\n');
    },
  });

  // Este componente não renderiza nada visualmente
  return null;
}

