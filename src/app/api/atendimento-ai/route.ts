import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AtendimentoAI from '@/lib/models/AtendimentoAI';

/**
 * API Route para buscar todas as configurações de atendimento AI
 * GET /api/atendimento-ai
 * Retorna todos os documentos da coleção
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os documentos
    const atendimentosAI = await AtendimentoAI.find().lean();

    // Converte para um objeto indexado por nome para facilitar o uso no frontend
    const data: Record<string, { prompt: string; numMaxMsg: number }> = {};
    
    atendimentosAI.forEach((item: any) => {
      data[item.nome] = {
        prompt: item.prompt || '',
        numMaxMsg: item.numMaxMsg || 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao buscar atendimento AI:', error);
    
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
 * API Route para salvar/atualizar uma configuração de atendimento AI
 * PUT /api/atendimento-ai
 * Body: { nome: string, prompt: string, numMaxMsg: number }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.nome) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campo "nome" é obrigatório',
        },
        { status: 400 }
      );
    }

    // Busca documento existente pelo nome
    let atendimentoAI = await AtendimentoAI.findOne({ nome: body.nome });

    if (!atendimentoAI) {
      // Cria novo documento se não existir
      atendimentoAI = new AtendimentoAI({
        nome: body.nome,
        prompt: body.prompt || '',
        numMaxMsg: body.numMaxMsg || 0,
      });
    } else {
      // Atualiza documento existente
      atendimentoAI.prompt = body.prompt !== undefined ? body.prompt : atendimentoAI.prompt;
      atendimentoAI.numMaxMsg = body.numMaxMsg !== undefined ? body.numMaxMsg : atendimentoAI.numMaxMsg;
    }

    await atendimentoAI.save();

    console.log('✅ Atendimento AI salvo/atualizado:', {
      nome: atendimentoAI.nome,
      id: atendimentoAI._id.toString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Configuração salva com sucesso',
        data: {
          nome: atendimentoAI.nome,
          prompt: atendimentoAI.prompt || '',
          numMaxMsg: atendimentoAI.numMaxMsg || 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao salvar atendimento AI:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

