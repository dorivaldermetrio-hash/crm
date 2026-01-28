/**
 * Função para obter os próximos horários disponíveis para agendamento
 * Retorna os próximos 10 horários disponíveis, respeitando:
 * - Horários de expediente configurados
 * - Eventos já marcados
 * - Apenas datas futuras
 */

interface HorarioDisponivel {
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  dataFormatada: string; // DD/MM/YYYY HH:MM
}

interface Agendamento {
  _id?: string;
  data: string;
  horarioInicio: string;
  duracao: string;
}

interface Config {
  horarioInicio: string;
  horarioFim: string;
  horarioInicioSab?: string;
  horarioFimSab?: string;
  finsDeSemana?: boolean;
  duracaoAgendamento: string;
}

/**
 * Converte horário HH:MM para minutos
 */
function horarioParaMinutos(horario: string): number {
  const [horas, minutos] = horario.split(':').map(Number);
  return horas * 60 + minutos;
}

/**
 * Converte minutos para horário HH:MM
 */
function minutosParaHorario(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Adiciona minutos a um horário
 */
function adicionarMinutos(horario: string, minutos: number): string {
  const totalMinutos = horarioParaMinutos(horario) + minutos;
  return minutosParaHorario(totalMinutos);
}

/**
 * Verifica se um horário está dentro do expediente
 */
function estaNoExpediente(
  horario: string,
  diaSemana: number,
  config: Config
): boolean {
  // Domingo = 0, Segunda = 1, ..., Sábado = 6
  const isSabado = diaSemana === 6;
  const isDomingo = diaSemana === 0;

  // Domingo não tem expediente (a menos que configurado)
  if (isDomingo) {
    return false;
  }

  // Sábado - verifica se fins de semana está ativado
  if (isSabado) {
    if (!config.finsDeSemana || !config.horarioInicioSab || !config.horarioFimSab) {
      return false;
    }
    const horarioMin = horarioParaMinutos(horario);
    const inicioMin = horarioParaMinutos(config.horarioInicioSab);
    const fimMin = horarioParaMinutos(config.horarioFimSab);
    return horarioMin >= inicioMin && horarioMin < fimMin;
  }

  // Segunda a Sexta
  const horarioMin = horarioParaMinutos(horario);
  const inicioMin = horarioParaMinutos(config.horarioInicio);
  const fimMin = horarioParaMinutos(config.horarioFim);
  return horarioMin >= inicioMin && horarioMin < fimMin;
}

/**
 * Verifica se um horário conflita com algum agendamento existente
 */
function conflitaComAgendamento(
  data: string,
  horario: string,
  duracao: string,
  agendamentos: Agendamento[]
): boolean {
  const horarioInicioMin = horarioParaMinutos(horario);
  const [horas, mins] = duracao.split(':').map(Number);
  const duracaoMin = horas * 60 + mins;
  const horarioFimMin = horarioInicioMin + duracaoMin;

  return agendamentos.some((agendamento) => {
    // Só verifica agendamentos na mesma data
    if (agendamento.data !== data) return false;

    const agendamentoInicioMin = horarioParaMinutos(agendamento.horarioInicio);
    const [agendamentoHoras, agendamentoMins] = agendamento.duracao.split(':').map(Number);
    const agendamentoDuracaoMin = agendamentoHoras * 60 + agendamentoMins;
    const agendamentoFimMin = agendamentoInicioMin + agendamentoDuracaoMin;

    // Verifica sobreposição
    return (
      (horarioInicioMin < agendamentoFimMin && horarioFimMin > agendamentoInicioMin)
    );
  });
}

/**
 * Formata data e horário para exibição
 */
function formatarDataHora(data: string, horario: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano} ${horario}`;
}

/**
 * Gera slots de horários para um dia baseado no expediente
 */
function gerarSlotsDoDia(
  data: string,
  config: Config,
  duracaoAgendamento: string
): string[] {
  const dataObj = new Date(data + 'T00:00:00');
  const diaSemana = dataObj.getDay();

  let horarioInicio: string;
  let horarioFim: string;

  if (diaSemana === 6 && config.finsDeSemana && config.horarioInicioSab && config.horarioFimSab) {
    // Sábado
    horarioInicio = config.horarioInicioSab;
    horarioFim = config.horarioFimSab;
  } else if (diaSemana === 0) {
    // Domingo - sem expediente
    return [];
  } else {
    // Segunda a Sexta
    horarioInicio = config.horarioInicio;
    horarioFim = config.horarioFim;
  }

  const slots: string[] = [];
  const [duracaoHoras, duracaoMins] = duracaoAgendamento.split(':').map(Number);
  const duracaoMinutos = duracaoHoras * 60 + duracaoMins;

  let horarioAtual = horarioInicio;
  const horarioFimMin = horarioParaMinutos(horarioFim);

  while (horarioParaMinutos(horarioAtual) + duracaoMinutos <= horarioFimMin) {
    slots.push(horarioAtual);
    horarioAtual = adicionarMinutos(horarioAtual, duracaoMinutos);
  }

  return slots;
}

/**
 * Função principal para obter datas disponíveis
 */
export async function obterDatasDisponiveis(): Promise<HorarioDisponivel[]> {
  try {
    // Busca configurações
    const configResponse = await fetch('/api/config');
    const configResult = await configResponse.json();

    if (!configResult.success || !configResult.data) {
      throw new Error('Erro ao buscar configurações');
    }

    const config: Config = {
      horarioInicio: configResult.data.horarioInicio || '08:00',
      horarioFim: configResult.data.horarioFim || '18:00',
      horarioInicioSab: configResult.data.horarioInicioSab || '08:00',
      horarioFimSab: configResult.data.horarioFimSab || '18:00',
      finsDeSemana: configResult.data.finsDeSemana || false,
      duracaoAgendamento: configResult.data.duracaoAgendamento || '1:00',
    };

    // Busca agendamentos
    const agendamentosResponse = await fetch('/api/agendamentos');
    const agendamentosResult = await agendamentosResponse.json();

    if (!agendamentosResult.success) {
      throw new Error('Erro ao buscar agendamentos');
    }

    const agendamentos: Agendamento[] = agendamentosResult.agendamentos || [];

    // Data atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const horariosDisponiveis: HorarioDisponivel[] = [];
    let dataAtual = new Date(hoje);

    // Busca os próximos 10 horários disponíveis
    let diasBuscados = 0;
    const maxDias = 60; // Aumenta o limite para garantir que encontre horários

    while (horariosDisponiveis.length < 10 && diasBuscados < maxDias) {
      const dataStr = dataAtual.toISOString().split('T')[0];
      const diaSemana = dataAtual.getDay();

      // Verifica se o dia tem expediente (não é domingo, ou é sábado com fins de semana ativado)
      const temExpediente = 
        (diaSemana >= 1 && diaSemana <= 5) || // Segunda a Sexta
        (diaSemana === 6 && config.finsDeSemana); // Sábado se fins de semana ativado

      if (temExpediente) {
        // Gera slots do dia
        const slots = gerarSlotsDoDia(dataStr, config, config.duracaoAgendamento);

        for (const horario of slots) {
          // Se já temos 10 horários, para
          if (horariosDisponiveis.length >= 10) break;

          // Se é hoje, verifica se o horário já passou
          const isHoje = dataAtual.getTime() === hoje.getTime();
          if (isHoje) {
            const agora = new Date();
            const [horas, minutos] = horario.split(':').map(Number);
            const horarioData = new Date(hoje);
            horarioData.setHours(horas, minutos, 0, 0);

            if (horarioData <= agora) {
              continue; // Horário já passou
            }
          }

          // Verifica se conflita com algum agendamento
          if (
            !conflitaComAgendamento(dataStr, horario, config.duracaoAgendamento, agendamentos)
          ) {
            horariosDisponiveis.push({
              data: dataStr,
              horario,
              dataFormatada: formatarDataHora(dataStr, horario),
            });
          }
        }
      }

      // Avança para o próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
      dataAtual.setHours(0, 0, 0, 0);
      diasBuscados++;
    }

    console.log('Horários disponíveis encontrados:', horariosDisponiveis.length);
    return horariosDisponiveis.slice(0, 10);
  } catch (error) {
    console.error('Erro ao obter datas disponíveis:', error);
    throw error;
  }
}
