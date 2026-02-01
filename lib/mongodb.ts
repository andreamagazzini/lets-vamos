import { type Db, MongoClient, ServerApiVersion } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'lets-vamos';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Connection options to avoid SSL/TLS handshake failures (e.g. ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR)
 * in serverless and some Node runtimes:
 * - autoSelectFamily: false + family: 4 — avoid IP family selection issues that can trigger TLS alerts
 * - secureProtocol: 'TLSv1_2_method' — force TLS 1.2 only (Atlas requires modern TLS; older protocols can cause alert 80)
 */
const clientOptions = {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  autoSelectFamily: false,
  family: 4,
  secureProtocol: 'TLSv1_2_method',
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClient) {
    client = new MongoClient(MONGODB_URI, clientOptions);
    global._mongoClient = client;
  } else {
    client = global._mongoClient;
  }
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, clientOptions);
}

clientPromise = client.connect();

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
