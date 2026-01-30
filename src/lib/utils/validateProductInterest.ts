/**
 * Valida interesse do cliente em produtos usando Ollama
 */

import { generateProductValidationPrompt } from './generateProductValidationPrompt';
import { parseProductValidationResponse } from './parseValidationResponse';
import { getAIModel } from '@/lib/config/ai';

export interface ProductValidationResult {
  interesse: boolean;
  produto: string | null;
}

/**
 * Valida se o cliente tem interesse em produtos
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Resultado da validação ou null em caso de erro
 */
export async function validateProductInterest(
  contatoId: string,
  mensagemRecebida: string
): Promise<ProductValidationResult | null> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const modelName = getAIModel();

    // 1. Gera o prompt de validação
    const prompt = await generateProductValidationPrompt(contatoId, mensagemRecebida);

    // 2. Define JSON schema para resposta
    const jsonSchema = {
      type: 'object',
      properties: {
        interesse: {
          type: 'boolean',
          description: 'Se há interesse comercial real'
        },
        produto: {
          type: ['string', 'null'],
          description: 'Nome do produto ou null ou DESCONHECIDO'
        }
      },
      required: ['interesse', 'produto'],
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
    const parsed = parseProductValidationResponse(rawResponse);

    if (!parsed) {
      console.error('❌ Falha ao fazer parse da resposta de validação de produtos');
      return null;
    }

    console.log('✅ Validação de interesse em produtos:', parsed);

    return parsed;
  } catch (error) {
    console.error('❌ Erro ao validar interesse em produtos:', error);
    return null;
  }
}

