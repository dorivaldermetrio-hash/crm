import { ExtractedDataInstagram } from './extractDataInstagram';

/**
 * Valida se os dados extraídos do Instagram são válidos para processamento
 */
export function validateMessageInstagram(data: ExtractedDataInstagram | null): {
  isValid: boolean;
  error?: string;
} {
  if (!data) {
    return {
      isValid: false,
      error: 'Dados não fornecidos',
    };
  }

  // Valida instagram_id
  if (!data.instagram_id || data.instagram_id.trim() === '') {
    return {
      isValid: false,
      error: 'instagram_id não fornecido ou inválido',
    };
  }

  // Valida messageId
  if (!data.messageId || data.messageId.trim() === '') {
    return {
      isValid: false,
      error: 'messageId não fornecido ou inválido',
    };
  }

  // Valida mensagem (pode ser vazia para mídia sem caption)
  if (data.mensagem === undefined) {
    return {
      isValid: false,
      error: 'Mensagem não fornecida',
    };
  }

  // Valida timestamp
  if (!data.timestamp || isNaN(data.timestamp) || data.timestamp <= 0) {
    return {
      isValid: false,
      error: 'Timestamp inválido',
    };
  }

  // Valida tipo
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

