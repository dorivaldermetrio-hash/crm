import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';

/**
 * API Route para criar um novo contato
 * POST /api/contatos
 * Body: { contato: string, contatoNome?: string, status?: string, tags?: string[], nota?: string, favorito?: boolean, arquivar?: boolean, produtoInteresse?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validações
    if (!body.contato || typeof body.contato !== 'string' || body.contato.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Número de contato é obrigatório',
        },
        { status: 400 }
      );
    }

    // Remove formatação e garante que começa com 55
    let numeroLimpo = body.contato.replace(/\D/g, '');
    if (!numeroLimpo.startsWith('55')) {
      numeroLimpo = `55${numeroLimpo}`;
    }

    // Valida o tamanho do número (55 + DDD + número = mínimo 12, máximo 13 dígitos)
    if (numeroLimpo.length < 12 || numeroLimpo.length > 13) {
      return NextResponse.json(
        {
          success: false,
          error: 'Número de telefone inválido. Deve ter DDD + 8 ou 9 dígitos',
        },
        { status: 400 }
      );
    }

    // Valida status se fornecido
    if (body.status && !['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status inválido',
        },
        { status: 400 }
      );
    }

    // Valida tags se fornecidas
    const validTags = ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto'];
    if (body.tags && Array.isArray(body.tags)) {
      const invalidTags = body.tags.filter((tag: string) => !validTags.includes(tag));
      if (invalidTags.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Tags inválidas: ${invalidTags.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Verifica se o contato já existe
    const contatoExistente = await Contato.findOne({ contato: numeroLimpo });
    if (contatoExistente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato com este número já existe',
        },
        { status: 400 }
      );
    }

    // Cria o novo contato
    const novoContato = new Contato({
      contato: numeroLimpo,
      contatoNome: body.contatoNome?.trim() || '',
      status: body.status || 'Novo Contato',
      tags: body.tags || [],
      nota: body.nota || '',
      favorito: body.favorito || false,
      arquivar: body.arquivar || false,
      produtoInteresse: body.produtoInteresse?.trim() || '',
      informacoesCaso: body.informacoesCaso?.trim() || '',
      inicialConcluido: body.inicialConcluido || false,
    });

    const contatoSalvo = await novoContato.save();

    console.log('✅ Contato criado:', {
      id: contatoSalvo._id.toString(),
      contato: contatoSalvo.contato,
      contatoNome: contatoSalvo.contatoNome,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Contato criado com sucesso',
        contato: {
          id: contatoSalvo._id.toString(),
          contato: contatoSalvo.contato,
          contatoNome: contatoSalvo.contatoNome || '',
          status: contatoSalvo.status ?? 'Novo Contato',
          tags: Array.isArray(contatoSalvo.tags) ? contatoSalvo.tags : [],
          nota: contatoSalvo.nota ?? '',
          favorito: contatoSalvo.favorito ?? false,
          arquivar: contatoSalvo.arquivar ?? false,
          produtoInteresse: contatoSalvo.produtoInteresse ?? '',
          informacoesCaso: contatoSalvo.informacoesCaso ?? '',
          inicialConcluido: contatoSalvo.inicialConcluido ?? false,
          createdAt: contatoSalvo.createdAt
            ? new Date(contatoSalvo.createdAt).toISOString()
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao criar contato:', error);
    
    // Erro de duplicação
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato com este número já existe',
        },
        { status: 400 }
      );
    }

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
 * API Route para buscar todos os contatos
 * GET /api/contatos
 */
export async function GET() {
  try {
    await connectDB();

    // Busca todos os contatos, ordenados por data da última mensagem (mais recente primeiro)
    const contatos = await Contato.find({})
      .sort({ dataUltimaMensagem: -1, createdAt: -1 })
      .select('contato contatoNome ultimaMensagem dataUltimaMensagem status tags nota favorito arquivar produtoInteresse informacoesCaso inicialConcluido createdAt')
      .lean();

    return NextResponse.json(
      {
        success: true,
        contatos: contatos.map((contato: any) => ({
          id: contato._id.toString(),
          contato: contato.contato,
          contatoNome: contato.contatoNome || '',
          ultimaMensagem: contato.ultimaMensagem || '',
          dataUltimaMensagem: contato.dataUltimaMensagem
            ? new Date(contato.dataUltimaMensagem).toISOString()
            : null,
          status: contato.status ?? 'Novo Contato', // Usa ?? para preservar null/undefined
          tags: Array.isArray(contato.tags) ? contato.tags : [],
          nota: contato.nota ?? '',
          favorito: contato.favorito ?? false,
          arquivar: contato.arquivar ?? false,
          produtoInteresse: contato.produtoInteresse ?? '',
          informacoesCaso: contato.informacoesCaso ?? '',
          inicialConcluido: contato.inicialConcluido ?? false,
          createdAt: contato.createdAt
            ? new Date(contato.createdAt).toISOString()
            : null,
        })),
        total: contatos.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar contatos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        contatos: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

