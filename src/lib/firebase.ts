import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { InspectionDetail } from "../types/inspection";

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as mandated by Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or network connectivity.");
    }
    return false;
  }
}

// Safe Firestore Inspections Service
export async function syncInspectionToFirestore(inspection: InspectionDetail): Promise<void> {
  const docPath = `inspections/${inspection.id}`;
  try {
    const payload = {
      id: inspection.id,
      timestamp: inspection.timestamp,
      createdAt: inspection.createdAt || new Date().toISOString(),
      productName: inspection.extractedData?.productName || "Unknown Product",
      brand: inspection.extractedData?.brand || "",
      category: inspection.extractedData?.category || "general",
      complianceStatus: inspection.compliance?.status || "UNKNOWN",
      complianceScore: inspection.compliance?.score || 0,
      criticalViolationsCount: inspection.compliance?.criticalViolations?.length || 0,
      imageUrl: inspection.imageUrl || "",
      inspectorSummary: inspection.inspectorSummary || "",
      aiEngineUsed: inspection.aiEngineUsed || "gemini",
      dataJson: JSON.stringify(inspection),
    };
    await setDoc(doc(db, "inspections", inspection.id), payload);
  } catch (error) {
    console.warn(`Could not sync to Firestore ${docPath} (falling back to local):`, error);
  }
}

export async function fetchInspectionsFromFirestore(): Promise<InspectionDetail[]> {
  try {
    const q = query(collection(db, "inspections"), orderBy("timestamp", "desc"), limit(50));
    const snapshot = await getDocs(q);
    const results: InspectionDetail[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.dataJson) {
        try {
          results.push(JSON.parse(data.dataJson));
        } catch {
          // ignore corrupted single record
        }
      }
    });
    return results;
  } catch (error) {
    console.warn("Firestore query failed, using local/API store:", error);
    return [];
  }
}

export async function deleteInspectionFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "inspections", id));
  } catch (error) {
    console.warn("Firestore delete failed:", error);
  }
}

// Initiate non-blocking connection probe
testFirestoreConnection().catch(() => {});
