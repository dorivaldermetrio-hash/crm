/**
 * Utilitário para buscar produtos ativos do banco de dados
 * Retorna apenas produtos com ativado === 'sim'
 */

import connectDB from '@/lib/db';
import Produto from '@/lib/models/Produto';

export interface ActiveProduct {
  nome: string;
  descBreve: string;
}

/**
 * Busca todos os produtos ativos (ativado === 'sim')
 * @returns Array de produtos com nome e descBreve
 */
export async function getActiveProducts(): Promise<ActiveProduct[]> {
  try {
    await connectDB();

    const produtos = await Produto.find({ ativado: 'sim' })
      .select('nome descBreve')
      .lean();

    return produtos.map((produto: any) => ({
      nome: produto.nome || '',
      descBreve: produto.descBreve || '',
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar produtos ativos:', error);
    return [];
  }
}

