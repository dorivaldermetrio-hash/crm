/**
 * Utilitários para fazer parse das respostas de validação do Ollama
 */

export interface ProductValidationResponse {
  interesse: boolean;
  produto: string | null;
}

export interface InterestValidationResponse {
  troca: boolean;
  produto: string | null;
}

/**
 * Faz parse da resposta de validação de produtos
 * @param response - Resposta do Ollama (pode conter JSON ou markdown)
 * @returns Objeto parseado ou null em caso de erro
 */
export function parseProductValidationResponse(
  response: string
): ProductValidationResponse | null {
  try {
    let jsonString = response.trim();

    // Remove markdown code blocks se existirem
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Tenta extrair JSON se houver texto antes ou depois
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonString);

    // Valida estrutura
    if (typeof parsed.interesse !== 'boolean') {
      return null;
    }

    return {
      interesse: parsed.interesse,
      produto: parsed.produto || null,
    };
  } catch (error) {
    console.error('❌ Erro ao fazer parse da resposta de validação de produtos:', error);
    console.error('Resposta recebida:', response);
    return null;
  }
}

/**
 * Faz parse da resposta de validação de interesse
 * @param response - Resposta do Ollama (pode conter JSON ou markdown)
 * @returns Objeto parseado ou null em caso de erro
 */
export function parseInterestValidationResponse(
  response: string
): InterestValidationResponse | null {
  try {
    let jsonString = response.trim();

    // Remove markdown code blocks se existirem
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Tenta extrair JSON se houver texto antes ou depois
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonString);

    // Valida estrutura
    if (typeof parsed.troca !== 'boolean') {
      return null;
    }

    return {
      troca: parsed.troca,
      produto: parsed.produto || null,
    };
  } catch (error) {
    console.error('❌ Erro ao fazer parse da resposta de validação de interesse:', error);
    console.error('Resposta recebida:', response);
    return null;
  }
}

