import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agendamento from '@/lib/models/Agendamento';

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

