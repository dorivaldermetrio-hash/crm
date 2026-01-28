/**
 * Geração de prompt de resposta para status "Qualificação"
 */

import { getFormattedHistory } from '../generatePrompt';

/**
 * Gera o prompt de resposta para contatos com status "Qualificação"
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generatePromptQualificacao(
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
    let prompt = `status: Qualificação\n\n`;
    prompt += `quantidade de mensagens: ${quantidadeMensagens + 1}\n\n`;
    prompt += `Nesse momento, você precisa entender qual a necessidade do cliente e se os serviços da empresa podem ajudar.\n\n`;
    prompt += `REGRAS\n`;
    prompt += `Você pode fazer no maximo 3 perguntas para entender qual o produto ou serviço da empresa pode ajudar o cliente. Nesse status precisamos definir um produto de interesse do cliente.\n\n`;
    prompt += `Perguntas Úteis:\n`;
    prompt += `O que você busca resolver com a nossa empresa?\n`;
    prompt += `Quantos clientes pretende atender?\n`;
    prompt += `Você ja usa algum sistema que pretende melhorar?\n\n`;

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
    console.error('❌ Erro ao gerar prompt Qualificação:', error);
    throw error;
  }
}

