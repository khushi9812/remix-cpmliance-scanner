import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { InspectionDetail } from "../src/types/inspection";

const require = createRequire(import.meta.url);

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "inspections.json");
const SQLITE_FILE = path.join(DATA_DIR, "inspections.db");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// SQLite Table Initialization
// Table: inspections (Stores full JSON snapshot alongside indexed search columns)
// ---------------------------------------------------------------------------
let sqliteDb: any = null;

function getSqliteDatabase() {
  if (sqliteDb) return sqliteDb;
  try {
    ensureDirectoryExists();
    // Dynamic load of native node:sqlite
    const { DatabaseSync } = require("node:sqlite");
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        product_name TEXT,
        brand TEXT,
        category TEXT,
        compliance_status TEXT,
        compliance_score INTEGER,
        critical_violations_count INTEGER,
        image_url TEXT,
        data_json TEXT,
        created_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_inspections_timestamp ON inspections(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(compliance_status);
    `);

    // Seed/sync any JSON records to SQLite table
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const items: InspectionDetail[] = JSON.parse(raw);
        if (Array.isArray(items)) {
          const insertStmt = sqliteDb.prepare(`
            INSERT OR REPLACE INTO inspections (
              id, timestamp, product_name, brand, category,
              compliance_status, compliance_score, critical_violations_count,
              image_url, data_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const item of items) {
            insertStmt.run(
              item.id,
              item.timestamp,
              item.extractedData?.productName || "Unknown Product",
              item.extractedData?.brand || "",
              item.extractedData?.category || "general",
              item.compliance?.status || "UNKNOWN",
              item.compliance?.score || 0,
              item.compliance?.criticalViolations?.length || 0,
              item.imageUrl || "",
              JSON.stringify(item),
              item.createdAt || new Date().toISOString()
            );
          }
        }
      } catch {
        // ignore seed error
      }
    }
  } catch (err: any) {
    console.info("SQLite database initialization notice:", err?.message || err);
  }
  return sqliteDb;
}

let cachedInspections: InspectionDetail[] | null = null;

export function loadInspections(): InspectionDetail[] {
  ensureDirectoryExists();
  const db = getSqliteDatabase();
  if (cachedInspections) {
    return cachedInspections;
  }
  if (db) {
    try {
      const stmt = db.prepare("SELECT data_json FROM inspections ORDER BY timestamp DESC");
      const rows = stmt.all();
      if (rows && rows.length > 0) {
        cachedInspections = rows.map((r: any) => JSON.parse(r.data_json));
        return cachedInspections || [];
      }
    } catch (e) {
      console.warn("SQLite load fallback to JSON file:", e);
    }
  }

  // Fallback to JSON file
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      cachedInspections = JSON.parse(raw);
      return cachedInspections || [];
    } catch (e) {
      console.warn("Failed to parse inspections.json, starting fresh", e);
    }
  }
  cachedInspections = [];
  return cachedInspections;
}

export function saveInspection(inspection: InspectionDetail): void {
  const current = loadInspections();
  // prepend new scan
  const updated = [inspection, ...current.filter((i) => i.id !== inspection.id)];
  cachedInspections = updated;
  ensureDirectoryExists();

  // Save to SQLite
  const db = getSqliteDatabase();
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO inspections (
          id, timestamp, product_name, brand, category,
          compliance_status, compliance_score, critical_violations_count,
          image_url, data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        inspection.id,
        inspection.timestamp,
        inspection.extractedData.productName || "Unknown Product",
        inspection.extractedData.brand || "",
        inspection.extractedData.category || "general",
        inspection.compliance.status,
        inspection.compliance.score,
        inspection.compliance.criticalViolations.length,
        inspection.imageUrl,
        JSON.stringify(inspection),
        inspection.createdAt
      );
    } catch (e) {
      console.warn("SQLite save error:", e);
    }
  }

  // Dual persistent write to inspections.json
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to inspections.json", e);
  }
}

export function getInspectionById(id: string): InspectionDetail | null {
  const db = getSqliteDatabase();
  if (db) {
    try {
      const stmt = db.prepare("SELECT data_json FROM inspections WHERE id = ?");
      const row: any = stmt.get(id);
      if (row?.data_json) {
        return JSON.parse(row.data_json);
      }
    } catch {
      // fallback
    }
  }
  const all = loadInspections();
  return all.find((i) => i.id === id) || null;
}

export function deleteInspection(id: string): boolean {
  const db = getSqliteDatabase();
  if (db) {
    try {
      const stmt = db.prepare("DELETE FROM inspections WHERE id = ?");
      stmt.run(id);
    } catch {
      // ignore
    }
  }
  const all = loadInspections();
  const filtered = all.filter((i) => i.id !== id);
  if (filtered.length === all.length) return false;
  cachedInspections = filtered;
  ensureDirectoryExists();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}
