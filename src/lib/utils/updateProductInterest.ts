/**
 * Utilitário para atualizar o campo produtoInteresse de um contato
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';

/**
 * Atualiza o campo produtoInteresse de um contato
 * Se o campo não existir, será criado
 * @param contatoId - ID do contato
 * @param produtoInteresse - Nome do produto ou 'DESCONHECIDO' ou ''
 */
export async function updateProductInterest(
  contatoId: string,
  produtoInteresse: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    const contato = await Contato.findById(contatoId);

    if (!contato) {
      return {
        success: false,
        error: 'Contato não encontrado',
      };
    }

    // Atualiza o campo produtoInteresse
    contato.produtoInteresse = produtoInteresse.trim();
    await contato.save();

    console.log(`✅ ProdutoInteresse atualizado para contato ${contatoId}: ${produtoInteresse}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar produtoInteresse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

