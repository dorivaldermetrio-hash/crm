/**
 * Valida se o cliente quer trocar de produto usando Ollama
 */

import { generateInterestValidationPrompt } from './generateInterestValidationPrompt';
import { parseInterestValidationResponse } from './parseValidationResponse';
import { getOllamaModel } from '@/lib/config/ollama';

export interface InterestChangeResult {
  troca: boolean;
  produto: string | null;
}

/**
 * Valida se o cliente quer trocar de produto
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Resultado da validação ou null em caso de erro
 */
export async function validateInterestChange(
  contatoId: string,
  mensagemRecebida: string
): Promise<InterestChangeResult | null> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const modelName = getOllamaModel();

    // 1. Gera o prompt de validação
    const prompt = await generateInterestValidationPrompt(contatoId, mensagemRecebida);

    // 2. Define JSON schema para resposta
    const jsonSchema = {
      type: 'object',
      properties: {
        troca: {
          type: 'boolean',
          description: 'Se há interesse em trocar de produto'
        },
        produto: {
          type: ['string', 'null'],
          description: 'Nome do produto ou null ou DESCONHECIDO'
        }
      },
      required: ['troca', 'produto'],
      additionalProperties: false
    };

    // 3. Chama Ollama
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
        format: jsonSchema,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao chamar Ollama: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.message || !data.message.content) {
      throw new Error('Resposta inválida do Ollama');
    }

    const rawResponse = data.message.content.trim();

    // 4. Faz parse da resposta
    const parsed = parseInterestValidationResponse(rawResponse);

    if (!parsed) {
      console.error('❌ Falha ao fazer parse da resposta de validação de interesse');
      return null;
    }

    console.log('✅ Validação de troca de interesse:', parsed);

    return parsed;
  } catch (error) {
    console.error('❌ Erro ao validar troca de interesse:', error);
    return null;
  }
}

