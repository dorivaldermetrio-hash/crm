/**
 * Processa variáveis de ambiente em prompts de resposta
 */

import { getFormattedHistory } from './generatePrompt';
import { getProductByName } from './getProductByName';
import { obterDatasDisponiveisServer } from './obterDatasDisponiveisServer';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';
import Config from '@/lib/models/Config';
import AtendimentoAI from '@/lib/models/AtendimentoAI';

/**
 * Processa todas as variáveis de ambiente no prompt
 * @param promptTemplate - Template do prompt com variáveis
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Prompt com variáveis substituídas
 */
export async function processPromptVariables(
  promptTemplate: string,
  contatoId: string,
  mensagemRecebida: string
): Promise<string> {
  try {
    await connectDB();

    // 1. Busca configuração para obter numMsgHist
    const config = await Config.findOne().lean();
    const numMsgHist = (config as any)?.numMsgHist || 10;

    // 2. Busca contato para obter informações (tenta WhatsApp primeiro, depois Instagram)
    // Busca sempre do banco para garantir dados atualizados (lean() não usa cache do Mongoose)
    let contato = await Contato.findById(contatoId).lean();
    if (!contato) {
      contato = await ContatoDM.findById(contatoId).lean();
    }
    if (!contato) {
      throw new Error(`Contato com ID ${contatoId} não encontrado`);
    }

    const contatoData = contato as any;

    // 2.1. Substitui {[PROMPT BASE]}
    if (promptTemplate.includes('{[PROMPT BASE]}')) {
      const promptBase = await AtendimentoAI.findOne({ nome: 'Definição Base' }).lean();
      const promptBaseTexto = (promptBase as any)?.prompt || '';
      
      promptTemplate = promptTemplate.replace(/\{\[PROMPT BASE\]\}/gi, promptBaseTexto);
    }

    // 3. Substitui {[HISTORICO DE MENSAGENS]}
    if (promptTemplate.includes('{[HISTORICO DE MENSAGENS]}')) {
      const historicoFormatado = await getFormattedHistory(contatoId, numMsgHist, true);
      const historicoTexto = historicoFormatado && 
        historicoFormatado !== 'Nenhuma mensagem anterior.' && 
        historicoFormatado !== 'Erro ao buscar histórico de mensagens.'
        ? historicoFormatado
        : 'Nenhuma mensagem anterior.';
      
      promptTemplate = promptTemplate.replace(/\{\[HISTORICO DE MENSAGENS\]\}/gi, historicoTexto);
    }

    // 3.1. Substitui {[ULTIMA MENSAGEM]}
    if (promptTemplate.includes('{[ULTIMA MENSAGEM]}')) {
      promptTemplate = promptTemplate.replace(/\{\[ULTIMA MENSAGEM\]\}/gi, mensagemRecebida.trim());
    }

    // 4. Substitui {[PRODUTO DE INTERESSE]}
    if (promptTemplate.includes('{[PRODUTO DE INTERESSE]}')) {
      const produtoInteresse = contatoData.produtoInteresse;
      let produtoTexto = '';

      if (produtoInteresse && produtoInteresse.trim() !== '' && produtoInteresse.trim() !== 'DESCONHECIDO') {
        const produto = await getProductByName(produtoInteresse.trim());
        
        if (produto) {
          produtoTexto = `Nome: ${produto.nome}\n`;
          if (produto.descBreve) {
            produtoTexto += `Descrição breve: ${produto.descBreve}\n`;
          }
          if (produto.descCompleta) {
            produtoTexto += `Descrição completa: ${produto.descCompleta}\n`;
          }
          if (produto.valor) {
            produtoTexto += `Valor: ${produto.valor}\n`;
          }
          if (produto.duracao) {
            produtoTexto += `Duração: ${produto.duracao}\n`;
          }
        } else {
          produtoTexto = 'Produto não encontrado.';
        }
      } else {
        produtoTexto = 'Nenhum produto de interesse definido ainda.';
      }

      promptTemplate = promptTemplate.replace(/\{\[PRODUTO DE INTERESSE\]\}/gi, produtoTexto);
    }

    // 5. Substitui {[RESUMO CASO]}
    if (promptTemplate.includes('{[RESUMO CASO]}')) {
      // Garante que resumoCaso existe (pode não existir em contatos antigos)
      const resumoCaso = contatoData.resumoCaso !== undefined && contatoData.resumoCaso !== null 
        ? String(contatoData.resumoCaso) 
        : '';
      promptTemplate = promptTemplate.replace(/\{\[RESUMO CASO\]\}/gi, resumoCaso.trim());
    }

    // 5.1. Substitui {[INFORMAÇÕES DO CASO]}
    if (promptTemplate.includes('{[INFORMAÇÕES DO CASO]}')) {
      // Garante que informacoesCaso existe (pode não existir em contatos antigos)
      const informacoesCaso = contatoData.informacoesCaso !== undefined && contatoData.informacoesCaso !== null 
        ? String(contatoData.informacoesCaso) 
        : '';
      promptTemplate = promptTemplate.replace(/\{\[INFORMAÇÕES DO CASO\]\}/gi, informacoesCaso.trim());
    }

    // 6. Substitui {[HORARIOS DISPONIVEIS]}
    if (promptTemplate.includes('{[HORARIOS DISPONIVEIS]}')) {
      try {
        const horariosDisponiveis = await obterDatasDisponiveisServer();
        let horariosTexto = '';
        
        if (horariosDisponiveis.length > 0) {
          horariosTexto = horariosDisponiveis
            .map((h) => h.dataFormatada)
            .join(', ');
        } else {
          horariosTexto = 'Nenhum horário disponível no momento.';
        }
        
        promptTemplate = promptTemplate.replace(/\{\[HORARIOS DISPONIVEIS\]\}/gi, horariosTexto);
      } catch (error) {
        console.error('❌ Erro ao obter horários disponíveis:', error);
        promptTemplate = promptTemplate.replace(/\{\[HORARIOS DISPONIVEIS\]\}/gi, 'Erro ao buscar horários disponíveis.');
      }
    }

    // 7. Substitui {[PRIMEIRO HORARIO DISPONIVEL]}
    if (promptTemplate.includes('{[PRIMEIRO HORARIO DISPONIVEL]}')) {
      try {
        const horariosDisponiveis = await obterDatasDisponiveisServer();
        let primeiroHorario = '';
        
        if (horariosDisponiveis.length > 0) {
          primeiroHorario = horariosDisponiveis[0].dataFormatada;
        } else {
          primeiroHorario = 'Nenhum horário disponível no momento.';
        }
        
        promptTemplate = promptTemplate.replace(/\{\[PRIMEIRO HORARIO DISPONIVEL\]\}/gi, primeiroHorario);
      } catch (error) {
        console.error('❌ Erro ao obter primeiro horário disponível:', error);
        promptTemplate = promptTemplate.replace(/\{\[PRIMEIRO HORARIO DISPONIVEL\]\}/gi, 'Erro ao buscar primeiro horário disponível.');
      }
    }

    // 8. Substitui {[PRIMEIRO NOME]}
    if (promptTemplate.includes('{[PRIMEIRO NOME]}')) {
      const nomeCompleto = contatoData.nomeCompleto !== undefined && contatoData.nomeCompleto !== null 
        ? String(contatoData.nomeCompleto).trim() 
        : '';
      
      let primeiroNome = '';
      if (nomeCompleto) {
        // Pega a primeira palavra do nome completo
        const palavras = nomeCompleto.split(/\s+/);
        primeiroNome = palavras[0] || '';
      } else {
        primeiroNome = '';
      }
      
      promptTemplate = promptTemplate.replace(/\{\[PRIMEIRO NOME\]\}/gi, primeiroNome);
    }

    return promptTemplate;
  } catch (error) {
    console.error('❌ Erro ao processar variáveis do prompt:', error);
    throw error;
  }
}

