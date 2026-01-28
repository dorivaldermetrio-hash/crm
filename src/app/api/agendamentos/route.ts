import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Agendamento from '@/lib/models/Agendamento';

/**
 * API Route para gerenciar agendamentos
 * GET /api/agendamentos - Busca todos os agendamentos
 * POST /api/agendamentos - Cria um novo agendamento
 */
export async function GET() {
  try {
    await connectDB();

    const agendamentos = await Agendamento.find().sort({ data: 1, horarioInicio: 1 }).lean();

    return NextResponse.json(
      {
        success: true,
        agendamentos,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validação dos campos obrigatórios
    if (!body.nome || !body.data || !body.horarioInicio || !body.duracao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: nome, data, horarioInicio, duracao',
        },
        { status: 400 }
      );
    }

    // Cria o agendamento
    const agendamento = await Agendamento.create({
      nome: body.nome,
      notas: body.notas || '',
      data: body.data,
      horarioInicio: body.horarioInicio,
      duracao: body.duracao,
      status: body.status || 'agendado',
    });

    console.log('✅ Agendamento criado:', {
      id: agendamento._id.toString(),
      nome: agendamento.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Agendamento criado com sucesso',
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
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar agendamento:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

