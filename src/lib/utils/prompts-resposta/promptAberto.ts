/**
 * Geração de prompt de resposta para status "Aberta"
 */

import { getFormattedHistory } from '../generatePrompt';

/**
 * Gera o prompt de resposta para contatos com status "Aberta"
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generatePromptAberto(
  contatoId: string,
  mensagemRecebida: string
): Promise<string> {
  try {
    // 1. Busca histórico formatado (mais antigas primeiro)
    const historicoFormatado = await getFormattedHistory(contatoId, 10, true);

    // 2. Verifica se tem histórico
    const temHistorico =
      historicoFormatado &&
      historicoFormatado !== 'Nenhuma mensagem anterior.' &&
      historicoFormatado !== 'Erro ao buscar histórico de mensagens.';

    // 3. Conta quantas mensagens existem no histórico
    const quantidadeMensagens = temHistorico
      ? historicoFormatado.split('\n').filter((line) => line.trim() !== '').length
      : 0;

    // 4. Monta o prompt completo
    let prompt = `status: Aberta\n\n`;
    prompt += `quantidade de mensagens: ${quantidadeMensagens + 1}\n\n`;
    prompt += `Nesse momento, você apenas se apresenta e dá uma saudação inicial para a conversa desenvolver.\n\n`;
    prompt += `REGRAS\n`;
    prompt += `Seja educado e simpático. E apenas questione como a empresa pode ajudar a pessoa. Sem forçar nada. Seja apenas educado e receptivo.\n\n`;

    if (temHistorico) {
      prompt += `Primeiro avalie o histórico da conversa (mais antiga primeiro)\n\n`;
      prompt += `[historico mensagens]\n`;
      prompt += `${historicoFormatado}\n\n`;
    }

    prompt += `Agora avalie a ultima mensagem enviada para você pelo cliente:\n\n`;
    prompt += `[ultima mensagem]\n`;
    prompt += `"${mensagemRecebida.trim()}"\n\n`;

    prompt += `Responda a ultima mensagem contextualizada com o historico de mensagens. O objetivo é que sua resposta de sequência a conversa.\n\n`;
    prompt += `RESPOSTA OBRIGATÓRIA EM JSON (apenas o objeto, sem markdown, sem texto extra):\n`;
    prompt += `{\n  "resposta": "sua_resposta_aqui"\n}`;

    return prompt.trim();
  } catch (error) {
    console.error('❌ Erro ao gerar prompt Aberto:', error);
    throw error;
  }
}

