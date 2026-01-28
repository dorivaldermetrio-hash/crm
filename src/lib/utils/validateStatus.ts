/**
 * Valida o status do contato usando Ollama
 */

import { generateStatusValidationPrompt } from './generateStatusValidationPrompt';
import { processPromptVariables } from './processPromptVariables';
import { getOllamaModel } from '@/lib/config/ollama';
import connectDB from '@/lib/db';
import AtendimentoAI from '@/lib/models/AtendimentoAI';

export interface StatusValidationResult {
  status: string;
}

/**
 * Valida o status do contato baseado na conversa
 * @param contatoId - ID do contato
 * @param mensagemRecebida - Mensagem atual do cliente
 * @returns Status validado ou null em caso de erro
 */
export async function validateStatus(
  contatoId: string,
  mensagemRecebida: string
): Promise<StatusValidationResult | null> {
  try {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const modelName = getOllamaModel();

    // 1. Busca prompt da coleção atendimento-ai ou usa fallback
    await connectDB();
    const verificadorStatusDB = await AtendimentoAI.findOne({ nome: 'Verificador de Status' }).lean();
    
    let prompt = '';
    if (verificadorStatusDB && verificadorStatusDB.prompt && verificadorStatusDB.prompt.trim() !== '') {
      // Usa prompt do banco de dados e processa variáveis
      const promptTemplate = verificadorStatusDB.prompt;
      prompt = await processPromptVariables(promptTemplate, contatoId, mensagemRecebida);
      console.log('✅ Usando prompt da coleção atendimento-ai para Verificador de Status');
    } else {
      // Fallback para função antiga se não encontrar no banco
      prompt = await generateStatusValidationPrompt(contatoId, mensagemRecebida);
      console.log('⚠️ Prompt não encontrado no banco, usando função generateStatusValidationPrompt');
    }

    // 2. Define JSON schema para resposta
    const jsonSchema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'],
          description: 'Status do contato'
        }
      },
      required: ['status'],
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
    let jsonString = rawResponse.trim();

    // Remove markdown code blocks se existirem
    jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Tenta extrair JSON se houver texto antes ou depois
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonString);

    // Valida estrutura e status
    if (!parsed.status || typeof parsed.status !== 'string') {
      console.error('❌ Resposta de validação de status inválida:', parsed);
      return null;
    }

    const statusValido = ['Novo Contato', 'Triagem em Andamento', 'Triagem Jurídica Concluída', 'Caso Urgente', 'Encaminhado para Atendimento Humano', 'Não é caso Jurídico'];
    if (!statusValido.includes(parsed.status)) {
      console.error('❌ Status inválido retornado:', parsed.status);
      return null;
    }

    console.log('✅ Status validado:', parsed.status);

    return {
      status: parsed.status,
    };
  } catch (error) {
    console.error('❌ Erro ao validar status:', error);
    return null;
  }
}

