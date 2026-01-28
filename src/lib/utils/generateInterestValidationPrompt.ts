/**
 * Geração de prompt para validação de troca de interesse em produtos
 */

import { getFormattedHistory } from './generatePrompt';
import { getActiveProducts } from './getActiveProducts';

/**
 * Gera o prompt para validação de troca de interesse em produtos
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt formatado para envio ao Ollama
 */
export async function generateInterestValidationPrompt(
  contatoId: string,
  mensagemRecebida: string
): Promise<string> {
  try {
    // 1. Busca histórico formatado (exclui a mensagem atual)
    const historicoFormatado = await getFormattedHistory(contatoId, 10, true);

    // 2. Busca produtos ativos
    const produtosAtivos = await getActiveProducts();

    // 3. Monta lista de produtos para o prompt
    let listaProdutos = '';
    if (produtosAtivos.length === 0) {
      listaProdutos = 'Nenhum produto ativo disponível.';
    } else {
      listaProdutos = produtosAtivos
        .map((produto) => {
          return `- ${produto.nome}\n  descrição breve do produto: "${produto.descBreve}"`;
        })
        .join('\n\n');
    }

    // 4. Verifica se tem histórico
    const temHistorico =
      historicoFormatado &&
      historicoFormatado !== 'Nenhuma mensagem anterior.' &&
      historicoFormatado !== 'Erro ao buscar histórico de mensagens.';

    // 5. Monta o prompt completo
    let prompt = 'Avalie a conversa deste contato:\n\n';

    if (temHistorico) {
      prompt += `Histórico das últimas 10 mensagens da conversa:\n${historicoFormatado}\n\n`;
    }

    prompt += `A mensagem atual do cliente:\n"${mensagemRecebida.trim()}"\n\n`;

    prompt += `Com base APENAS nessas mensagens, determine se o cliente gostaria de trocar de produto ou serviço.\n\n`;

    prompt += `Produtos possíveis:\n${listaProdutos}\n\n`;

    prompt += `Se NÃO houver interesse em trocar de produto ou serviço:\n`;
    prompt += `retorne:\n`;
    prompt += `{\n  "troca": false,\n  "produto": null\n}\n\n`;

    prompt += `Se houver interesse em trocar de produto ou serviço, mas ainda não for possível identificar com certeza qual produto:\n`;
    prompt += `retorne:\n`;
    prompt += `{\n  "troca": true,\n  "produto": "DESCONHECIDO"\n}\n\n`;

    prompt += `Se houver interesse em trocar de produto ou serviço:\n`;
    prompt += `retorne:\n`;
    prompt += `{\n  "troca": true,\n  "produto": "<nome do produto>"\n}\n\n`;

    prompt += `Responda SOMENTE com o objeto JSON exato, sem nenhum texto adicional.`;

    return prompt.trim();
  } catch (error) {
    console.error('❌ Erro ao gerar prompt de validação de interesse:', error);
    throw error;
  }
}

