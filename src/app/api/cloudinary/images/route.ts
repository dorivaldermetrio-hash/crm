import { NextResponse } from 'next/server';
import { listImages } from '@/lib/utils/cloudinary';

/**
 * API Route para listar imagens do Cloudinary
 * GET /api/cloudinary/images?folder=opcional&maxResults=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '50', 10);

    const images = await listImages(folder, maxResults);

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Erro ao buscar imagens do Cloudinary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar imagens',
      },
      { status: 500 }
    );
  }
}

