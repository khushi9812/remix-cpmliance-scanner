import { MongoClient, MongoClientOptions, Db, Collection } from "mongodb";
import net from "net";
import fs from "fs";
import path from "path";

export const DEFAULT_MONGODB_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/SIH?retryWrites=true&w=majority";

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoClient: MongoClient | undefined;
  var _embeddedDb: any | undefined;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "mongodb-store.json");

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function loadEmbeddedStore(): Record<string, any[]> {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { inspections: [] };
}

function saveEmbeddedStore(store: Record<string, any[]>): void {
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[MongoDB Embedded] Failed to persist data:", err);
  }
}

class EmbeddedCursor {
  private items: any[];
  private sortFn: ((a: any, b: any) => number) | null = null;
  private limitCount = Infinity;
  private skipCount = 0;

  constructor(items: any[]) {
    this.items = items;
  }

  sort(sortSpec: Record<string, 1 | -1>): this {
    const keys = Object.keys(sortSpec);
    if (keys.length > 0) {
      const key = keys[0];
      const direction = sortSpec[key];
      this.sortFn = (a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return valA > valB ? direction : -direction;
      };
    }
    return this;
  }

  limit(n: number): this {
    this.limitCount = n;
    return this;
  }

  skip(n: number): this {
    this.skipCount = n;
    return this;
  }

  project(_proj: any): this {
    return this;
  }

  async toArray(): Promise<any[]> {
    let result = [...this.items];
    if (this.sortFn) {
      result.sort(this.sortFn);
    }
    if (this.skipCount > 0) {
      result = result.slice(this.skipCount);
    }
    if (this.limitCount < Infinity) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }
}

class EmbeddedCollection {
  private collectionName: string;
  private store: Record<string, any[]>;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.store = loadEmbeddedStore();
    if (!this.store[collectionName]) {
      this.store[collectionName] = [];
    }
  }

  private getItems(): any[] {
    if (!this.store[this.collectionName]) {
      this.store[this.collectionName] = [];
    }
    return this.store[this.collectionName];
  }

  private matches(doc: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [key, expected] of Object.entries(query)) {
      if (doc[key] !== expected) return false;
    }
    return true;
  }

  async createIndex(_keys: any, _options?: any): Promise<string> {
    return "idx_created";
  }

  find(query: any = {}, _options?: any): EmbeddedCursor {
    const matched = this.getItems().filter((item) => this.matches(item, query));
    return new EmbeddedCursor(matched);
  }

  async findOne(query: any = {}, _options?: any): Promise<any | null> {
    const items = this.getItems();
    const found = items.find((item) => this.matches(item, query));
    return found ? { ...found } : null;
  }

  async replaceOne(query: any, doc: any, options: { upsert?: boolean } = {}): Promise<any> {
    const items = this.getItems();
    const idx = items.findIndex((item) => this.matches(item, query));
    if (idx !== -1) {
      items[idx] = { ...doc };
      saveEmbeddedStore(this.store);
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
    } else if (options.upsert) {
      items.push({ ...doc });
      saveEmbeddedStore(this.store);
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
    }
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  async insertOne(doc: any): Promise<any> {
    const items = this.getItems();
    items.push({ ...doc });
    saveEmbeddedStore(this.store);
    return { acknowledged: true, insertedId: doc._id || doc.id };
  }

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    const items = this.getItems();
    const idx = items.findIndex((item) => this.matches(item, query));
    if (idx !== -1) {
      items.splice(idx, 1);
      saveEmbeddedStore(this.store);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query: any): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const count = this.getItems().length;
      this.store[this.collectionName] = [];
      saveEmbeddedStore(this.store);
      return { deletedCount: count };
    }
    const initial = this.getItems().length;
    this.store[this.collectionName] = this.getItems().filter((item) => !this.matches(item, query));
    const deletedCount = initial - this.store[this.collectionName].length;
    saveEmbeddedStore(this.store);
    return { deletedCount };
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.getItems().filter((item) => this.matches(item, query)).length;
  }
}

class EmbeddedDb {
  public databaseName: string;
  private collections = new Map<string, EmbeddedCollection>();

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }

  collection<T = any>(name: string): Collection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new EmbeddedCollection(name));
    }
    return this.collections.get(name) as unknown as Collection<T>;
  }
}

let activeDatabaseMode: "atlas" | "embedded" = "embedded";

function probeHost(host: string, port: number, timeoutMs = 350): Promise<boolean> {
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

function isValidAtlasUri(uri: string): boolean {
  if (!uri) return false;
  if (uri.includes("<username>") || uri.includes("<password>")) return false;
  return uri.startsWith("mongodb+srv://") || uri.startsWith("mongodb://");
}

/**
 * Initializes or retrieves the active MongoClient promise singleton lazily.
 */
export async function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

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

export async function getMongoClient(): Promise<MongoClient> {
  return getMongoClientPromise();
}

/**
 * Returns an active MongoDB Database instance.
 * Connects to MongoDB Atlas if valid credentials are provided,
 * or transparently uses the embedded persistent MongoDB engine for SIH.
 */
export async function getMongoDatabase(dbName?: string): Promise<Db> {
  const name = dbName || process.env.MONGODB_DB_NAME || "SIH";
  const uri = process.env.MONGODB_URI || "";

  // Attempt real MongoDB Atlas / server connection if valid non-placeholder URI is given
  if (isValidAtlasUri(uri)) {
    try {
      if (uri.includes("localhost") || uri.includes("127.0.0.1")) {
        const isOpen = await probeHost("127.0.0.1", 27017, 300);
        if (!isOpen) {
          throw new Error("Local MongoDB daemon not running");
        }
      }
      const client = await getMongoClientPromise();
      const db = client.db(name);
      activeDatabaseMode = "atlas";
      return db;
    } catch (err: any) {
      console.warn(`[MongoDB Atlas] Remote connection deferred (${err.message}). Using persistent SIH engine.`);
    }
  }

  // Use persistent embedded MongoDB engine
  activeDatabaseMode = "embedded";
  if (!global._embeddedDb || global._embeddedDb.databaseName !== name) {
    global._embeddedDb = new EmbeddedDb(name);
  }
  return global._embeddedDb as unknown as Db;
}

export function getMongoEngineMode(): "atlas" | "embedded" {
  return activeDatabaseMode;
}

// Lazy Promise-like proxy to satisfy `import clientPromise from '@/lib/mongodb'`
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
