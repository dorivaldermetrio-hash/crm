  /**
 * Utilitário para atualizar o campo produtoInteresse de um contato do Instagram DM
 */

import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Atualiza o campo produtoInteresse de um contato do Instagram DM
 */
export async function updateProductInterestInstagram(
  contatoId: string,
  produtoInteresse: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const contato = await ContatoDM.findById(contatoId);

    if (!contato) {
      return {
        success: false,
        error: 'Contato não encontrado',
      };
    }

    // Atualiza o campo produtoInteresse
    contato.produtoInteresse = produtoInteresse.trim();
    await contato.save();

    console.log(`✅ ProdutoInteresse atualizado para contato Instagram ${contatoId}: ${produtoInteresse}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar produtoInteresse do Instagram:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

