import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';
import Mensagem from '@/lib/models/Mensagem';
import MensagemDM from '@/lib/models/MensagemDM';
import Produto from '@/lib/models/Produto';

/**
 * API Route para buscar dados dos relatórios
 * GET /api/relatorios?periodo=hoje|semana|mes|todos
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const periodo = searchParams.get('periodo') || 'todos';

    // Calcula as datas baseado no período
    const agora = new Date();
    let dataInicio: Date | null = null;

    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        break;
      case 'semana':
        const diasSemana = agora.getDay();
        dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - diasSemana);
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        break;
      default:
        dataInicio = null; // Todos os dados
    }

    // 1. MÉTRICAS PRINCIPAIS
    const totalContatosWhatsApp = await Contato.countDocuments(
      dataInicio ? { createdAt: { $gte: dataInicio } } : {}
    );
    const totalContatosInstagram = await ContatoDM.countDocuments(
      dataInicio ? { createdAt: { $gte: dataInicio } } : {}
    );
    const totalContatos = totalContatosWhatsApp + totalContatosInstagram;

    // Contatos ativos (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const contatosAtivosWhatsApp = await Contato.countDocuments({
      dataUltimaMensagem: { $gte: seteDiasAtras },
    });
    const contatosAtivosInstagram = await ContatoDM.countDocuments({
      dataUltimaMensagem: { $gte: seteDiasAtras },
    });
    const contatosAtivos = contatosAtivosWhatsApp + contatosAtivosInstagram;

    // Total de mensagens (WhatsApp + Instagram)
    const todasMensagensWhatsApp = await Mensagem.find({}).lean();
    const todasMensagensInstagram = await MensagemDM.find({}).lean();
    let totalMensagensRecebidas = 0;
    let totalMensagensEnviadas = 0;

    [...todasMensagensWhatsApp, ...todasMensagensInstagram].forEach((msg: any) => {
      if (msg.mensagens && Array.isArray(msg.mensagens)) {
        msg.mensagens.forEach((m: any) => {
          if (dataInicio && new Date(m.dataHora) < dataInicio) return;
          
          if (m.contatoID === '1') {
            totalMensagensEnviadas++;
          } else {
            totalMensagensRecebidas++;
          }
        });
      }
    });

    // 2. FUNIL DE VENDAS
    const contatosWhatsApp = await Contato.find({}).lean();
    const contatosInstagram = await ContatoDM.find({}).lean();

    const funilStatus: Record<string, number> = {
      'Novo Contato': 0,
      'Triagem em Andamento': 0,
      'Triagem Jurídica Concluída': 0,
      'Caso Urgente': 0,
      'Encaminhado para Atendimento Humano': 0,
      'Não é caso Jurídico': 0,
    };

    [...contatosWhatsApp, ...contatosInstagram].forEach((contato: any) => {
      const status = contato.status || 'Novo Contato';
      if (funilStatus.hasOwnProperty(status)) {
        funilStatus[status]++;
      }
    });

    // Taxa de conversão (Encaminhado para Atendimento Humano)
    const totalEncaminhado = funilStatus['Encaminhado para Atendimento Humano'];
    const taxaConversao = totalContatos > 0 ? (totalEncaminhado / totalContatos) * 100 : 0;

    // 3. MENSAGENS POR STATUS
    const mensagensPorStatus = {
      'Novo Contato': 0,
      'Triagem em Andamento': 0,
      'Triagem Jurídica Concluída': 0,
      'Caso Urgente': 0,
      'Encaminhado para Atendimento Humano': 0,
      'Não é caso Jurídico': 0,
    };

    // Contagem de mensagens por status removida - campos numMsg* não existem mais
    // Os valores permanecem em 0

    // 4. ANÁLISE DE PRODUTOS
    const produtos = await Produto.find({ ativado: 'sim' }).lean();
    const interesseProdutos: Record<string, number> = {};

    [...contatosWhatsApp, ...contatosInstagram].forEach((contato: any) => {
      const produto = contato.produtoInteresse || 'DESCONHECIDO';
      interesseProdutos[produto] = (interesseProdutos[produto] || 0) + 1;
    });

    // Top 10 produtos
    const topProdutos = Object.entries(interesseProdutos)
      .filter(([nome]) => nome !== 'DESCONHECIDO')
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([nome, count]) => ({
        nome,
        contatos: count as number,
      }));

    // 5. MENSAGENS AO LONGO DO TEMPO (últimos 30 dias)
    const mensagensTemporal: Record<string, { recebidas: number; enviadas: number }> = {};
    const hoje = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      mensagensTemporal[dataStr] = { recebidas: 0, enviadas: 0 };
    }

    [...todasMensagensWhatsApp, ...todasMensagensInstagram].forEach((msg: any) => {
      if (msg.mensagens && Array.isArray(msg.mensagens)) {
        msg.mensagens.forEach((m: any) => {
          const dataMsg = new Date(m.dataHora);
          const dataStr = dataMsg.toISOString().split('T')[0];
          
          if (mensagensTemporal[dataStr]) {
            if (m.contatoID === '1') {
              mensagensTemporal[dataStr].enviadas++;
            } else {
              mensagensTemporal[dataStr].recebidas++;
            }
          }
        });
      }
    });

    // 6. DISTRIBUIÇÃO POR TAGS
    const tagsDistribuicao: Record<string, number> = {};
    [...contatosWhatsApp, ...contatosInstagram].forEach((contato: any) => {
      if (contato.tags && Array.isArray(contato.tags)) {
        contato.tags.forEach((tag: string) => {
          tagsDistribuicao[tag] = (tagsDistribuicao[tag] || 0) + 1;
        });
      }
    });

    // 7. CONTATOS POR CANAL
    const contatosPorCanal = {
      WhatsApp: totalContatosWhatsApp,
      Instagram: totalContatosInstagram,
    };

    // 8. TAXA DE CONVERSÃO POR ETAPA
    const conversaoPorEtapa = {
      novoContatoParaTriagem: funilStatus['Novo Contato'] > 0 
        ? (funilStatus['Triagem em Andamento'] / funilStatus['Novo Contato']) * 100 
        : 0,
      triagemParaTriagemJuridica: funilStatus['Triagem em Andamento'] > 0 
        ? (funilStatus['Triagem Jurídica Concluída'] / funilStatus['Triagem em Andamento']) * 100 
        : 0,
      triagemJuridicaParaUrgente: funilStatus['Triagem Jurídica Concluída'] > 0 
        ? (funilStatus['Caso Urgente'] / funilStatus['Triagem Jurídica Concluída']) * 100 
        : 0,
      urgenteParaEncaminhado: funilStatus['Caso Urgente'] > 0 
        ? (funilStatus['Encaminhado para Atendimento Humano'] / funilStatus['Caso Urgente']) * 100 
        : 0,
    };

    return NextResponse.json(
      {
        success: true,
        periodo,
        metricas: {
          totalContatos,
          totalContatosWhatsApp,
          totalContatosInstagram,
          contatosAtivos,
          totalMensagensRecebidas,
          totalMensagensEnviadas,
          taxaConversao: parseFloat(taxaConversao.toFixed(2)),
        },
        funil: {
          distribuicao: funilStatus,
          conversaoPorEtapa,
        },
        mensagens: {
          porStatus: mensagensPorStatus,
          temporal: Object.entries(mensagensTemporal).map(([data, valores]) => ({
            data,
            recebidas: valores.recebidas,
            enviadas: valores.enviadas,
          })),
        },
        produtos: {
          topProdutos,
          desconhecidos: interesseProdutos.DESCONHECIDO || 0,
        },
        tags: tagsDistribuicao,
        canais: contatosPorCanal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

