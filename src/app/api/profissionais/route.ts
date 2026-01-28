import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Profissional from '@/lib/models/Profissional';

/**
 * API Route para gerenciar profissionais
 * GET /api/profissionais - Lista todos os profissionais
 * POST /api/profissionais - Cria um novo profissional
 */
export async function GET() {
  try {
    await connectDB();

    const profissionais = await Profissional.find({})
      .sort({ nome: 1 })
      .lean();

    // Converte Map para objeto simples
    const profissionaisFormatados = profissionais.map((prof: any) => ({
      id: prof._id.toString(),
      nome: prof.nome,
      areas_atuacao: prof.areas_atuacao || [],
      mensagem_autoridade: prof.mensagem_autoridade || {},
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      profissionais: profissionaisFormatados,
    });
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar profissionais',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validações
    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome do profissional é obrigatório',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.areas_atuacao)) {
      return NextResponse.json(
        {
          success: false,
          error: 'areas_atuacao deve ser um array',
        },
        { status: 400 }
      );
    }

    if (body.mensagem_autoridade && typeof body.mensagem_autoridade !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'mensagem_autoridade deve ser um objeto',
        },
        { status: 400 }
      );
    }

    // Cria o profissional
    const novoProfissional = new Profissional({
      nome: body.nome.trim(),
      areas_atuacao: body.areas_atuacao || [],
      mensagem_autoridade: body.mensagem_autoridade || {},
    });

    const profissionalSalvo = await novoProfissional.save();

    console.log('✅ Profissional criado:', {
      id: profissionalSalvo._id.toString(),
      nome: profissionalSalvo.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profissional criado com sucesso',
        profissional: {
          id: profissionalSalvo._id.toString(),
          nome: profissionalSalvo.nome,
          areas_atuacao: profissionalSalvo.areas_atuacao,
          mensagem_autoridade: profissionalSalvo.mensagem_autoridade || {},
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erro ao criar profissional:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

