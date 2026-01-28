import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ContatoDM from '@/lib/models/ContatoDM';

/**
 * API Route para buscar contatos do Instagram DM
 * GET /api/contatos-instagram
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os contatos do Instagram DM
    const contatos = await ContatoDM.find({})
      .sort({ dataUltimaMensagem: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      contatos: contatos.map((contato) => ({
        id: contato._id.toString(),
        contato: contato.contato,
        contatoNome: contato.contatoNome,
        ultimaMensagem: contato.ultimaMensagem,
        dataUltimaMensagem: contato.dataUltimaMensagem,
        status: contato.status,
        tags: contato.tags,
        nota: contato.nota,
        favorito: contato.favorito,
        arquivar: contato.arquivar,
        produtoInteresse: contato.produtoInteresse,
        informacoesCaso: contato.informacoesCaso ?? '',
        inicialConcluido: contato.inicialConcluido ?? false,
        createdAt: contato.createdAt,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar contatos do Instagram:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar contatos do Instagram',
      },
      { status: 500 }
    );
  }
}

