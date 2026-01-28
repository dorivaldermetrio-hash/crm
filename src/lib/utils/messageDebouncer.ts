/**
 * Message Debouncer
 * 
 * Gerencia o debounce de mensagens para evitar processamento múltiplo da IA
 * quando o cliente envia várias mensagens em sequência rápida.
 * 
 * Funcionamento:
 * - Quando uma mensagem chega, agenda o processamento da IA para N segundos no futuro
 * - Se uma nova mensagem chegar antes do timer expirar, cancela o timer anterior
 *   e agenda um novo (reseta a contagem)
 * - Após N segundos sem novas mensagens, processa a IA uma única vez
 */

interface DebouncerEntry {
  timer: NodeJS.Timeout;
  lastMessageTimestamp: number;
  contatoId: string;
  platform: 'whatsapp' | 'instagram';
  messageCount: number;
  callback: () => Promise<void>;
}

// Map para armazenar timers por contato
// Chave: `${contatoId}_${platform}`
// Exemplo: "507f1f77bcf86cd799439011_whatsapp"
const debouncerMap = new Map<string, DebouncerEntry>();

/**
 * Configuração do delay padrão (10 segundos)
 * Pode ser sobrescrito via variável de ambiente
 */
const DEFAULT_DELAY_MS = parseInt(process.env.MESSAGE_DEBOUNCE_DELAY || '10000', 10);

/**
 * Agenda o processamento da IA com debounce
 * 
 * @param contatoId - ID do contato
 * @param platform - Plataforma ('whatsapp' ou 'instagram')
 * @param callback - Função assíncrona que processa a IA
 * @param delayMs - Delay em milissegundos (opcional, padrão 10s)
 */
export function scheduleAIProcessing(
  contatoId: string,
  platform: 'whatsapp' | 'instagram',
  callback: () => Promise<void>,
  delayMs: number = DEFAULT_DELAY_MS
): void {
  const key = `${contatoId}_${platform}`;
  
  // Se já existe timer para este contato, cancela
  const existing = debouncerMap.get(key);
  if (existing) {
    clearTimeout(existing.timer);
    console.log(`⏰ Timer anterior cancelado para ${key} (tinha ${existing.messageCount} mensagem(ns))`);
  }
  
  // Conta mensagens para debug
  const messageCount = (existing?.messageCount || 0) + 1;
  const lastMessageTimestamp = Date.now();
  
  // Cria novo timer
  const timer = setTimeout(async () => {
    try {
      console.log(`\n🤖 Processando IA após debounce de ${delayMs}ms (${messageCount} mensagem(ns) aguardadas)`);
      console.log(`   Contato: ${contatoId} (${platform})\n`);
      
      await callback();
    } catch (error) {
      console.error('❌ Erro ao processar IA após debounce:', error);
    } finally {
      // Remove do Map após processar
      debouncerMap.delete(key);
    }
  }, delayMs);
  
  // Armazena no Map
  debouncerMap.set(key, {
    timer,
    lastMessageTimestamp,
    contatoId,
    platform,
    messageCount,
    callback,
  });
  
  console.log(`⏰ Timer agendado para ${delayMs}ms (${messageCount} mensagem(ns) em buffer)`);
}

/**
 * Cancela o processamento agendado para um contato
 * 
 * @param contatoId - ID do contato
 * @param platform - Plataforma ('whatsapp' ou 'instagram')
 */
export function cancelScheduledProcessing(
  contatoId: string,
  platform: 'whatsapp' | 'instagram'
): boolean {
  const key = `${contatoId}_${platform}`;
  const existing = debouncerMap.get(key);
  
  if (existing) {
    clearTimeout(existing.timer);
    debouncerMap.delete(key);
    console.log(`❌ Timer cancelado manualmente para ${key}`);
    return true;
  }
  
  return false;
}

/**
 * Verifica se há processamento pendente para um contato
 * 
 * @param contatoId - ID do contato
 * @param platform - Plataforma ('whatsapp' ou 'instagram')
 * @returns Informações sobre o timer pendente ou null
 */
export function getPendingProcessing(
  contatoId: string,
  platform: 'whatsapp' | 'instagram'
): { messageCount: number; lastMessageTimestamp: number } | null {
  const key = `${contatoId}_${platform}`;
  const existing = debouncerMap.get(key);
  
  if (existing) {
    return {
      messageCount: existing.messageCount,
      lastMessageTimestamp: existing.lastMessageTimestamp,
    };
  }
  
  return null;
}

/**
 * Limpa todos os timers pendentes (útil para testes ou shutdown)
 */
export function clearAllPendingProcessing(): void {
  let count = 0;
  debouncerMap.forEach((entry) => {
    clearTimeout(entry.timer);
    count++;
  });
  debouncerMap.clear();
  console.log(`🧹 ${count} timer(s) cancelado(s)`);
}

/**
 * Retorna estatísticas dos timers pendentes (útil para debug)
 */
export function getDebouncerStats(): {
  totalPending: number;
  pendingByPlatform: { whatsapp: number; instagram: number };
} {
  const stats = {
    totalPending: debouncerMap.size,
    pendingByPlatform: {
      whatsapp: 0,
      instagram: 0,
    },
  };
  
  debouncerMap.forEach((entry) => {
    if (entry.platform === 'whatsapp') {
      stats.pendingByPlatform.whatsapp++;
    } else {
      stats.pendingByPlatform.instagram++;
    }
  });
  
  return stats;
}

