/**
 * Geração de prompt para validação de status do contato
 */

import { getFormattedHistory } from './generatePrompt';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';

/**
 * Gera o prompt para validação de status
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generateStatusValidationPrompt(
  contatoId: string,
  mensagemRecebida: string
): Promise<string> {
  try {
    // 1. Busca informações do contato
    await connectDB();
    const contato = await Contato.findById(contatoId).lean();

    if (!contato) {
      throw new Error(`Contato com ID ${contatoId} não encontrado`);
    }

    const contatoData = contato as any;
    const numMsgAberta = contatoData.numMsgAberta || 0;
    const numMsgQualificacao = contatoData.numMsgQualificacao || 0;
    const numMsgProposta = contatoData.numMsgProposta || 0;
    const numMsgNegociacao = contatoData.numMsgNegociacao || 0;
    const numMsgFechamento = contatoData.numMsgFechamento || 0;
    const numMsgPerdida = contatoData.numMsgPerdida || 0;
    const produtoInteresse = contatoData.produtoInteresse || '';

    // 2. Busca histórico formatado (exclui a mensagem atual)
    const historicoFormatado = await getFormattedHistory(contatoId, 10, true);

    // 3. Verifica se tem histórico
    const temHistorico =
      historicoFormatado &&
      historicoFormatado !== 'Nenhuma mensagem anterior.' &&
      historicoFormatado !== 'Erro ao buscar histórico de mensagens.';

    // 4. Monta o prompt completo
    let prompt = `Prompt para definir o status atual da conversa\n\n`;

    prompt += `Você é um classificador de status de atendimento comercial da empresa RM Soft.\n\n`;

    prompt += `Seu ÚNICO objetivo é analisar a conversa e definir o status real do contato NESTE EXATO MOMENTO.\n\n`;

    prompt += `Você NÃO deve responder o cliente.\n`;
    prompt += `Você NÃO deve vender.\n`;
    prompt += `Você NÃO deve explicar nada.\n`;
    prompt += `Você APENAS retorna o status.\n\n`;

    prompt += `Status possíveis (retorne APENAS UM deles):\n`;
    prompt += `Aberta\n`;
    prompt += `Qualificação\n`;
    prompt += `Proposta\n`;
    prompt += `Negociação\n`;
    prompt += `Fechamento\n`;
    prompt += `Perdida\n\n`;

    prompt += `Aberta\n`;
    prompt += `Status para quando teremos o primeiro contato com o cliente, normalmete usado apenas para responder uma saudação inicial.\n`;
    prompt += `Número máximo de mensagens com esse status: 1\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgAberta}\n\n`;

    prompt += `Qualificação\n`;
    prompt += `Status para quando o cliente entrou em contato mas o produto ou serviço de interesse dele ainda não foi definido, sendo "" ou "DESCONHECIDO"\n`;
    prompt += `Número máximo de mensagens enviada com esse status: 3\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgQualificacao}\n`;
    prompt += `Produto definido como interesse: ${produtoInteresse || '(não definido)'}\n\n`;

    prompt += `Proposta\n`;
    prompt += `Status para quando o produto ou serviço de interesse ja esta definido, e está sendo conversado sobre ele. Aqui é quando o produto é apresentado assim como suas soluções\n`;
    prompt += `Número máximo de mensagens enviada com esse status: 3\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgProposta}\n`;
    prompt += `Produto definido como interesse: ${produtoInteresse || '(não definido)'}\n\n`;

    prompt += `Negociação\n`;
    prompt += `Status para quando o que esta sendo discutido é o valor de um produto ou serviço. Nesse ponto, o cliente esta interessado em saber sobre valores como funciona a questão do pagamento, se tem contrato, custo de desenvolvimento e questões atreladas a valores de um produto.\n`;
    prompt += `Número máximo de mensagens enviada com esse status: 3\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgNegociacao}\n`;
    prompt += `Produto definido como interesse: ${produtoInteresse || '(não definido)'}\n\n`;

    prompt += `Fechamento\n`;
    prompt += `Status para quando o cliente esta decido de que quer implementar o produto ou serviço. Nesse ponto ele ja concordou com valores e esta afirmando interesse em desenvolver o sistema que ja foi proposto para ele.\n`;
    prompt += `Número máximo de mensagens enviada com esse status: 2\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgFechamento}\n`;
    prompt += `Produto definido como interesse: ${produtoInteresse || '(não definido)'}\n\n`;

    prompt += `Perdida\n`;
    prompt += `Status para quando o cliente demonstra não estar mais interessado nos serviços ou produtos\n`;
    prompt += `Número máximo de mensagens enviada com esse status: 1\n`;
    prompt += `Número de mensagens ja enviada com esse status: ${numMsgPerdida}\n\n`;

    if (temHistorico) {
      prompt += `Primeiro avalie o histórico da conversa (mais antiga primeiro)\n\n`;
      prompt += `[historico mensagens]\n`;
      prompt += `${historicoFormatado}\n\n`;
    }

    prompt += `Agora avalie a ultima mensagem enviada para você pelo cliente:\n\n`;
    prompt += `[ultima mensagem]\n`;
    prompt += `"${mensagemRecebida.trim()}"\n\n`;

    prompt += `Com base no historico de mensagens e PRINCIPALMENTE na ultima mensagem defina qual deve ser o status dessa conversa\n\n`;

    prompt += `Responda somente com um objeto JSON, sem nenhum texto extra\n\n`;
    prompt += `{status : status_da_conversa_aqui}`;

    return prompt.trim();
  } catch (error) {
    console.error('❌ Erro ao gerar prompt de validação de status:', error);
    throw error;
  }
}

