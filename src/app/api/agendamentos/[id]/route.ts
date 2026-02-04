import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agendamento from '@/lib/models/Agendamento';
import { atualizarEventoNoGoogleCalendar, deletarEventoNoGoogleCalendar } from '@/lib/google-calendar/sync';
import { isGoogleCalendarConnected } from '@/lib/google-calendar/client';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para atualizar um agendamento específico
 * PUT /api/agendamentos/[id] - Atualiza um agendamento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Busca o agendamento
    const agendamento = await Agendamento.findById(id);

    if (!agendamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    // Atualiza os campos fornecidos
    if (body.nome !== undefined) agendamento.nome = body.nome;
    if (body.notas !== undefined) agendamento.notas = body.notas;
    if (body.data !== undefined) agendamento.data = body.data;
    if (body.horarioInicio !== undefined) agendamento.horarioInicio = body.horarioInicio;
    if (body.duracao !== undefined) agendamento.duracao = body.duracao;
    if (body.status !== undefined) agendamento.status = body.status;

    await agendamento.save();

    console.log('✅ Agendamento atualizado:', {
      id: agendamento._id.toString(),
      status: agendamento.status,
    });

    // Sincroniza com Google Calendar se estiver conectado e tiver googleEventId
    const userId = await getUserId(request);
    const googleCalendarConnected = await isGoogleCalendarConnected(userId);
    
    if (googleCalendarConnected && agendamento.googleEventId) {
      try {
        await atualizarEventoNoGoogleCalendar(agendamento.googleEventId, agendamento, userId);
        console.log('✅ Agendamento atualizado no Google Calendar');
      } catch (error) {
        console.error('⚠️ Erro ao atualizar no Google Calendar (agendamento foi atualizado localmente):', error);
        // Não falha a atualização do agendamento se a sincronização falhar
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Agendamento atualizado com sucesso',
        agendamento: {
          id: agendamento._id.toString(),
          nome: agendamento.nome,
          notas: agendamento.notas,
          data: agendamento.data,
          horarioInicio: agendamento.horarioInicio,
          duracao: agendamento.duracao,
          status: agendamento.status,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para buscar um agendamento específico
 * GET /api/agendamentos/[id] - Busca um agendamento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const agendamento = await Agendamento.findById(id).lean();

    if (!agendamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        agendamento,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao buscar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para deletar um agendamento específico
 * DELETE /api/agendamentos/[id] - Deleta um agendamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Busca o agendamento antes de deletar
    const agendamento = await Agendamento.findById(id);

    if (!agendamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agendamento não encontrado',
        },
        { status: 404 }
      );
    }

    // Sincroniza com Google Calendar se estiver conectado e tiver googleEventId
    const userId = await getUserId(request);
    const googleCalendarConnected = await isGoogleCalendarConnected(userId);
    
    if (googleCalendarConnected && agendamento.googleEventId) {
      try {
        await deletarEventoNoGoogleCalendar(agendamento.googleEventId, userId);
        console.log('✅ Evento deletado no Google Calendar');
      } catch (error) {
        console.error('⚠️ Erro ao deletar no Google Calendar (agendamento será deletado localmente):', error);
        // Não falha a deleção do agendamento se a sincronização falhar
      }
    }

    // Deleta o agendamento
    await Agendamento.findByIdAndDelete(id);

    console.log('✅ Agendamento deletado:', {
      id: id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Agendamento deletado com sucesso',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao deletar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
