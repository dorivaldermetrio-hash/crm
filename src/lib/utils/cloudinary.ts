import { v2 as cloudinary } from 'cloudinary';

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param file - Buffer, base64 string ou URL da imagem
 * @param folder - Pasta onde a imagem será salva (opcional)
 * @param options - Opções adicionais de upload
 */
export async function uploadImage(
  file: Buffer | string,
  folder?: string,
  options?: {
    transformation?: any[];
    public_id?: string;
    overwrite?: boolean;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<UploadResult> {
  try {
    const uploadOptions: any = {
      resource_type: options?.resource_type || 'auto',
      ...(folder && { folder }),
      ...(options?.public_id && { public_id: options.public_id }),
      ...(options?.overwrite !== undefined && { overwrite: options.overwrite }),
      ...(options?.transformation && { transformation: options.transformation }),
    };

    let result;
    if (Buffer.isBuffer(file)) {
      // Upload de buffer usando data URI
      const base64 = file.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64}`;
      result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    } else if (file.startsWith('http://') || file.startsWith('https://')) {
      // Tenta upload direto da URL primeiro
      try {
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } catch (urlError: any) {
        // Se falhar com 403/401 ou erro de acesso, tenta fazer download primeiro
        const errorMessage = urlError?.message || '';
        const httpCode = urlError?.http_code;
        const isProtected = 
          httpCode === 400 && (errorMessage.includes('403') || errorMessage.includes('Forbidden')) ||
          httpCode === 403 ||
          errorMessage.includes('403 Forbidden') ||
          errorMessage.includes('Error in loading');
        
        if (isProtected) {
          console.log('URL protegida detectada, tentando download primeiro...');
          try {
            const response = await fetch(file, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*',
                'Referer': new URL(file).origin,
              },
            });

            if (!response.ok) {
              throw new Error(`Não foi possível acessar a imagem. A URL pode estar protegida ou requerer autenticação. (Status: ${response.status})`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            
            // Detecta o tipo MIME da imagem
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const dataUri = `data:${contentType};base64,${base64}`;
            
            result = await cloudinary.uploader.upload(dataUri, uploadOptions);
          } catch (downloadError: any) {
            const downloadMessage = downloadError?.message || 'Erro desconhecido';
            throw new Error(`Não foi possível fazer download da imagem. ${downloadMessage.includes('Status:') ? downloadMessage : 'A URL pode estar protegida ou não ser acessível. Tente usar uma URL pública de imagem ou fazer download manualmente.'}`);
          }
        } else {
          throw urlError;
        }
      }
    } else {
      // Upload de base64 ou data URI
      result = await cloudinary.uploader.upload(file, uploadOptions);
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('Erro ao fazer upload para Cloudinary:', error);
    
    // Mensagens de erro mais específicas
    if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
      throw new Error('A URL da imagem está protegida e não pode ser acessada. Tente usar uma URL pública de imagem ou fazer download manualmente.');
    }
    
    if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
      throw new Error('A imagem não foi encontrada na URL fornecida. Verifique se a URL está correta.');
    }
    
    if (error?.http_code === 400) {
      throw new Error('URL inválida ou imagem não suportada. Verifique se a URL aponta para uma imagem válida.');
    }
    
    throw new Error(error?.message || 'Falha ao fazer upload da imagem. Verifique se a URL é acessível e aponta para uma imagem válida.');
  }
}

/**
 * Deleta uma imagem do Cloudinary
 * @param publicId - ID público da imagem no Cloudinary
 * @param resourceType - Tipo do recurso (image, video, raw)
 */
export async function deleteImage(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    throw new Error(`Falha ao deletar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Gera uma URL otimizada da imagem com transformações
 * @param publicId - ID público da imagem
 * @param options - Opções de transformação
 */
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: 'jpg' | 'png' | 'webp' | 'gif' | 'auto';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'limit';
    gravity?: string;
  }
): string {
  const transformation: any[] = [];

  if (options?.width || options?.height) {
    transformation.push({
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      ...(options.gravity && { gravity: options.gravity }),
    });
  }

  if (options?.quality) {
    transformation.push({ quality: options.quality });
  }

  if (options?.format) {
    transformation.push({ format: options.format });
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation,
  });
}

/**
 * Lista todas as imagens do Cloudinary
 * @param folder - Pasta específica para buscar (opcional)
 * @param maxResults - Número máximo de resultados (padrão: 50)
 */
export async function listImages(
  folder?: string,
  maxResults: number = 50
): Promise<UploadResult[]> {
  try {
    const options: any = {
      type: 'upload',
      resource_type: 'image',
      max_results: maxResults,
      ...(folder && { prefix: folder }),
    };

    const result = await cloudinary.api.resources(options);

    return (result.resources || []).map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      url: resource.url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
    }));
  } catch (error) {
    console.error('Erro ao listar imagens do Cloudinary:', error);
    throw new Error(`Falha ao listar imagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export default cloudinary;

