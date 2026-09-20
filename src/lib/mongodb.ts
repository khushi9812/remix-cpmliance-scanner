import { MongoClient, MongoClientOptions, Db } from "mongodb";
import net from "net";

export const DEFAULT_MONGODB_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/SIH?retryWrites=true&w=majority";

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoClient: MongoClient | undefined;
}

function probeHost(host: string, port: number, timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once("error", () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}

/**
 * Initializes or retrieves the active MongoClient promise singleton lazily.
 * Guarantees zero network calls or socket connections at module import time.
 */
export async function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid or missing environment variable: "MONGODB_URI"');
  }

  // If URI contains template placeholders (<username>, <password>), provide clear instructions
  if (uri.includes("<username>") || uri.includes("<password>")) {
    throw new Error(
      'MONGODB_URI contains placeholder values ("<username>" or "<password>"). Please replace them with your actual MongoDB Atlas username and password in Settings.'
    );
  }

  // If pointing to localhost, verify port is reachable before driver connects
  // to prevent driver stream crashes (MongoServerSelectionError / ECONNREFUSED)
  if (uri.includes("localhost") || uri.includes("127.0.0.1")) {
    const isOpen = await probeHost("127.0.0.1", 27017, 350);
    if (!isOpen) {
      throw new Error("Local MongoDB daemon is not running on 127.0.0.1:27017");
    }
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClient = client;
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

/**
 * Returns the connected MongoClient singleton instance.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return getMongoClientPromise();
}

/**
 * Returns a MongoDB Database instance using the singleton connection.
 * @param dbName Optional database name. Defaults to process.env.MONGODB_DB_NAME or "legal_metrology_db".
 */
export async function getMongoDatabase(dbName?: string): Promise<Db> {
  const connectedClient = await getMongoClientPromise();
  const name = dbName || process.env.MONGODB_DB_NAME || "legal_metrology_db";
  return connectedClient.db(name);
}

// Lazy Promise-like proxy to satisfy `import clientPromise from '@/lib/mongodb'`
// without executing any network connections at module import time
export const clientPromise: Promise<MongoClient> = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return getMongoClientPromise().then(onfulfilled, onrejected);
  },
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<MongoClient | TResult> {
    return getMongoClientPromise().catch(onrejected);
  },
  finally(onfinally?: (() => void) | null): Promise<MongoClient> {
    return getMongoClientPromise().finally(onfinally);
  },
  [Symbol.toStringTag]: "Promise",
} as unknown as Promise<MongoClient>;

export default clientPromise;
