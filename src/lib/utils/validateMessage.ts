import { ExtractedData } from './extractData';

/**
 * Valida se os dados extraídos são válidos para processamento
 */
export function validateMessage(data: ExtractedData | null): {
  isValid: boolean;
  error?: string;
} {
  if (!data) {
    return {
      isValid: false,
      error: 'Dados não fornecidos',
    };
  }

  // Valida wa_id
  if (!data.wa_id || data.wa_id.trim() === '') {
    return {
      isValid: false,
      error: 'wa_id não fornecido ou inválido',
    };
  }

  // Valida messageId
  if (!data.messageId || data.messageId.trim() === '') {
    return {
      isValid: false,
      error: 'messageId não fornecido ou inválido',
    };
  }

  // Valida mensagem
  if (!data.mensagem || data.mensagem.trim() === '') {
    return {
      isValid: false,
      error: 'Mensagem vazia',
    };
  }

  // Valida timestamp
  if (!data.timestamp || isNaN(data.timestamp) || data.timestamp <= 0) {
    return {
      isValid: false,
      error: 'Timestamp inválido',
    };
  }

  // Valida tipo (inicialmente só aceitamos 'texto', mas preparado para outros tipos)
  const tiposSuportados = ['texto', 'imagem', 'audio', 'video', 'documento', 'localizacao'];
  if (!tiposSuportados.includes(data.tipo)) {
    return {
      isValid: false,
      error: `Tipo de mensagem '${data.tipo}' não suportado ainda`,
    };
  }

  return {
    isValid: true,
  };
}

