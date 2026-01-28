import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Config from '@/lib/models/Config';

/**
 * API Route para buscar a configuração
 * GET /api/config
 * Retorna o único documento da coleção (ou cria um vazio se não existir)
 */
export async function GET() {
  try {
    await connectDB();

    // Busca o único documento (ou primeiro se houver múltiplos)
    let config = await Config.findOne().lean();

    // Se não existir, cria um documento com valores padrão
    if (!config) {
      const newConfig = new Config({
        numMsgHist: 0,
        duracaoAgendamento: '0:00',
        pararAtendimento: 'Nenhum',
        horarioInicio: '08:00',
        horarioFim: '18:00',
        horarioInicioSab: '08:00',
        horarioFimSab: '18:00',
      });
      await newConfig.save();
      config = newConfig.toObject();
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          numMsgHist: (config as any).numMsgHist || 0,
          duracaoAgendamento: (config as any).duracaoAgendamento || '0:00',
          pararAtendimento: (config as any).pararAtendimento || 'Nenhum',
          horarioInicio: (config as any).horarioInicio || '08:00',
          horarioFim: (config as any).horarioFim || '18:00',
          horarioInicioSab: (config as any).horarioInicioSab || '08:00',
          horarioFimSab: (config as any).horarioFimSab || '18:00',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao buscar config:', error);
    
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
 * API Route para salvar/atualizar a configuração
 * PUT /api/config
 * Body: { numMsgHist?: number, duracaoAgendamento?: number, pararAtendimento?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Busca o único documento (ou primeiro se houver múltiplos)
    let config = await Config.findOne();

    // Se não existir, cria um novo
    if (!config) {
      config = new Config({
        numMsgHist: body.numMsgHist || 0,
        duracaoAgendamento: body.duracaoAgendamento || '0:00',
        pararAtendimento: body.pararAtendimento || 'Nenhum',
        horarioInicio: body.horarioInicio || '08:00',
        horarioFim: body.horarioFim || '18:00',
        horarioInicioSab: body.horarioInicioSab || '08:00',
        horarioFimSab: body.horarioFimSab || '18:00',
      });
    } else {
      // Atualiza apenas os campos fornecidos
      if (body.numMsgHist !== undefined) config.numMsgHist = body.numMsgHist;
      if (body.duracaoAgendamento !== undefined) config.duracaoAgendamento = body.duracaoAgendamento;
      if (body.pararAtendimento !== undefined) config.pararAtendimento = body.pararAtendimento;
      if (body.horarioInicio !== undefined) config.horarioInicio = body.horarioInicio;
      if (body.horarioFim !== undefined) config.horarioFim = body.horarioFim;
      if (body.horarioInicioSab !== undefined) config.horarioInicioSab = body.horarioInicioSab;
      if (body.horarioFimSab !== undefined) config.horarioFimSab = body.horarioFimSab;
    }

    await config.save();

    console.log('✅ Config atualizado:', {
      id: config._id.toString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Configuração salva com sucesso',
        data: {
          numMsgHist: config.numMsgHist || 0,
          duracaoAgendamento: config.duracaoAgendamento || '0:00',
          pararAtendimento: config.pararAtendimento || 'Nenhum',
          horarioInicio: config.horarioInicio || '08:00',
          horarioFim: config.horarioFim || '18:00',
          horarioInicioSab: config.horarioInicioSab || '08:00',
          horarioFimSab: config.horarioFimSab || '18:00',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao salvar config:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

