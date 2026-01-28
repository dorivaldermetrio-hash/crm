import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TemplateWS from '@/lib/models/TemplateWS';

/**
 * API Route para criar um novo template WhatsApp
 * POST /api/templates-ws
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { nome, conteudo } = body;

    // Validações
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O nome do template é obrigatório',
        },
        { status: 400 }
      );
    }

    if (!conteudo || !conteudo.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O conteúdo do template é obrigatório',
        },
        { status: 400 }
      );
    }

    // Cria o template
    const template = new TemplateWS({
      nome: nome.trim(),
      conteudo: conteudo.trim(),
    });

    await template.save();

    return NextResponse.json(
      {
        success: true,
        template: {
          id: template._id.toString(),
          nome: template.nome,
          conteudo: template.conteudo,
          createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erro ao criar template WhatsApp:', error);
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
 * API Route para buscar todos os templates WhatsApp
 * GET /api/templates-ws
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os templates, ordenados por data de criação (mais recente primeiro)
    const templates = await TemplateWS.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        templates: templates.map((template: any) => ({
          id: template._id.toString(),
          nome: template.nome,
          conteudo: template.conteudo,
          createdAt: template.createdAt
            ? new Date(template.createdAt).toISOString()
            : null,
        })),
        total: templates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar templates WhatsApp:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        templates: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

