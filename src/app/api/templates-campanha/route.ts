import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TemplateCampanha from '@/lib/models/TemplateCampanha';

/**
 * API Route para criar um novo template de campanha
 * POST /api/templates-campanha
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { titulo, texto, btn, linkBtn, varNome } = body;

    // Validações
    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O título é obrigatório',
        },
        { status: 400 }
      );
    }

    if (!texto || !texto.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'O texto é obrigatório',
        },
        { status: 400 }
      );
    }

    // Se btn for true, linkBtn deve ser fornecido
    if (btn && (!linkBtn || !linkBtn.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: 'O link do botão é obrigatório quando o botão está habilitado',
        },
        { status: 400 }
      );
    }

    // Cria o template
    const template = new TemplateCampanha({
      titulo: titulo.trim(),
      texto: texto.trim(),
      btn: btn || false,
      linkBtn: btn ? linkBtn.trim() : '',
      varNome: varNome || false,
    });

    await template.save();

    return NextResponse.json(
      {
        success: true,
        template: {
          id: template._id.toString(),
          titulo: template.titulo,
          texto: template.texto,
          btn: template.btn,
          linkBtn: template.linkBtn,
          varNome: template.varNome,
          createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Erro ao criar template de campanha:', error);
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
 * API Route para buscar todos os templates de campanha
 * GET /api/templates-campanha
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os templates, ordenados por data de criação (mais recente primeiro)
    const templates = await TemplateCampanha.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        templates: templates.map((template: any) => ({
          id: template._id.toString(),
          titulo: template.titulo,
          texto: template.texto,
          btn: template.btn || false,
          linkBtn: template.linkBtn || '',
          varNome: template.varNome || false,
          createdAt: template.createdAt
            ? new Date(template.createdAt).toISOString()
            : null,
        })),
        total: templates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar templates de campanha:', error);
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

