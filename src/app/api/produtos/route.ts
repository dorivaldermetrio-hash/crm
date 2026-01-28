import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Produto from '@/lib/models/Produto';

/**
 * API Route para criar um novo produto
 * POST /api/produtos
 * Body: { nome: string, descBreve?: string, descCompleta?: string, ativado?: string, valor?: string, duracao?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validações
    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome do produto é obrigatório',
        },
        { status: 400 }
      );
    }

    // Cria o novo produto
    const novoProduto = new Produto({
      nome: body.nome.trim(),
      descBreve: body.descBreve?.trim() || '',
      descCompleta: body.descCompleta?.trim() || '',
      ativado: body.ativado?.trim() || 'sim',
      valor: body.valor?.trim() || '',
      duracao: body.duracao?.trim() || '',
    });

    const produtoSalvo = await novoProduto.save();

    console.log('✅ Produto criado:', {
      id: produtoSalvo._id.toString(),
      nome: produtoSalvo.nome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Produto criado com sucesso',
        produto: {
          id: produtoSalvo._id.toString(),
          nome: produtoSalvo.nome,
          descBreve: produtoSalvo.descBreve || '',
          descCompleta: produtoSalvo.descCompleta || '',
          ativado: produtoSalvo.ativado || 'sim',
          valor: produtoSalvo.valor || '',
          duracao: produtoSalvo.duracao || '',
          createdAt: produtoSalvo.createdAt
            ? new Date(produtoSalvo.createdAt).toISOString()
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar produto:', error);

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
 * API Route para buscar todos os produtos
 * GET /api/produtos
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os produtos, ordenados por data de criação (mais recente primeiro)
    const produtos = await Produto.find({})
      .sort({ createdAt: -1 })
      .select('nome descBreve descCompleta ativado valor duracao createdAt')
      .lean();

    return NextResponse.json(
      {
        success: true,
        produtos: produtos.map((produto: any) => ({
          id: produto._id.toString(),
          nome: produto.nome || '',
          descBreve: produto.descBreve || '',
          descCompleta: produto.descCompleta || '',
          ativado: produto.ativado || 'sim',
          valor: produto.valor || '',
          duracao: produto.duracao || '',
          createdAt: produto.createdAt
            ? new Date(produto.createdAt).toISOString()
            : null,
        })),
        total: produtos.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        produtos: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

