import { Db } from "mongodb";
import { getMongoDatabase } from "../src/lib/mongodb";
import { InspectionDetail } from "../src/types/inspection";

let database: Db | null = null;
let connectionError: Error | null = null;
let lastConnectAttempt = 0;
const RETRY_INTERVAL_MS = 10000;
let sessionInspections: InspectionDetail[] = [];

const DEFAULT_DB_NAME = "legal_metrology_db";

export async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }
  if (database) {
    return database;
  }
  // If recent connection attempt failed, do not block or retry immediately
  if (connectionError && Date.now() - lastConnectAttempt < RETRY_INTERVAL_MS) {
    return null;
  }

  lastConnectAttempt = Date.now();
  try {
    const db = await getMongoDatabase(process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME);
    database = db;

    // Create index on id and timestamp
    const col = database.collection<InspectionDetail>("inspections");
    await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await col.createIndex({ timestamp: -1 }).catch(() => {});

    connectionError = null;
    return database;
  } catch (err: any) {
    connectionError = err;
    return null;
  }
}

export async function loadInspections(): Promise<InspectionDetail[]> {
  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection<InspectionDetail>("inspections");
      const docs = await col
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .toArray();
      if (docs && docs.length > 0) {
        sessionInspections = docs;
        return docs;
      }
    }
  } catch (e) {
    console.warn("[MongoDB] loadInspections fallback:", e);
  }
  return sessionInspections;
}

export async function saveInspection(inspection: InspectionDetail): Promise<void> {
  // Update local session cache immediately
  sessionInspections = [inspection, ...sessionInspections.filter((i) => i.id !== inspection.id)];

  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection<InspectionDetail>("inspections");
      await col.replaceOne({ id: inspection.id }, inspection, { upsert: true });
    }
  } catch (err) {
    console.warn("[MongoDB] saveInspection error:", err);
  }
}

export async function getInspectionById(id: string): Promise<InspectionDetail | null> {
  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection<InspectionDetail>("inspections");
      const doc = await col.findOne({ id }, { projection: { _id: 0 } });
      if (doc) return doc;
    }
  } catch (err) {
    console.warn("[MongoDB] getInspectionById error:", err);
  }
  return sessionInspections.find((i) => i.id === id) || null;
}

export async function deleteInspection(id: string): Promise<boolean> {
  const initialLength = sessionInspections.length;
  sessionInspections = sessionInspections.filter((i) => i.id !== id);
  let deletedFromMongo = false;

  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection<InspectionDetail>("inspections");
      const res = await col.deleteOne({ id });
      deletedFromMongo = (res.deletedCount || 0) > 0;
    }
  } catch (err) {
    console.warn("[MongoDB] deleteInspection error:", err);
  }

  return sessionInspections.length < initialLength || deletedFromMongo;
}

export async function clearAllInspections(): Promise<void> {
  sessionInspections = [];
  try {
    const db = await getMongoDb();
    if (db) {
      const col = db.collection<InspectionDetail>("inspections");
      await col.deleteMany({});
    }
  } catch (err) {
    console.warn("[MongoDB] clearAllInspections error:", err);
  }
}

export async function getDatabaseStatus() {
  const hasUri = Boolean(process.env.MONGODB_URI);
  const db = await getMongoDb();
  const isConnected = Boolean(db);
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
  let count = sessionInspections.length;

  if (db) {
    try {
      count = await db.collection("inspections").countDocuments();
    } catch {
      // count fallback
    }
  }

  return {
    status: isConnected ? "connected" : hasUri ? "connecting" : "ready_for_uri",
    provider: "MongoDB",
    databaseName: dbName,
    collection: "inspections",
    connected: isConnected,
    uriConfigured: hasUri,
    totalInspections: count,
    error: connectionError ? connectionError.message : null,
    lastSync: new Date().toISOString(),
  };
}

