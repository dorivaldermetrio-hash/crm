/**
 * Geração de prompt de resposta para status "Negociação"
 */

import { getFormattedHistory } from '../generatePrompt';
import { getProductByName } from '../getProductByName';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';

/**
 * Gera o prompt de resposta para contatos com status "Negociação"
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generatePromptNegociacao(
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

    // 4. Busca informações do produto de interesse do cliente
    await connectDB();
    const contato = await Contato.findById(contatoId).lean();
    let informacoesProduto = '';

    if (contato) {
      const produtoInteresse = (contato as any).produtoInteresse;
      if (produtoInteresse && produtoInteresse.trim() !== '' && produtoInteresse.trim() !== 'DESCONHECIDO') {
        const produto = await getProductByName(produtoInteresse.trim());
        
        if (produto) {
          informacoesProduto = `Nome: ${produto.nome}\n`;
          if (produto.descBreve) {
            informacoesProduto += `Descrição breve: ${produto.descBreve}\n`;
          }
          if (produto.descCompleta) {
            informacoesProduto += `Descrição completa: ${produto.descCompleta}\n`;
          }
          if (produto.valor) {
            informacoesProduto += `Valor: ${produto.valor}\n`;
          }
          if (produto.duracao) {
            informacoesProduto += `Duração: ${produto.duracao}\n`;
          }
        }
      }
    }

    // 5. Monta o prompt completo
    let prompt = `status: Negociação\n\n`;
    prompt += `quantidade de mensagens: ${quantidadeMensagens + 1}\n\n`;
    prompt += `Nesse momento, você vai lidar exclusivamente com a parte de valores, que é informada no produto mais abaixo. Aqui voce deve averiguar se a ultima mensagem é referente a custos, preços ou valores, se o cliente tem duvidas sobre isso ou se tem alguma objeção.\n\n`;
    prompt += `REGRAS\n`;
    prompt += `Você deve apresentar o valor do produto de interesse do cliente, de preferencia sempre o valor minimo, mas enfatizar que o valor é definido na confecção final do projeto, levando em consideração todas as necessidades do cliente.\n\n`;

    if (informacoesProduto) {
      prompt += `Produto de interesse do cliente\n\n`;
      prompt += `[informações do produto]\n`;
      prompt += `${informacoesProduto}\n\n`;
    }

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
    console.error('❌ Erro ao gerar prompt Negociação:', error);
    throw error;
  }
}

