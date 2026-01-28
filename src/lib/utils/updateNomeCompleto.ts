/**
 * Atualiza o nomeCompleto do contato
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Atualiza o nomeCompleto do contato
 * @param contatoId - ID do contato
 * @param nomeCompleto - Nome completo a ser salvo
 * @param isInstagram - Se true, atualiza no ContatoDM, senão no Contato
 * @returns Sucesso ou erro
 */
export async function updateNomeCompleto(
  contatoId: string,
  nomeCompleto: string,
  isInstagram: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // Atualiza o contato (WhatsApp ou Instagram)
    if (isInstagram) {
      await ContatoDM.findByIdAndUpdate(contatoId, {
        $set: { nomeCompleto: nomeCompleto.trim() },
      });
    } else {
      await Contato.findByIdAndUpdate(contatoId, {
        $set: { nomeCompleto: nomeCompleto.trim() },
      });
    }

    console.log(`✅ nomeCompleto atualizado para "${nomeCompleto.trim()}" no contato ${contatoId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar nomeCompleto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

