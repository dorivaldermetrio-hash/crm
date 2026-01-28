import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/utils/cloudinary';

/**
 * API Route para fazer upload de imagem por URL para o Cloudinary
 * POST /api/cloudinary/upload
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Verifica se é upload de arquivo (FormData) ou URL (JSON)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: 'Arquivo é obrigatório',
          },
          { status: 400 }
        );
      }

      // Valida se é uma imagem
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'O arquivo deve ser uma imagem',
          },
          { status: 400 }
        );
      }

      // Converte File para Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Faz upload da imagem para o Cloudinary
      const result = await uploadImage(buffer, 'campanhas');

      return NextResponse.json({
        success: true,
        image: result,
      });
    } else {
      // Upload por URL (JSON)
      const body = await request.json();
      const { imageUrl, folder } = body;

      if (!imageUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'URL da imagem é obrigatória',
          },
          { status: 400 }
        );
      }

      // Valida se é uma URL válida
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return NextResponse.json(
          {
            success: false,
            error: 'URL inválida. Deve começar com http:// ou https://',
          },
          { status: 400 }
        );
      }

      // Faz upload da imagem para o Cloudinary
      const result = await uploadImage(imageUrl, folder || 'campanhas');

      return NextResponse.json({
        success: true,
        image: result,
      });
    }
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    
    let errorMessage = 'Erro ao fazer upload da imagem';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Ajusta status code baseado no tipo de erro
      if (errorMessage.includes('protegida') || errorMessage.includes('403')) {
        statusCode = 403;
      } else if (errorMessage.includes('não foi encontrada') || errorMessage.includes('404')) {
        statusCode = 404;
      } else if (errorMessage.includes('inválida') || errorMessage.includes('URL inválida')) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}

