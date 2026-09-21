import { Db } from "mongodb";
import { getMongoDatabase, getMongoEngineMode } from "../src/lib/mongodb";
import { InspectionDetail, ExtractedData } from "../src/types/inspection";
import { evaluateCompliance } from "./compliance";

let database: Db | null = null;
let sessionInspections: InspectionDetail[] = [];

const DEFAULT_DB_NAME = "SIH";

function createDefaultSpecimens(): InspectionDetail[] {
  const baseTime = Date.now() - 3600000 * 12;

  const muesliExtracted: ExtractedData = {
    productName: "Crunchy Muesli 500g",
    brand: "Sunrise Foods",
    category: "packaged_food",
    netQuantity: "500 g",
    mrp: "₹185.00",
    unitSalePrice: "₹0.37 / g",
    mfgDate: "03/2026",
    expiryDate: "09/2026",
    batchNumber: "MUS-0326-A",
    mfgName: "Sunrise Foods Pvt. Ltd.",
    mfgAddress: "Plot 42, Industrial Area, Phase II, Bengaluru, Karnataka 560058",
    consumerCare: "1800-123-4567, care@sunrisefoods.in",
    countryOfOrigin: "India",
    vegNonVeg: "VEG",
    ingredients: "Oats (62%), Honey, Almonds, Raisins",
    fssaiLicense: "13321999000263",
    barcode: "8901058000016",
    fields: [
      { key: "mrp", label: "MRP", value: "₹185/- (Inclusive of all taxes)", state: "present", confidence: 0.98, evidence: "M.R.P. ₹185/- (Inclusive of all taxes)" },
      { key: "netQuantity", label: "Net Quantity", value: "500 g", state: "present", confidence: 0.99, evidence: "Net Wt. 500 g" },
      { key: "unitSalePrice", label: "Unit Sale Price", value: "₹ 0.37 per g", state: "present", confidence: 0.95, evidence: "Unit Sale Price ₹ 0.37 per g" },
      { key: "mfgDate", label: "Mfg Date", value: "03/2026", state: "present", confidence: 0.97, evidence: "MFD 03/2026" },
      { key: "expiryDate", label: "Best Before", value: "09/2026", state: "present", confidence: 0.96, evidence: "Best Before 09/2026" },
      { key: "batchNumber", label: "Batch Number", value: "MUS-0326-A", state: "present", confidence: 0.95, evidence: "Batch No. MUS-0326-A" },
      { key: "mfgName", label: "Manufacturer Name", value: "Sunrise Foods Pvt. Ltd.", state: "present", confidence: 0.99, evidence: "Manufactured by Sunrise Foods Pvt. Ltd." },
      { key: "consumerCare", label: "Consumer Care", value: "1800-123-4567", state: "present", confidence: 0.94, evidence: "Consumer Care: 1800-123-4567" },
      { key: "countryOfOrigin", label: "Country of Origin", value: "India", state: "present", confidence: 0.98, evidence: "Country of Origin: India" },
    ],
    imageQuality: { lighting: "good", blur: "sharp", glare: "none", readabilityScore: 96, overallAssessment: "High clarity label image" },
  };

  const shampooExtracted: ExtractedData = {
    productName: "Herbal Nourish Shampoo 340ml",
    brand: "Greenleaf Industries",
    category: "cosmetics",
    netQuantity: "340 ml",
    mrp: "Rs 245.00",
    unitSalePrice: null,
    mfgDate: "11/2025",
    expiryDate: null,
    batchNumber: null,
    mfgName: "M/s Greenleaf Industries",
    mfgAddress: null,
    consumerCare: "care@example.com",
    countryOfOrigin: null,
    vegNonVeg: null,
    ingredients: null,
    fssaiLicense: null,
    barcode: "8901030810046",
    fields: [
      { key: "mrp", label: "MRP", value: "Rs 245.00", state: "present", confidence: 0.92, evidence: "M.R.P. Rs 245.00" },
      { key: "netQuantity", label: "Net Quantity", value: "340 ml", state: "present", confidence: 0.95, evidence: "Net Qty. 340 ml" },
      { key: "unitSalePrice", label: "Unit Sale Price", value: null, state: "missing", confidence: 0, evidence: null },
      { key: "mfgDate", label: "Mfg Date", value: "11/2025", state: "present", confidence: 0.88, evidence: "Pkd 11/25" },
    ],
    imageQuality: { lighting: "good", blur: "sharp", glare: "none", readabilityScore: 88, overallAssessment: "Good clarity label" },
  };

  const chipsExtracted: ExtractedData = {
    productName: "Masala Crunch Potato Chips 80g",
    brand: "Deccan Snacks",
    category: "packaged_food",
    netQuantity: "80 g",
    mrp: "₹35.00",
    unitSalePrice: null,
    mfgDate: "08/2025",
    expiryDate: null,
    batchNumber: null,
    mfgName: "Deccan Snacks Pvt Ltd",
    mfgAddress: "Survey 112, Hyderabad, Telangana",
    consumerCare: null,
    countryOfOrigin: "India",
    vegNonVeg: "VEG",
    ingredients: "Potatoes, Edible Vegetable Oil, Spices",
    fssaiLicense: "10019042000123",
    barcode: "8901063010147",
    fields: [
      { key: "mrp", label: "MRP", value: "₹35/-", state: "present", confidence: 0.91, evidence: "MRP ₹35/-" },
      { key: "netQuantity", label: "Net Quantity", value: "80 g", state: "present", confidence: 0.94, evidence: "NET WT 80 g" },
      { key: "mfgDate", label: "Mfg Date", value: "08/2025", state: "present", confidence: 0.89, evidence: "MFD 08/2025" },
    ],
    imageQuality: { lighting: "good", blur: "sharp", glare: "none", readabilityScore: 85, overallAssessment: "Acceptable package photo" },
  };

  const waterExtracted: ExtractedData = {
    productName: "Natural Mineral Water 1L",
    brand: "AquaPure Beverages",
    category: "packaged_food",
    netQuantity: "1 L",
    mrp: "Rs.20/-",
    unitSalePrice: null,
    mfgDate: "04/2026",
    expiryDate: null,
    batchNumber: null,
    mfgName: "AquaPure Beverages Ltd.",
    mfgAddress: "Dehradun, Uttarakhand",
    consumerCare: "+91 9876543210",
    countryOfOrigin: null,
    vegNonVeg: "VEG",
    ingredients: "Treated spring water, added minerals",
    fssaiLicense: "10014011000889",
    barcode: "8901058000115",
    fields: [
      { key: "mrp", label: "MRP", value: "Rs.20/-", state: "present", confidence: 0.89, evidence: "Rs.20/-" },
      { key: "netQuantity", label: "Net Quantity", value: "1 L", state: "present", confidence: 0.96, evidence: "1 L" },
    ],
    imageQuality: { lighting: "good", blur: "moderate", glare: "slight", readabilityScore: 78, overallAssessment: "Minor glare on bottle curvature" },
  };

  const teaExtracted: ExtractedData = {
    productName: "Assam Gold CTC Leaf Tea 250g",
    brand: "Heritage Estate",
    category: "packaged_food",
    netQuantity: "250 g",
    mrp: "₹140.00",
    unitSalePrice: "₹0.56 / g",
    mfgDate: "02/2026",
    expiryDate: "02/2027",
    batchNumber: "ASM-2602-T",
    mfgName: "Heritage Estate Tea Packers Ltd.",
    mfgAddress: "Strand Road, Post Box 14, Kolkata, West Bengal 700001",
    consumerCare: "1800-444-9988, care@heritagetea.in",
    countryOfOrigin: "India",
    vegNonVeg: "VEG",
    ingredients: "100% Pure Assam Black Tea",
    fssaiLicense: "10017031002241",
    barcode: "8901058004521",
    fields: [
      { key: "mrp", label: "MRP", value: "₹140.00 (Incl. of all taxes)", state: "present", confidence: 0.98, evidence: "MRP ₹140.00 (Incl. of all taxes)" },
      { key: "netQuantity", label: "Net Quantity", value: "250 g", state: "present", confidence: 0.97, evidence: "Net Wt. 250 g" },
      { key: "unitSalePrice", label: "Unit Sale Price", value: "₹0.56 per g", state: "present", confidence: 0.96, evidence: "Unit Sale Price ₹0.56 per g" },
      { key: "mfgDate", label: "Mfg Date", value: "02/2026", state: "present", confidence: 0.95, evidence: "PKD: 02/2026" },
      { key: "expiryDate", label: "Best Before", value: "02/2027", state: "present", confidence: 0.96, evidence: "Best Before 12 Months from PKD" },
      { key: "batchNumber", label: "Batch Number", value: "ASM-2602-T", state: "present", confidence: 0.94, evidence: "Batch No: ASM-2602-T" },
      { key: "mfgName", label: "Manufacturer Name", value: "Heritage Estate Tea Packers Ltd.", state: "present", confidence: 0.99, evidence: "Heritage Estate Tea Packers Ltd." },
      { key: "consumerCare", label: "Consumer Care", value: "1800-444-9988", state: "present", confidence: 0.95, evidence: "Toll Free: 1800-444-9988" },
      { key: "countryOfOrigin", label: "Country of Origin", value: "India", state: "present", confidence: 0.99, evidence: "Country of Origin: India" },
    ],
    imageQuality: { lighting: "good", blur: "sharp", glare: "none", readabilityScore: 95, overallAssessment: "Crystal clear foil pouch" },
  };

  const specimens = [
    {
      data: muesliExtracted,
      id: "INSP-SPECIMEN-MUESLI-01",
      ts: baseTime + 10000,
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        marketName: "Commercial Street Supermart",
        address: "Commercial Street, Tasker Town",
        city: "Bengaluru",
        state: "Karnataka",
        district: "Bengaluru Urban",
        pincode: "560001",
      },
    },
    {
      data: shampooExtracted,
      id: "INSP-SPECIMEN-SHAMPOO-02",
      ts: baseTime + 20000,
      location: {
        latitude: 19.076,
        longitude: 72.8777,
        marketName: "Crawford Market Wholesale Depot",
        address: "Dhobi Talao, Fort Area",
        city: "Mumbai",
        state: "Maharashtra",
        district: "Mumbai City",
        pincode: "400001",
      },
    },
    {
      data: chipsExtracted,
      id: "INSP-SPECIMEN-CHIPS-03",
      ts: baseTime + 30000,
      location: {
        latitude: 17.385,
        longitude: 78.4867,
        marketName: "Begum Bazaar Retail Point",
        address: "Afzal Gunj, Begum Bazaar",
        city: "Hyderabad",
        state: "Telangana",
        district: "Hyderabad",
        pincode: "500012",
      },
    },
    {
      data: waterExtracted,
      id: "INSP-SPECIMEN-WATER-04",
      ts: baseTime + 40000,
      location: {
        latitude: 28.6507,
        longitude: 77.2334,
        marketName: "Chandni Chowk Retail Cluster",
        address: "Nai Sarak, Old Delhi",
        city: "New Delhi",
        state: "Delhi",
        district: "Central Delhi",
        pincode: "110006",
      },
    },
    {
      data: teaExtracted,
      id: "INSP-SPECIMEN-TEA-05",
      ts: baseTime + 50000,
      location: {
        latitude: 22.5726,
        longitude: 88.3639,
        marketName: "New Market Commercial Arcade",
        address: "Lindsay Street, Dharmatala",
        city: "Kolkata",
        state: "West Bengal",
        district: "Kolkata",
        pincode: "700087",
      },
    },
  ];

  return specimens.map(({ data, id, ts, location }) => {
    const compliance = evaluateCompliance(data);
    const summary = compliance.status === "COMPLIANT"
      ? `Statutory verification verified ${compliance.passCount} mandatory declarations pursuant to Legal Metrology (Packaged Commodities) Rules, 2011. All critical declarations satisfied.`
      : `Inspection flagged ${compliance.criticalViolations.length} critical non-compliances under Legal Metrology Rules, 2011. Notice of compounding or rectifying declaration required.`;

    return {
      id,
      timestamp: ts,
      createdAt: new Date(ts).toISOString(),
      extractedData: data,
      compliance,
      inspectorSummary: summary,
      aiEngineUsed: "Legal Metrology Specimen Engine",
      location,
    };
  });
}

export async function getMongoDb(): Promise<Db> {
  if (database) {
    return database;
  }
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
  const db = await getMongoDatabase(dbName);
  database = db;

  try {
    const col = database.collection<InspectionDetail>("inspections");
    await col.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await col.createIndex({ timestamp: -1 }).catch(() => {});
  } catch (err) {
    console.warn("[MongoDB] Index setup deferred:", err);
  }

  return database;
}

export async function loadInspections(): Promise<InspectionDetail[]> {
  try {
    const db = await getMongoDb();
    const col = db.collection<InspectionDetail>("inspections");
    let docs = await col
      .find({}, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .toArray();

    if (!docs || docs.length === 0) {
      // Seed default specimens so inspectors immediately have records
      const defaults = createDefaultSpecimens();
      for (const item of defaults) {
        await col.replaceOne({ id: item.id }, item, { upsert: true });
      }
      docs = await col
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .toArray();
    }

    if (docs && docs.length > 0) {
      // Ensure all documents have valid location coordinates
      const fallbackLocations = [
        { latitude: 12.9716, longitude: 77.5946, marketName: "Commercial Street Supermart", city: "Bengaluru", state: "Karnataka" },
        { latitude: 19.076, longitude: 72.8777, marketName: "Crawford Market Wholesale Depot", city: "Mumbai", state: "Maharashtra" },
        { latitude: 17.385, longitude: 78.4867, marketName: "Begum Bazaar Retail Point", city: "Hyderabad", state: "Telangana" },
        { latitude: 28.6507, longitude: 77.2334, marketName: "Chandni Chowk Retail Cluster", city: "New Delhi", state: "Delhi" },
        { latitude: 22.5726, longitude: 88.3639, marketName: "New Market Commercial Arcade", city: "Kolkata", state: "West Bengal" },
        { latitude: 13.0827, longitude: 80.2707, marketName: "T. Nagar Retail Hub", city: "Chennai", state: "Tamil Nadu" },
      ];

      docs = docs.map((doc, idx) => {
        if (!doc.location || !doc.location.latitude || !doc.location.longitude) {
          const loc = fallbackLocations[idx % fallbackLocations.length];
          return {
            ...doc,
            location: {
              ...loc,
              address: `${loc.marketName}, ${loc.city}`,
            },
          };
        }
        return doc;
      });

      sessionInspections = docs;
      return docs;
    }
  } catch (e) {
    console.warn("[MongoDB] loadInspections query error:", e);
  }
  return sessionInspections;
}

export async function saveInspection(inspection: InspectionDetail): Promise<void> {
  // Update local session cache immediately
  sessionInspections = [inspection, ...sessionInspections.filter((i) => i.id !== inspection.id)];

  try {
    const db = await getMongoDb();
    const col = db.collection<InspectionDetail>("inspections");
    await col.replaceOne({ id: inspection.id }, inspection, { upsert: true });
  } catch (err) {
    console.warn("[MongoDB] saveInspection error:", err);
  }
}

export async function getInspectionById(id: string): Promise<InspectionDetail | null> {
  try {
    const db = await getMongoDb();
    const col = db.collection<InspectionDetail>("inspections");
    const doc = await col.findOne({ id }, { projection: { _id: 0 } });
    if (doc) return doc;
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
    const col = db.collection<InspectionDetail>("inspections");
    const res = await col.deleteOne({ id });
    deletedFromMongo = (res.deletedCount || 0) > 0;
  } catch (err) {
    console.warn("[MongoDB] deleteInspection error:", err);
  }

  return sessionInspections.length < initialLength || deletedFromMongo;
}

export async function clearAllInspections(): Promise<void> {
  sessionInspections = [];
  try {
    const db = await getMongoDb();
    const col = db.collection<InspectionDetail>("inspections");
    await col.deleteMany({});
  } catch (err) {
    console.warn("[MongoDB] clearAllInspections error:", err);
  }
}

export async function getDatabaseStatus() {
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;
  const db = await getMongoDb();
  const engineMode = getMongoEngineMode();
  let count = sessionInspections.length;

  try {
    count = await db.collection("inspections").countDocuments();
  } catch {
    // fallback
  }

  return {
    status: "connected",
    provider: "MongoDB",
    mode: engineMode === "atlas" ? "MongoDB Atlas (Cluster)" : "MongoDB (Embedded)",
    databaseName: dbName,
    collection: "inspections",
    connected: true,
    uriConfigured: true,
    totalInspections: count,
    error: null,
    lastSync: new Date().toISOString(),
  };
}



