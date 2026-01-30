import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import connectDB from '@/lib/db';

let gridfsBucket: GridFSBucket | null = null;

/**
 * Inicializa o GridFS bucket para armazenar mídias
 */
async function getGridFSBucket(): Promise<GridFSBucket> {
  if (gridfsBucket) {
    return gridfsBucket;
  }

  console.log(`🔌 GridFS: Conectando ao banco de dados...`);
  await connectDB();
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection not available');
  }

  console.log(`📦 GridFS: Criando bucket 'midia'...`);
  // Cria bucket customizado para mídias do WhatsApp
  gridfsBucket = new GridFSBucket(db, { bucketName: 'midia' });
  console.log(`✅ GridFS: Bucket criado com sucesso`);
  return gridfsBucket;
}

/**
 * Salva um arquivo no GridFS
 * @param buffer Buffer do arquivo
 * @param filename Nome do arquivo
 * @param contentType Tipo MIME do arquivo
 * @returns ObjectId do arquivo salvo
 */
export async function saveFileToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    const bucket = await getGridFSBucket();
    
    console.log(`💾 GridFS: Salvando arquivo: ${filename} (${contentType}, ${buffer.length} bytes)`);
    
    return new Promise((resolve, reject) => {
      // GridFS armazena contentType como metadata
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: { contentType },
      } as any);

      uploadStream.on('finish', () => {
        const fileId = uploadStream.id.toString();
        console.log(`✅ GridFS: Arquivo salvo com sucesso. ID: ${fileId}`);
        resolve(fileId);
      });

      uploadStream.on('error', (error) => {
        console.error(`❌ GridFS: Erro ao salvar arquivo:`, error);
        reject(error);
      });

      // Valida buffer antes de escrever
      if (!buffer || buffer.length === 0) {
        reject(new Error('Buffer vazio ou inválido'));
        return;
      }

      // Escreve o buffer e fecha o stream
      uploadStream.write(buffer);
      uploadStream.end();
    });
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo no GridFS:', error);
    throw error;
  }
}

/**
 * Busca um arquivo do GridFS
 * @param fileId ObjectId do arquivo
 * @returns Buffer do arquivo e metadados
 */
export async function getFileFromGridFS(fileId: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  try {
    const bucket = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    console.log(`🔍 GridFS: Buscando arquivo com ID: ${fileId} (ObjectId: ${objectId})`);

    // Verifica se o arquivo existe
    const files = await bucket.find({ _id: objectId }).toArray();
    console.log(`📊 GridFS: Encontrados ${files.length} arquivo(s) com esse ID`);
    
    if (files.length === 0) {
      console.warn(`⚠️ GridFS: Nenhum arquivo encontrado com ID: ${fileId}`);
      // Tenta buscar todos os arquivos para debug
      const allFiles = await bucket.find({}).limit(5).toArray();
      console.log(`📋 GridFS: Primeiros 5 arquivos no bucket:`, allFiles.map(f => ({ id: f._id.toString(), filename: f.filename })));
      return null;
    }

    const file = files[0];
    // Acessa contentType de forma segura (pode estar em metadata ou como propriedade direta)
    const contentType = (file as any).contentType || (file as any).metadata?.contentType;
    console.log(`📄 GridFS: Arquivo encontrado:`, {
      id: file._id.toString(),
      filename: file.filename,
      contentType: contentType,
      length: file.length,
      uploadDate: file.uploadDate,
    });

    // Lê o arquivo
    const chunks: Buffer[] = [];
    const downloadStream = bucket.openDownloadStream(objectId);

    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ GridFS: Arquivo lido com sucesso: ${buffer.length} bytes`);
        
        // Valida se o buffer não está vazio
        if (buffer.length === 0) {
          console.error(`❌ GridFS: Buffer vazio após leitura!`);
          reject(new Error('Buffer vazio'));
          return;
        }
        
        // Log dos primeiros bytes para debug
        const firstBytes = buffer.slice(0, 8);
        console.log(`   Primeiros bytes: ${Array.from(firstBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
        
        resolve({
          buffer,
          contentType: contentType || 'application/octet-stream',
          filename: file.filename || 'file',
        });
      });

      downloadStream.on('error', (error) => {
        console.error(`❌ GridFS: Erro ao ler arquivo:`, error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ Erro ao buscar arquivo do GridFS:', error);
    return null;
  }
}

/**
 * Deleta um arquivo do GridFS
 * @param fileId ObjectId do arquivo
 */
export async function deleteFileFromGridFS(fileId: string): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    await bucket.delete(objectId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo do GridFS:', error);
    return false;
  }
}

/**
 * Verifica se um arquivo existe no GridFS
 * @param fileId ObjectId do arquivo
 */
export async function fileExistsInGridFS(fileId: string): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    const files = await bucket.find({ _id: objectId }).toArray();
    return files.length > 0;
  } catch (error) {
    console.error('❌ Erro ao verificar arquivo no GridFS:', error);
    return false;
  }
}

