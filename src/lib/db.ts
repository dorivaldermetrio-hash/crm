import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error(
    'Por favor, defina a variável MONGODB_URL no arquivo .env.local'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache global para reutilizar a conexão em desenvolvimento
// Isso evita múltiplas conexões durante hot-reload do Next.js
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: 'crm-db', // Nome do banco de dados
    };

    cached.promise = mongoose
      .connect(MONGODB_URL!, opts)
      .then((mongoose) => {
        console.log('✅ Conectado ao MongoDB - Banco: crm-db');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

