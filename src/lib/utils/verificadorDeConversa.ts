/**
 * Verifica o estado da conversa e decide qual prompt executar
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

export interface VerificacaoConversa {
  promptNome: string;
  propriedadeParaAtualizar?: 'saudacao' | 'pedidoResumo' | 'confirmacaoResumo' | 'urgenciaDefinida' | 'selecionandoData';
  precisaValidacao?: boolean; // Se true, precisa executar prompt de validação após processar
  precisaValidacaoResumoIncorporacao?: boolean; // Se true, precisa executar fluxo de Validação do Resumo e Incorporação
  precisaValidacaoUrgenciaFinal?: boolean; // Se true, precisa executar Validação de Urgência -> Solicitação de Nome
  precisaValidacaoNome?: boolean; // Se true, precisa executar Validação de Nome -> Oferecendo Agendamento
  precisaValidacaoAgendamento?: boolean; // Se true, precisa executar Validação de Agendamento -> (possivelmente) criar agendamento
}

/**
 * Verifica o estado da conversa e retorna qual prompt deve ser executado
 * @param contatoId - ID do contato
 * @param isInstagram - Se true, busca no ContatoDM, senão busca no Contato
 * @returns Nome do prompt a ser executado e qual propriedade atualizar após enviar
 */
export async function verificadorDeConversa(
  contatoId: string,
  isInstagram: boolean = false
): Promise<VerificacaoConversa | null> {
  try {
    await connectDB();

    // Busca o contato (WhatsApp ou Instagram)
    let contato: any;
    if (isInstagram) {
      contato = await ContatoDM.findById(contatoId).lean();
    } else {
      contato = await Contato.findById(contatoId).lean();
    }

    if (!contato) {
      console.error(`❌ Contato ${contatoId} não encontrado`);
      return null;
    }

    // Verifica o estado da conversa
    // Se saudacao é false, executa prompt "Novo Contato"
    if (!contato.saudacao) {
      return {
        promptNome: 'Novo Contato',
        propriedadeParaAtualizar: 'saudacao',
      };
    }

    // Se saudacao é true, executa prompt "Triagem em Andamento"
    if (contato.saudacao && !contato.pedidoResumo) {
      return {
        promptNome: 'Triagem em Andamento',
        propriedadeParaAtualizar: 'pedidoResumo',
      };
    }

    // Se saudacao é true, pedidoResumo é true, mas confirmacaoResumo é false
    // Executa o fluxo especial: Verificador de Resumo -> Validação de Resumo
    if (contato.saudacao && contato.pedidoResumo && !contato.confirmacaoResumo) {
      return {
        promptNome: 'Verificador de Resumo',
        propriedadeParaAtualizar: 'confirmacaoResumo',
        precisaValidacao: true, // Flag especial para indicar que precisa executar Validação de Resumo depois
      };
    }

    // Se todas as propriedades são true (incluindo urgenciaDefinida, selecionandoData e propostaAgendamento)
    // Executa o fluxo: Validação de Agendamento -> (possivelmente) criar agendamento
    if (contato.saudacao && contato.pedidoResumo && contato.confirmacaoResumo && contato.urgenciaDefinida && contato.selecionandoData && contato.propostaAgendamento) {
      return {
        promptNome: 'Validação de Agendamento',
        precisaValidacaoAgendamento: true, // Flag especial para fluxo de validação de agendamento
      };
    }

    // Se todas as propriedades são true (incluindo urgenciaDefinida e selecionandoData)
    // Executa o fluxo: Validação de Nome -> Oferecendo Agendamento
    if (contato.saudacao && contato.pedidoResumo && contato.confirmacaoResumo && contato.urgenciaDefinida && contato.selecionandoData) {
      return {
        promptNome: 'Validação de Nome',
        precisaValidacaoNome: true, // Flag especial para fluxo de nome e agendamento
      };
    }

    // Se todas as propriedades são true (incluindo urgenciaDefinida)
    // Executa o fluxo: Validação de Urgência -> Solicitação de Nome
    if (contato.saudacao && contato.pedidoResumo && contato.confirmacaoResumo && contato.urgenciaDefinida) {
      return {
        promptNome: 'Validação de Urgência',
        precisaValidacaoUrgenciaFinal: true, // Flag especial para fluxo final
      };
    }

    // Se todas as propriedades iniciais são true (saudacao, pedidoResumo, confirmacaoResumo)
    // Executa o fluxo de Validação do Resumo e Incorporação
    if (contato.saudacao && contato.pedidoResumo && contato.confirmacaoResumo) {
      return {
        promptNome: 'Validação do Resumo e Incorporação',
        precisaValidacaoResumoIncorporacao: true, // Flag especial para fluxo complexo
      };
    }

    // Se todas as propriedades do fluxo estão true (incluindo confirmaAgendamento)
    // Executa o prompt "Atendimento Padrão" para continuar o atendimento
    if (contato.saudacao && 
        contato.pedidoResumo && 
        contato.confirmacaoResumo && 
        contato.urgenciaDefinida && 
        contato.selecionandoData && 
        contato.propostaAgendamento && 
        contato.confirmaAgendamento) {
      return {
        promptNome: 'Atendimento Padrão',
        // Não atualiza nenhuma propriedade, apenas responde
      };
    }

    // Por enquanto, retorna null para outros casos (será implementado no futuro)
    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar conversa:', error);
    return null;
  }
}

