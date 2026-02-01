import { type Db, MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'lets-vamos';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Minimal options to reduce TLS handshake issues in serverless (ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR).
 * serverApi is omitted — it can trigger alert 80 in some Vercel/Lambda runtimes.
 */
const clientOptions = {
  autoSelectFamily: false,
  family: 4,
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and across serverless invocations in production.
 */
declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClient(): MongoClient {
  if (global._mongoClient) {
    return global._mongoClient;
  }
  const client = new MongoClient(MONGODB_URI, clientOptions);
  global._mongoClient = client;
  return client;
}

function getClientPromise(): Promise<MongoClient> {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }
  const promise = getClient().connect();
  global._mongoClientPromise = promise;
  return promise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}

export default getClientPromise();
