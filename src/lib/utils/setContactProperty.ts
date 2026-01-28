/**
 * Define uma propriedade do contato para um valor específico (true ou false)
 */

import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * Define uma propriedade do contato para um valor específico
 * @param contatoId - ID do contato
 * @param propriedade - Nome da propriedade a ser atualizada
 * @param valor - Valor a ser definido (true ou false)
 * @param isInstagram - Se true, atualiza no ContatoDM, senão no Contato
 * @returns Sucesso ou erro
 */
export async function setContactProperty(
  contatoId: string,
  propriedade: 'saudacao' | 'pedidoResumo' | 'confirmacaoResumo' | 'urgenciaDefinida' | 'selecionandoData' | 'propostaAgendamento' | 'confirmaAgendamento',
  valor: boolean,
  isInstagram: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();

    // Atualiza o contato (WhatsApp ou Instagram)
    if (isInstagram) {
      await ContatoDM.findByIdAndUpdate(contatoId, {
        $set: { [propriedade]: valor },
      });
    } else {
      await Contato.findByIdAndUpdate(contatoId, {
        $set: { [propriedade]: valor },
      });
    }

    console.log(`✅ Propriedade ${propriedade} atualizada para ${valor} no contato ${contatoId}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro ao atualizar propriedade ${propriedade}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

