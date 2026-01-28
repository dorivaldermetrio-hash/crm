/**
 * Geração de prompt estruturado para atendimento AI
 * 
 * Este módulo é responsável por montar o prompt completo que será enviado
 * para o Ollama, incluindo:
 * - Prompt base do AtendimentoAI
 * - Comportamento específico do status atual do contato
 * - Histórico da conversa (últimas 10 mensagens)
 * - Mensagem atual do cliente
 */

import connectDB from '@/lib/db';
import AtendimentoAI from '@/lib/models/AtendimentoAI';
import Contato from '@/lib/models/Contato';
import Mensagem from '@/lib/models/Mensagem';
import { getProductByName } from './getProductByName';

interface GeneratePromptParams {
  contatoId: string;
  mensagemRecebida: string;
}

interface PromptResult {
  prompt: string;
  statusAtual: string;
}

/**
 * Mapeia o status do contato para o campo correspondente no AtendimentoAI
 */
function getStatusField(status: string): string {
  const statusMap: Record<string, string> = {
    'Aberta': 'aberta',
    'Qualificação': 'qualificação',
    'Proposta': 'proposta',
    'Negociação': 'negociação',
    'Fechamento': 'fechamento',
    'Perdida': 'perdida',
  };

  return statusMap[status] || 'aberta';
}

/**
 * Busca o histórico de mensagens formatado para o prompt
 * Retorna as últimas 10 mensagens, mais antigas primeiro
 * Exclui a mensagem atual para evitar duplicação
 */
export async function getFormattedHistory(
  contatoId: string, 
  limit: number = 10,
  excludeLastClientMessage: boolean = true
): Promise<string> {
  try {
    await connectDB();
    
    const mensagemDoc = await Mensagem.findOne({ contatoID: contatoId }).lean();

    if (!mensagemDoc || !mensagemDoc.mensagens || mensagemDoc.mensagens.length === 0) {
      return 'Nenhuma mensagem anterior.';
    }

    // Ordena mensagens por data (mais antiga primeiro)
    const mensagens = [...mensagemDoc.mensagens];
    mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    // Filtra apenas mensagens de texto com conteúdo
    let mensagensTexto = mensagens.filter((msg: any) => {
      return msg.tipo === 'texto' && msg.mensagem && msg.mensagem.trim() !== '';
    });

    // Se deve excluir a última mensagem do cliente (para não duplicar com mensagem atual)
    if (excludeLastClientMessage && mensagensTexto.length > 0) {
      // Encontra a última mensagem do cliente (não é do sistema)
      for (let i = mensagensTexto.length - 1; i >= 0; i--) {
        if (mensagensTexto[i].contatoID !== '1') {
          mensagensTexto.splice(i, 1);
          break;
        }
      }
    }

    // Pega as últimas N mensagens (mantém ordem cronológica - mais antigas primeiro)
    const ultimasMensagens = mensagensTexto.slice(-limit);

    if (ultimasMensagens.length === 0) {
      return 'Nenhuma mensagem anterior.';
    }

    // Formata as mensagens para o prompt de forma mais clara
    const historicoFormatado = ultimasMensagens.map((msg: any) => {
      const role = msg.contatoID === '1' ? 'Assistente' : 'Cliente';
      return `${role}: ${msg.mensagem.trim()}`;
    }).join('\n');

    return historicoFormatado;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico formatado:', error);
    return 'Erro ao buscar histórico de mensagens.';
  }
}

/**
 * Gera o prompt estruturado completo para envio ao Ollama
 */
export async function generatePrompt({
  contatoId,
  mensagemRecebida,
}: GeneratePromptParams): Promise<PromptResult> {
  try {
    await connectDB();

    // 1. Busca objeto AtendimentoAI
    const atendimentoAI = await AtendimentoAI.findOne().lean();

    if (!atendimentoAI) {
      throw new Error('Configuração de AtendimentoAI não encontrada no banco de dados');
    }

    // 2. Busca objeto Contato e status atual
    const contato = await Contato.findById(contatoId).lean();

    if (!contato) {
      throw new Error(`Contato com ID ${contatoId} não encontrado`);
    }

    const statusAtual = contato.status || 'Aberta';

    // 3. Obtém o campo do status no AtendimentoAI
    const statusField = getStatusField(statusAtual);
    const comportamentoStatus = (atendimentoAI as any)[statusField] || '';

    // 4. Busca histórico formatado (exclui a mensagem atual que acabou de ser recebida)
    const historicoFormatado = await getFormattedHistory(contatoId, 10, true);

    // 5. Monta o prompt completo de forma mais clara e estruturada
    const promptBase = atendimentoAI.promptBase || '';
    
    // Se não tem histórico, é a primeira mensagem
    const temHistorico = historicoFormatado && 
                         historicoFormatado !== 'Nenhuma mensagem anterior.' && 
                         historicoFormatado !== 'Erro ao buscar histórico de mensagens.';
    
    // Constrói o prompt de forma mais clara
    let prompt = promptBase + '\n\n';

    if (temHistorico) {
      prompt += `HISTÓRICO DA CONVERSA (ordem: mais antigas primeiro):\n${historicoFormatado}\n\n`;
    }

    prompt += `MENSAGEM ATUAL DO CLIENTE:\n"${mensagemRecebida.trim()}"\n\n`;

    // 6. Se o contato tem produtoInteresse, busca informações do produto
    const produtoInteresse = (contato as any).produtoInteresse;
    if (produtoInteresse && produtoInteresse.trim() !== '' && produtoInteresse.trim() !== 'DESCONHECIDO') {
      const produto = await getProductByName(produtoInteresse.trim());
      
      if (produto) {
        prompt += `Produto ou serviço que o cliente aparentemente está interessado:\n`;
        prompt += `Nome: ${produto.nome}\n`;
        if (produto.descBreve) {
          prompt += `Descrição breve: ${produto.descBreve}\n`;
        }
        if (produto.descCompleta) {
          prompt += `Descrição completa: ${produto.descCompleta}\n`;
        }
        if (produto.valor) {
          prompt += `Valor: ${produto.valor}\n`;
        }
        if (produto.duracao) {
          prompt += `Duração: ${produto.duracao}\n`;
        }
        prompt += `\n`;
      }
    }

    prompt += `---\n\n`;
    prompt += `STATUS ATUAL DO CONTATO: "${statusAtual}"\n\n`;
    prompt += `COMPORTAMENTO ESPERADO PARA ESTE STATUS:\n${comportamentoStatus}\n\n`;
    prompt += `---\n\n`;
    
    prompt += `INSTRUÇÕES:\n`;
    prompt += `1. Leia TODO o histórico e a mensagem atual com atenção\n`;
    prompt += `2. Nunca repita respostas anteriores\n`;
    prompt += `3. Mantenha coerência com o status atual\n`;
    prompt += `4. Se houver valor disponível no contexto, informe sem hesitar\n`;
    
    prompt += `RESPOSTA OBRIGATÓRIA EM JSON (apenas o objeto, sem markdown, sem texto extra):\n`;
    prompt += `{\n  "resposta": "sua_resposta_aqui"\n}`;

    // Remove linhas vazias extras
    prompt = prompt.replace(/\n{3,}/g, '\n\n').trim();

    // Exibe APENAS o prompt completo no terminal
    console.log('\n' + '═'.repeat(80));
    console.log('📝 PROMPT ENVIADO PARA O OLLAMA:');
    console.log('═'.repeat(80));
    console.log(prompt);
    console.log('═'.repeat(80) + '\n');

    return {
      prompt: prompt.trim(),
      statusAtual,
    };
  } catch (error) {
    throw error;
  }
}

