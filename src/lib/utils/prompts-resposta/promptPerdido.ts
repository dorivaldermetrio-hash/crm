/**
 * Geração de prompt de resposta para status "Perdida"
 */

import { getFormattedHistory } from '../generatePrompt';

/**
 * Gera o prompt de resposta para contatos com status "Perdida"
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generatePromptPerdido(
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
    let prompt = `status: Perdido\n\n`;
    prompt += `quantidade de mensagens: ${quantidadeMensagens + 1}\n\n`;
    prompt += `Aqui o cliente não tem mais interesse em nenhum produto ou serviço que atualmente esta sendo oferecido.Voce deve ser simpatico e encerrar o contato com uma mensagem amigável, para que o contato no futuro possa render novas oportunidades.\n\n`;
    prompt += `REGRAS\n`;
    prompt += `Se o cliente perdeu o interesse em todos os produtos e serviços, então agradeça o contato de forma amigável\n\n`;

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
    console.error('❌ Erro ao gerar prompt Perdido:', error);
    throw error;
  }
}

