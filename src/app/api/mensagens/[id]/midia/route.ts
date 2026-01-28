import { NextRequest, NextResponse } from 'next/server';
import { getFileFromGridFS } from '@/lib/utils/gridfs';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

/**
 * API Route para servir mídias do GridFS
 * GET /api/mensagens/[id]/midia
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log(`\n🌐 ========================================`);
  console.log(`🌐 REQUISIÇÃO DE MÍDIA RECEBIDA`);
  console.log(`🌐 ========================================`);
  console.log(`🌐 URL: ${request.url}`);
  console.log(`🌐 Method: ${request.method}`);
  
  try {
    // Garante que está conectado ao banco
    await connectDB();
    const { id } = await params;
    const fileId = id;

    console.log(`📥 Buscando mídia no GridFS: ${fileId}`);
    console.log(`📥 URL completa: ${request.url}`);

    // Valida ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.error(`❌ ID de arquivo inválido: ${fileId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'ID de arquivo inválido',
        },
        { status: 400 }
      );
    }

    // Busca arquivo no GridFS
    console.log(`🔍 Buscando arquivo no GridFS...`);
    const fileData = await getFileFromGridFS(fileId);

    if (!fileData) {
      console.error(`❌ Arquivo não encontrado no GridFS: ${fileId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo não encontrado',
        },
        { status: 404 }
      );
    }

    console.log(`✅ Arquivo encontrado: ${fileData.filename} (${fileData.contentType}, ${fileData.buffer.length} bytes)`);
    
    // Valida se o buffer não está vazio
    if (fileData.buffer.length === 0) {
      console.error(`❌ Buffer vazio! Não é possível servir arquivo vazio.`);
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo vazio',
        },
        { status: 500 }
      );
    }
    
    // Log dos primeiros bytes para debug
    const firstBytes = fileData.buffer.slice(0, 8);
    console.log(`   Primeiros bytes: ${Array.from(firstBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

    // Retorna o arquivo com headers apropriados
    return new NextResponse(fileData.buffer, {
      status: 200,
      headers: {
        'Content-Type': fileData.contentType,
        'Content-Disposition': `inline; filename="${fileData.filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileData.buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro ao servir mídia:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

