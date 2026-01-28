import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';

/**
 * Rota de teste para verificar a conexão com o MongoDB
 * Acesse: http://localhost:3000/api/test-db
 */
export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Conexão com MongoDB estabelecida com sucesso!',
        database: 'crm-db',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao conectar ao MongoDB',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

