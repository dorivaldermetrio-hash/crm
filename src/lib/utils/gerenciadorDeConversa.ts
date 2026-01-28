/**
 * Gerencia o estado da conversa, atualizando propriedades do contato após enviar mensagem
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Atualiza uma propriedade do contato após enviar uma mensagem
 * @param contatoId - ID do contato
 * @param propriedade - Nome da propriedade a ser atualizada
 * @param isInstagram - Se true, atualiza no ContatoDM, senão no Contato
 * @returns Sucesso ou erro
 */
export async function gerenciadorDeConversa(
  contatoId: string,
  propriedade: 'saudacao' | 'pedidoResumo' | 'confirmacaoResumo' | 'urgenciaDefinida',
  isInstagram: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // Atualiza o contato (WhatsApp ou Instagram)
    if (isInstagram) {
      await ContatoDM.findByIdAndUpdate(contatoId, {
        $set: { [propriedade]: true },
      });
    } else {
      await Contato.findByIdAndUpdate(contatoId, {
        $set: { [propriedade]: true },
      });
    }

    console.log(`✅ Propriedade ${propriedade} atualizada para true no contato ${contatoId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro ao atualizar propriedade ${propriedade}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

