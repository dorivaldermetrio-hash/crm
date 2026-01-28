import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';
import mongoose from 'mongoose';

interface UpdateContactStatusInstagramParams {
  contatoId: string;
  status: string;
}

const VALID_STATUSES = ['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'];

/**
 * Atualiza o status de um contato do Instagram DM
 */
export async function updateContactStatusInstagram({
  contatoId,
  status,
}: UpdateContactStatusInstagramParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Valida o ID do contato
    if (!mongoose.Types.ObjectId.isValid(contatoId)) {
      return {
        success: false,
        error: 'ID de contato inválido',
      };
    }

    // Se o status estiver vazio, não atualiza
    if (!status || status.trim() === '') {
      return {
        success: true,
      };
    }

    // Valida se o status é válido
    const statusTrimmed = status.trim();
    if (!VALID_STATUSES.includes(statusTrimmed)) {
      return {
        success: false,
        error: `Status inválido: ${statusTrimmed}. Valores válidos: ${VALID_STATUSES.join(', ')}`,
      };
    }

    // Conecta ao banco
    await connectDB();

    // Atualiza o status do contato
    const contatoAtualizado = await ContatoDM.findByIdAndUpdate(
      contatoId,
      { $set: { status: statusTrimmed } },
      { new: true, runValidators: true }
    );

    if (!contatoAtualizado) {
      return {
        success: false,
        error: 'Contato não encontrado',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar status do contato',
    };
  }
}

