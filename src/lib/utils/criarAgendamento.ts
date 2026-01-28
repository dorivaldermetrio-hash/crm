/**
 * Cria um agendamento na agenda
 */

import connectDB from '@/lib/db';
import Agendamento from '@/lib/models/Agendamento';

interface CriarAgendamentoParams {
  nome: string;
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:MM
  duracao: string; // HH:MM
  notas: string;
  status?: string;
}

/**
 * Cria um agendamento na agenda
 * @param params - Parâmetros do agendamento
 * @returns Sucesso ou erro
 */
export async function criarAgendamento(
  params: CriarAgendamentoParams
): Promise<{ success: boolean; agendamentoId?: string; error?: string }> {
  try {
    await connectDB();

    const agendamento = await Agendamento.create({
      nome: params.nome,
      notas: params.notas || '',
      data: params.data,
      horarioInicio: params.horarioInicio,
      duracao: params.duracao,
      status: params.status || 'agendado',
    });

    console.log('✅ Agendamento criado:', {
      id: agendamento._id.toString(),
      nome: agendamento.nome,
      data: agendamento.data,
      horarioInicio: agendamento.horarioInicio,
    });

    return {
      success: true,
      agendamentoId: agendamento._id.toString(),
    };
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

