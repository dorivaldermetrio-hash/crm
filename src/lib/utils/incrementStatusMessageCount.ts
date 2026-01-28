/**
 * Incrementa o contador de mensagens do status do contato
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';

/**
 * Incrementa o contador de mensagens do status atual do contato
 * @param contatoId - ID do contato
 * @param status - Status do contato
 * @returns Sucesso ou erro
 */
export async function incrementStatusMessageCount(
  contatoId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // Mapeia o status para o campo correspondente no modelo
    const statusFieldMap: Record<string, string> = {
      'Novo Contato': 'numMsgNovoContato',
      'Triagem em Andamento': 'numMsgTriagemEmAndamento',
      'Triagem Jurídica Concluída': 'numMsgTriagemJuridicaConcluida',
      'Caso Urgente': 'numMsgCasoUrgente',
      'Encaminhado para Atendimento Humano': 'numMsgEncaminhadoParaAtendimentoHumano',
      'Não é caso Jurídico': 'numMsgNaoECasoJuridico',
    };

    const fieldName = statusFieldMap[status];

    if (!fieldName) {
      console.warn(`⚠️ Status desconhecido: ${status}`);
      return { success: false, error: `Status desconhecido: ${status}` };
    }

    // Incrementa o contador usando $inc do MongoDB
    await Contato.findByIdAndUpdate(contatoId, {
      $inc: { [fieldName]: 1 },
    });

    console.log(`✅ Contador ${fieldName} incrementado para contato ${contatoId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao incrementar contador de mensagens:', error);
    return { success: false, error: 'Erro ao incrementar contador' };
  }
}

