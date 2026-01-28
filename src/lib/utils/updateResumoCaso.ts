/**
 * Atualiza o resumoCaso de um contato
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Atualiza o resumoCaso de um contato
 * @param contatoId - ID do contato
 * @param resumoCaso - Texto do resumo do caso
 * @param isInstagram - Se true, atualiza no ContatoDM, senão no Contato
 * @returns Sucesso ou erro
 */
export async function updateResumoCaso(
  contatoId: string,
  resumoCaso: string,
  isInstagram: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // Atualiza o contato (WhatsApp ou Instagram) e retorna o documento atualizado
    let contatoAtualizado;
    if (isInstagram) {
      contatoAtualizado = await ContatoDM.findByIdAndUpdate(
        contatoId,
        { $set: { resumoCaso: resumoCaso.trim() } },
        { new: true } // Retorna o documento atualizado
      );
    } else {
      contatoAtualizado = await Contato.findByIdAndUpdate(
        contatoId,
        { $set: { resumoCaso: resumoCaso.trim() } },
        { new: true } // Retorna o documento atualizado
      );
    }

    if (!contatoAtualizado) {
      throw new Error('Contato não encontrado após atualização');
    }

    console.log(`✅ resumoCaso atualizado para o contato ${contatoId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro ao atualizar resumoCaso:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

