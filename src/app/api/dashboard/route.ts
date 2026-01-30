import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contato from '@/lib/models/Contato';
import ContatoDM from '@/lib/models/ContatoDM';
import Mensagem from '@/lib/models/Mensagem';
import MensagemDM from '@/lib/models/MensagemDM';

/**
 * API Route para buscar dados do dashboard
 * GET /api/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const seteDiasAtras = new Date(agora);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const ontem = new Date(inicioHoje);
    ontem.setDate(ontem.getDate() - 1);

    // 1. MÉTRICAS RÁPIDAS
    const totalContatos = await Contato.countDocuments({});
    const totalContatosInstagram = await ContatoDM.countDocuments({});
    const totalContatosGeral = totalContatos + totalContatosInstagram;

    // Contatos ativos (últimos 7 dias)
    const contatosAtivosWhatsApp = await Contato.countDocuments({
      dataUltimaMensagem: { $gte: seteDiasAtras },
    });
    const contatosAtivosInstagram = await ContatoDM.countDocuments({
      dataUltimaMensagem: { $gte: seteDiasAtras },
    });
    const contatosAtivos = contatosAtivosWhatsApp + contatosAtivosInstagram;

    // Mensagens hoje
    const todasMensagensWhatsApp = await Mensagem.find({}).lean();
    const todasMensagensInstagram = await MensagemDM.find({}).lean();
    
    let mensagensHojeRecebidas = 0;
    let mensagensHojeEnviadas = 0;
    let mensagensOntemRecebidas = 0;
    let mensagensOntemEnviadas = 0;

    [...todasMensagensWhatsApp, ...todasMensagensInstagram].forEach((msg: any) => {
      if (msg.mensagens && Array.isArray(msg.mensagens)) {
        msg.mensagens.forEach((m: any) => {
          const dataMsg = new Date(m.dataHora);
          const isHoje = dataMsg >= inicioHoje;
          const isOntem = dataMsg >= ontem && dataMsg < inicioHoje;
          
          if (m.contatoID === '1') {
            if (isHoje) mensagensHojeEnviadas++;
            if (isOntem) mensagensOntemEnviadas++;
          } else {
            if (isHoje) mensagensHojeRecebidas++;
            if (isOntem) mensagensOntemRecebidas++;
          }
        });
      }
    });

    const totalMensagensHoje = mensagensHojeRecebidas + mensagensHojeEnviadas;
    const totalMensagensOntem = mensagensOntemRecebidas + mensagensOntemEnviadas;
    const variacaoMensagens = totalMensagensOntem > 0 
      ? ((totalMensagensHoje - totalMensagensOntem) / totalMensagensOntem) * 100 
      : 0;

    // Oportunidades quentes (Caso Urgente + Encaminhado para Atendimento Humano)
    const oportunidadesQuentes = await Contato.countDocuments({
      status: { $in: ['Caso Urgente', 'Encaminhado para Atendimento Humano'] },
    });
    const oportunidadesQuentesInstagram = await ContatoDM.countDocuments({
      status: { $in: ['Caso Urgente', 'Encaminhado para Atendimento Humano'] },
    });
    const totalOportunidades = oportunidadesQuentes + oportunidadesQuentesInstagram;

    // 2. ATIVIDADES RECENTES
    const contatosWhatsApp = await Contato.find({})
      .sort({ dataUltimaMensagem: -1 })
      .limit(15)
      .lean();
    const contatosInstagram = await ContatoDM.find({})
      .sort({ dataUltimaMensagem: -1 })
      .limit(15)
      .lean();

    const atividadesRecentes = [...contatosWhatsApp, ...contatosInstagram]
      .filter((c: any) => c.dataUltimaMensagem)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.dataUltimaMensagem).getTime();
        const dateB = new Date(b.dataUltimaMensagem).getTime();
        return dateB - dateA;
      })
      .slice(0, 15)
      .map((contato: any) => ({
        id: contato._id.toString(),
        tipo: contato.contato?.includes('@') ? 'instagram' : 'whatsapp',
        nome: contato.contatoNome || contato.contato,
        contato: contato.contato,
        ultimaMensagem: contato.ultimaMensagem || '',
        dataUltimaMensagem: contato.dataUltimaMensagem 
          ? new Date(contato.dataUltimaMensagem).toISOString()
          : null,
        status: contato.status || 'Novo Contato',
      }));

    // 3. CONTATOS QUE PRECISAM DE FOLLOW-UP (sem resposta há mais de 2 dias)
    const doisDiasAtras = new Date(agora);
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
    
    const contatosSemRespostaWhatsApp = await Contato.find({
      dataUltimaMensagem: { $lt: doisDiasAtras },
      arquivar: { $ne: true },
    })
      .sort({ dataUltimaMensagem: 1 })
      .limit(10)
      .lean();
    
    const contatosSemRespostaInstagram = await ContatoDM.find({
      dataUltimaMensagem: { $lt: doisDiasAtras },
      arquivar: { $ne: true },
    })
      .sort({ dataUltimaMensagem: 1 })
      .limit(10)
      .lean();

    const contatosFollowUp = [...contatosSemRespostaWhatsApp, ...contatosSemRespostaInstagram]
      .map((contato: any) => ({
        id: contato._id.toString(),
        tipo: contato.contato?.includes('@') ? 'instagram' : 'whatsapp',
        nome: contato.contatoNome || contato.contato,
        contato: contato.contato,
        dataUltimaMensagem: contato.dataUltimaMensagem 
          ? new Date(contato.dataUltimaMensagem).toISOString()
          : null,
        status: contato.status || 'Novo Contato',
      }))
      .sort((a, b) => {
        const dateA = a.dataUltimaMensagem ? new Date(a.dataUltimaMensagem).getTime() : 0;
        const dateB = b.dataUltimaMensagem ? new Date(b.dataUltimaMensagem).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 10);

    // 4. NOVOS CONTATOS HOJE
    const novosContatosHoje = await Contato.countDocuments({
      createdAt: { $gte: inicioHoje },
    });
    const novosContatosInstagramHoje = await ContatoDM.countDocuments({
      createdAt: { $gte: inicioHoje },
    });
    const totalNovosContatos = novosContatosHoje + novosContatosInstagramHoje;

    // 5. GRÁFICO DE TENDÊNCIA (últimos 7 dias)
    const mensagensTendencia: Array<{ data: string; recebidas: number; enviadas: number }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(agora);
      data.setDate(data.getDate() - i);
      const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      const fimDia = new Date(inicioDia);
      fimDia.setDate(fimDia.getDate() + 1);
      
      let recebidas = 0;
      let enviadas = 0;

      [...todasMensagensWhatsApp, ...todasMensagensInstagram].forEach((msg: any) => {
        if (msg.mensagens && Array.isArray(msg.mensagens)) {
          msg.mensagens.forEach((m: any) => {
            const dataMsg = new Date(m.dataHora);
            if (dataMsg >= inicioDia && dataMsg < fimDia) {
              if (m.contatoID === '1') {
                enviadas++;
              } else {
                recebidas++;
              }
            }
          });
        }
      });

      mensagensTendencia.push({
        data: inicioDia.toISOString().split('T')[0],
        recebidas,
        enviadas,
      });
    }

    // 6. TOP CONTATOS PRIORITÁRIOS
    const contatosFavoritos = await Contato.find({ favorito: true })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();
    const contatosFavoritosInstagram = await ContatoDM.find({ favorito: true })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();

    const contatosUrgentes = await Contato.find({ tags: 'Urgente' })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();
    const contatosUrgentesInstagram = await ContatoDM.find({ tags: 'Urgente' })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();

    const contatosNegociacao = await Contato.find({ status: { $in: ['Caso Urgente', 'Encaminhado para Atendimento Humano'] } })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();
    const contatosNegociacaoInstagram = await ContatoDM.find({ status: { $in: ['Caso Urgente', 'Encaminhado para Atendimento Humano'] } })
      .sort({ dataUltimaMensagem: -1 })
      .limit(5)
      .lean();

    const topContatos = [
      ...contatosFavoritos,
      ...contatosFavoritosInstagram,
      ...contatosUrgentes,
      ...contatosUrgentesInstagram,
      ...contatosNegociacao,
      ...contatosNegociacaoInstagram,
    ]
      .map((contato: any) => ({
        id: contato._id.toString(),
        tipo: contato.contato?.includes('@') ? 'instagram' : 'whatsapp',
        nome: contato.contatoNome || contato.contato,
        contato: contato.contato,
        status: contato.status || 'Novo Contato',
        favorito: contato.favorito || false,
        tags: contato.tags || [],
        dataUltimaMensagem: contato.dataUltimaMensagem 
          ? new Date(contato.dataUltimaMensagem).toISOString()
          : null,
      }))
      .filter((c, index, self) => 
        index === self.findIndex((t) => t.id === c.id)
      )
      .sort((a, b) => {
        // Prioriza favoritos, depois urgentes, depois negociação/fechamento
        if (a.favorito && !b.favorito) return -1;
        if (!a.favorito && b.favorito) return 1;
        if (a.tags.includes('Urgente') && !b.tags.includes('Urgente')) return -1;
        if (!a.tags.includes('Urgente') && b.tags.includes('Urgente')) return 1;
        if (['Caso Urgente', 'Encaminhado para Atendimento Humano'].includes(a.status) && !['Caso Urgente', 'Encaminhado para Atendimento Humano'].includes(b.status)) return -1;
        if (!['Caso Urgente', 'Encaminhado para Atendimento Humano'].includes(a.status) && ['Caso Urgente', 'Encaminhado para Atendimento Humano'].includes(b.status)) return 1;
        return 0;
      })
      .slice(0, 5);

    // 7. RESUMO DO FUNIL
    const funilResumo = {
      'Novo Contato': 0,
      'Triagem em Andamento': 0,
      'Triagem Jurídica Concluída': 0,
      'Caso Urgente': 0,
      'Encaminhado para Atendimento Humano': 0,
      'Não é caso Jurídico': 0,
    };

    const todosContatos = await Contato.find({}).lean();
    const todosContatosInstagram = await ContatoDM.find({}).lean();

    [...todosContatos, ...todosContatosInstagram].forEach((contato: any) => {
      const status = contato.status || 'Novo Contato';
      if (status in funilResumo) {
        (funilResumo as Record<string, number>)[status]++;
      }
    });

    // 8. STATUS DO SISTEMA (simulado - pode ser melhorado com verificações reais)
    const statusSistema = {
      whatsapp: 'conectado', // Pode ser melhorado verificando conexão real
      instagram: 'conectado',
      ia: process.env.OLLAMA_AUTO_REPLY_ENABLED !== 'false' ? 'ativa' : 'inativa',
    };

    return NextResponse.json(
      {
        success: true,
        metricas: {
          totalContatos: totalContatosGeral,
          contatosAtivos,
          mensagensHoje: totalMensagensHoje,
          variacaoMensagens: parseFloat(variacaoMensagens.toFixed(1)),
          oportunidadesQuentes: totalOportunidades,
          novosContatosHoje: totalNovosContatos,
        },
        atividadesRecentes,
        contatosFollowUp,
        tendencia: mensagensTendencia,
        topContatos,
        funilResumo,
        statusSistema,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

