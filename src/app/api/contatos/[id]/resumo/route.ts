import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import Mensagem from '@/lib/models/Mensagem';
import mongoose from 'mongoose';
import { generateOllamaResponse } from '@/lib/utils/ollama';
import { getOllamaModel } from '@/lib/config/ollama';

/**
 * API Route para gerar resumo da conversa usando IA
 * POST /api/contatos/[id]/resumo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const contatoId = id;

    // Valida se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(contatoId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de contato inválido',
        },
        { status: 400 }
      );
    }

    // Busca o contato
    const contato = await Contato.findById(contatoId).lean();

    if (!contato) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contato não encontrado',
        },
        { status: 404 }
      );
    }

    // Busca todas as mensagens do contato
    const mensagemDoc = await Mensagem.findOne({ contatoID: contatoId }).lean();

    if (!mensagemDoc || !mensagemDoc.mensagens || mensagemDoc.mensagens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma mensagem encontrada para este contato',
        },
        { status: 404 }
      );
    }

    // Ordena mensagens por data (mais antiga primeiro)
    const mensagens = [...mensagemDoc.mensagens];
    mensagens.sort((a: any, b: any) => {
      const dateA = new Date(a.dataHora).getTime();
      const dateB = new Date(b.dataHora).getTime();
      return dateA - dateB;
    });

    // Filtra apenas mensagens de texto com conteúdo
    const mensagensTexto = mensagens.filter((msg: any) => {
      return msg.tipo === 'texto' && msg.mensagem && msg.mensagem.trim() !== '';
    });

    if (mensagensTexto.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma mensagem de texto encontrada',
        },
        { status: 404 }
      );
    }

    // Formata o histórico completo da conversa
    const historicoFormatado = mensagensTexto.map((msg: any) => {
      const role = msg.contatoID === '1' ? 'Assistente' : 'Cliente';
      const dataHora = new Date(msg.dataHora).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${dataHora}] ${role}: ${msg.mensagem.trim()}`;
    }).join('\n');

    // Cria o prompt para gerar o resumo
    const prompt = `Você é um assistente especializado em análise de conversas. Sua tarefa é criar um resumo completo e objetivo de uma conversa entre um cliente e um assistente virtual.

INSTRUÇÕES:
- Analise toda a conversa abaixo
- Identifique os principais pontos discutidos
- Destaque informações importantes como: problemas relatados, necessidades do cliente, soluções oferecidas, acordos ou próximos passos
- Seja objetivo e direto
- Use parágrafos curtos para melhor legibilidade
- Não invente informações que não estão na conversa
- Se a conversa for muito curta, faça um resumo breve mas completo

CONVERSA COMPLETA:
${historicoFormatado}

Gere um resumo completo e profissional desta conversa:`;

    // Gera o resumo usando Ollama
    const resumo = await generateOllamaResponse(
      prompt,
      [], // Sem histórico de conversa prévio
      getOllamaModel()
    );

    return NextResponse.json(
      {
        success: true,
        resumo: resumo.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao gerar resumo da conversa:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar resumo',
      },
      { status: 500 }
    );
  }
}
