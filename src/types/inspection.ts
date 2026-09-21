export interface DeclarationField {
  key: string;
  label: string;
  value: string | null;
  evidence: string | null;
  confidence: number;
  state: "present" | "unreadable" | "missing";
  boundingBox?: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null;
}

export interface ImageQualityIndicators {
  lighting: "good" | "dim" | "overexposed";
  blur: "sharp" | "moderate" | "blurry";
  glare: "none" | "slight" | "heavy";
  readabilityScore: number; // 0 to 100
  overallAssessment: string;
}

export interface ExtractedData {
  productName: string | null;
  brand: string | null;
  category: string;
  netQuantity: string | null;
  mrp: string | null;
  unitSalePrice: string | null;
  mfgDate: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  mfgName: string | null;
  mfgAddress: string | null;
  consumerCare: string | null;
  countryOfOrigin: string | null;
  vegNonVeg: "VEG" | "NON_VEG" | "NOT_APPLICABLE" | "UNKNOWN" | null;
  ingredients: string | null;
  fssaiLicense: string | null;
  barcode: string | null;
  fields: DeclarationField[];
  imageQuality: ImageQualityIndicators;
  notes?: string | null;
}

export interface RuleEvaluationResult {
  ruleId: string;
  name: string;
  section: string;
  statute: string;
  weight: number;
  critical: boolean;
  status: "PASS" | "FAIL" | "REVIEW" | "NOT_APPLICABLE";
  observed: string;
  required: string;
  scoreContribution: number;
  penaltyNote?: string;
  defectType?: "ABSENCE" | "FORMAT_DEFECT" | "CALCULATION_MISMATCH" | "UNREADABLE" | "NONE";
}

export interface ComplianceSummary {
  status: "COMPLIANT" | "PARTIAL_COMPLIANT" | "NON_COMPLIANT";
  score: number; // 0 to 100
  passedWeight: number;
  scoreableWeight: number;
  passCount: number;
  failCount: number;
  reviewCount: number;
  criticalViolations: string[];
  rules: RuleEvaluationResult[];
}

export interface InspectionLocation {
  latitude: number;
  longitude: number;
  marketName?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
}

export interface InspectionDetail {
  id: string;
  timestamp: number;
  createdAt: string;
  imageFileName: string;
  imageUrl: string;
  imageSizeKb: number;
  imageWidth?: number;
  imageHeight?: number;
  extractedData: ExtractedData;
  compliance: ComplianceSummary;
  inspectorSummary: string;
  aiEngineUsed: string;
  location?: InspectionLocation;
}

export interface LegalMetrologyDeclarationRule {
  id: string;
  key: keyof ExtractedData;
  name: string;
  statute: string;
  description: string;
  getValue: (data: ExtractedData) => string | null | undefined;
}

export const LEGAL_METROLOGY_DECLARATIONS: LegalMetrologyDeclarationRule[] = [
  {
    id: "mrp",
    key: "mrp",
    name: "Maximum Retail Price (MRP)",
    statute: "Rule 6(1)(e)",
    description: "Inclusive of all taxes in Indian Rupees (₹)",
    getValue: (data) => data.mrp,
  },
  {
    id: "netQuantity",
    key: "netQuantity",
    name: "Net Quantity",
    statute: "Rule 6(1)(d)",
    description: "Standard metric unit of weight (g/kg) or volume (ml/l)",
    getValue: (data) => data.netQuantity,
  },
  {
    id: "unitSalePrice",
    key: "unitSalePrice",
    name: "Unit Sale Price (USP)",
    statute: "Rule 6(11)",
    description: "Per gram/ml calculation for multi-unit or retail packages",
    getValue: (data) => data.unitSalePrice,
  },
  {
    id: "mfgDate",
    key: "mfgDate",
    name: "Month & Year of Mfg / Packing",
    statute: "Rule 6(1)(c)",
    description: "MM/YYYY or explicit manufacturing stamp",
    getValue: (data) => data.mfgDate,
  },
  {
    id: "expiryDate",
    key: "expiryDate",
    name: "Expiry Date / Best Before",
    statute: "Rule 6(1)(c) & FSSAI",
    description: "Consumer shelf-life duration or explicit expiry date",
    getValue: (data) => data.expiryDate,
  },
  {
    id: "batchNumber",
    key: "batchNumber",
    name: "Batch / Lot / Code Number",
    statute: "Rule 6(1)(e)",
    description: "Production batch or lot identification code",
    getValue: (data) => data.batchNumber,
  },
  {
    id: "mfgName",
    key: "mfgName",
    name: "Manufacturer / Packer / Importer Name",
    statute: "Rule 6(1)(a)",
    description: "Entity responsible for manufacturing or packing",
    getValue: (data) => data.mfgName,
  },
  {
    id: "mfgAddress",
    key: "mfgAddress",
    name: "Registered Address & PIN Code",
    statute: "Rule 6(1)(a)",
    description: "Full physical premises address with 6-digit PIN code",
    getValue: (data) => data.mfgAddress,
  },
  {
    id: "consumerCare",
    key: "consumerCare",
    name: "Consumer Care Helpline & Email",
    statute: "Rule 6(2)",
    description: "Name/designation, telephone, email and postal address",
    getValue: (data) => data.consumerCare,
  },
  {
    id: "countryOfOrigin",
    key: "countryOfOrigin",
    name: "Country of Origin",
    statute: "Rule 6(1)(h)",
    description: "Mandatory country declaration for domestic & imported commodities",
    getValue: (data) => data.countryOfOrigin,
  },
  {
    id: "vegNonVeg",
    key: "vegNonVeg",
    name: "Veg / Non-Veg Indicator Logo",
    statute: "FSSAI Reg. 2.2.2",
    description: "Green filled circle or brown triangle inside square",
    getValue: (data) =>
      data.vegNonVeg
        ? `${data.vegNonVeg} Symbol`
        : data.ingredients
        ? `Ingredients: ${data.ingredients.slice(0, 32)}…`
        : null,
  },
  {
    id: "fssaiLicense",
    key: "fssaiLicense",
    name: "FSSAI License / BIS Mark",
    statute: "FSSAI Act Sec. 31",
    description: "14-digit FSSAI registration number or BIS certification mark",
    getValue: (data) => data.fssaiLicense,
  },
];
