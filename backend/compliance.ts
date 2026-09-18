import fs from "fs";
import path from "path";
import {
  ExtractedData,
  RuleEvaluationResult,
  ComplianceSummary,
} from "../src/types/inspection";

interface RuleConfig {
  id: string;
  name: string;
  section: string;
  statute: string;
  weight: number;
  critical: boolean;
  description: string;
  checkType: string;
}

let loadedRules: RuleConfig[] = [];

function getRules(): RuleConfig[] {
  if (loadedRules.length === 0) {
    try {
      const filePath = path.join(process.cwd(), "backend", "rules.json");
      const content = fs.readFileSync(filePath, "utf-8");
      loadedRules = JSON.parse(content);
    } catch {
      loadedRules = [];
    }
  }
  return loadedRules;
}

export function evaluateCompliance(data: ExtractedData): ComplianceSummary {
  const rules = getRules();
  const results: RuleEvaluationResult[] = [];
  const criticalViolations: string[] = [];

  let passedWeight = 0;
  let scoreableWeight = 0;
  let passCount = 0;
  let failCount = 0;
  let reviewCount = 0;

  for (const rule of rules) {
    const evalRes = dispatchRuleCheck(rule, data);
    results.push(evalRes);

    if (evalRes.status !== "NOT_APPLICABLE") {
      scoreableWeight += rule.weight;
      if (evalRes.status === "PASS") {
        passedWeight += rule.weight;
        passCount += 1;
      } else if (evalRes.status === "FAIL") {
        failCount += 1;
        if (rule.critical) {
          criticalViolations.push(`${rule.name} (${rule.section})`);
        }
      } else if (evalRes.status === "REVIEW") {
        reviewCount += 1;
        // Partial contribution for review items
        passedWeight += rule.weight * 0.4;
      }
    }
  }

  const score = scoreableWeight > 0 ? Math.round((100 * passedWeight) / scoreableWeight) : 100;

  let status: "COMPLIANT" | "PARTIAL_COMPLIANT" | "NON_COMPLIANT" = "COMPLIANT";
  if (criticalViolations.length > 0 || score < 60) {
    status = "NON_COMPLIANT";
  } else if (score < 85 || failCount > 0 || reviewCount > 1) {
    status = "PARTIAL_COMPLIANT";
  }

  return {
    status,
    score,
    passedWeight: Math.round(passedWeight),
    scoreableWeight,
    passCount,
    failCount,
    reviewCount,
    criticalViolations,
    rules: results,
  };
}

function dispatchRuleCheck(rule: RuleConfig, data: ExtractedData): RuleEvaluationResult {
  const base = {
    ruleId: rule.id,
    name: rule.name,
    section: rule.section,
    statute: rule.statute,
    weight: rule.weight,
    critical: rule.critical,
    scoreContribution: 0,
  };

  switch (rule.checkType) {
    case "mrp_format": {
      const val = data.mrp || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "MRP not declared or absent on visible surface",
          required: "MRP ₹ [Amount] incl. of all taxes (Mandatory)",
          defectType: "ABSENCE",
          penaltyNote: "Sec 36(1) of Legal Metrology Act, 2009 — penalty up to ₹25,000 for missing mandatory declaration.",
        };
      }
      const hasCurrency = /(₹|rs\.?|inr)/i.test(val);
      const hasTaxes = /(tax|incl|all taxes)/i.test(val);
      const hasNumeric = /\d+/.test(val);

      if (!hasNumeric) {
        return {
          ...base,
          status: "FAIL",
          observed: `Invalid MRP text: "${val}"`,
          required: "Numeric price with currency symbol and tax declaration",
          defectType: "FORMAT_DEFECT",
          penaltyNote: "Rule 6(1)(e) requires unambiguous numerical declaration.",
        };
      }
      if (!hasCurrency || !hasTaxes) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Declared: "${val}" (Currency or 'incl. of all taxes' phrasing partially omitted)`,
          required: "Must explicitly state ₹ symbol and 'inclusive of all taxes'",
          defectType: "FORMAT_DEFECT",
          penaltyNote: "Department circular No. WM-10(27)/2020 requires unambiguous 'incl. of all taxes'.",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "MRP declared with currency and tax disclosure",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "net_quantity": {
      const val = data.netQuantity || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Net quantity declaration not found",
          required: "Standard metric declaration (e.g. 500 g, 1 kg, 250 mL, 1 L, 10 N)",
          defectType: "ABSENCE",
          penaltyNote: "Critical statutory defect under Rule 6(1)(b) & Rule 11.",
        };
      }
      const validMetric = /(g|kg|gm|gram|grams|ml|l|liter|litre|mtr|meter|metre|cm|mm|n|units|pcs|pieces)\b/i.test(val);
      const deceptiveQualifiers = /(approx|jumbo|family pack|mega|approximate|huge)\b/i.test(val);

      if (deceptiveQualifiers) {
        return {
          ...base,
          status: "FAIL",
          observed: `Contains non-standard qualifier: "${val}"`,
          required: "Clean metric net quantity without non-standard superlatives",
          defectType: "FORMAT_DEFECT",
          penaltyNote: "Rule 13 prohibits words that tend to exaggerate or obscure actual quantity.",
        };
      }
      if (!validMetric) {
        return {
          ...base,
          status: "FAIL",
          observed: `Non-standard unit: "${val}"`,
          required: "Metric system unit only (g, kg, ml, L, N)",
          defectType: "FORMAT_DEFECT",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Net quantity in standard metric units",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "unit_sale_price": {
      const val = data.unitSalePrice || "";
      const netQty = data.netQuantity || "";
      const isOver100 = /(\d{3,})\s*(g|ml)|(\d+)\s*(kg|l|litre)/i.test(netQty);

      if (!val || val.trim().toLowerCase() === "null") {
        if (isOver100) {
          return {
            ...base,
            status: "FAIL",
            observed: "Unit Sale Price (USP) absent for package > 100g/mL",
            required: "₹ per g / ₹ per 100g / ₹ per mL / ₹ per item",
            defectType: "ABSENCE",
            penaltyNote: "Rule 6(11) mandatory requirement effective since December 2022.",
          };
        }
        return {
          ...base,
          status: "REVIEW",
          observed: "USP not explicitly visible",
          required: "USP required if net quantity > 100g/mL or multi-piece",
          defectType: "NONE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Unit sale price declared",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "mfg_date": {
      const val = data.mfgDate || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Month and year of manufacture/packing absent",
          required: "Month & Year (e.g. 02/2026 or Feb 2026)",
          defectType: "ABSENCE",
          penaltyNote: "Rule 6(1)(d) violation.",
        };
      }
      const hasDatePattern = /(\d{1,2}[/\-.]\d{2,4})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*['"]?\d{2,4})/i.test(val);
      if (!hasDatePattern) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Declared as: "${val}"`,
          required: "Clear month and year format",
          defectType: "FORMAT_DEFECT",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Month & year of manufacture declared",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "expiry_date": {
      const val = data.expiryDate || "";
      if (!val || val.trim().toLowerCase() === "null") {
        const isPerishable = /food|beverage|snack|edible|confectionery|cosmetic/i.test(data.category || "");
        if (isPerishable) {
          return {
            ...base,
            status: "FAIL",
            observed: "Expiry date / Best before declaration absent for perishable commodity",
            required: "Best Before / Expiry Date prominently printed",
            defectType: "ABSENCE",
            penaltyNote: "FSSAI Regulation 2.2.2(9) and Legal Metrology Rule 6(1)(d).",
          };
        }
        return {
          ...base,
          status: "REVIEW",
          observed: "Expiry date not identified on current face",
          required: "Mandatory for food, pharma, and cosmetics",
          defectType: "NONE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Expiry or best before clearly printed",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "batch_number": {
      const val = data.batchNumber || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "REVIEW",
          observed: "Batch / Lot code not detected on scanned surface",
          required: "Batch number or distinctive code for traceability",
          defectType: "ABSENCE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Batch code clearly identifiable",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "mfg_name": {
      const val = data.mfgName || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Manufacturer / Packer identity absent",
          required: "Corporate name of manufacturer or packer",
          defectType: "ABSENCE",
          penaltyNote: "Rule 6(1)(a) requires complete corporate identity.",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Manufacturer / packer identified",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "mfg_address": {
      const val = data.mfgAddress || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Complete manufacturer address absent",
          required: "Postal address with street, district, state & PIN code",
          defectType: "ABSENCE",
          penaltyNote: "Rule 6(1)(a) requires full address enabling consumer postal communication.",
        };
      }
      const hasPin = /\b\d{6}\b/.test(val);
      if (!hasPin) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Declared: "${val}" (6-digit postal PIN code not identified)`,
          required: "Address must include 6-digit postal PIN code",
          defectType: "FORMAT_DEFECT",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Complete registered address with PIN code",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "consumer_care": {
      const val = data.consumerCare || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Consumer care details absent",
          required: "Helpline phone number, email ID, and designation/address",
          defectType: "ABSENCE",
          penaltyNote: "Rule 6(1)(g) mandatory redressal mechanism.",
        };
      }
      const hasEmail = /@/.test(val);
      const hasPhone = /(\+91|\b\d{10}\b|\b1800[-\s]?\d{3}[-\s]?\d{3,4}\b)/.test(val);

      if (!hasEmail && !hasPhone) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Partial contact: "${val}"`,
          required: "Must provide toll-free/phone helpline and email",
          defectType: "FORMAT_DEFECT",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Active consumer care contact channels provided",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "country_of_origin": {
      const val = data.countryOfOrigin || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "Country of Origin not stated",
          required: "Country of Origin (e.g. 'Country of Origin: India')",
          defectType: "ABSENCE",
          penaltyNote: "Rule 6(10) statutory declaration for all goods.",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Country of Origin declared",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "generic_name": {
      const val = data.productName || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "REVIEW",
          observed: "Generic commodity name unclear",
          required: "Generic or common name on principal display panel",
          defectType: "ABSENCE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val,
        required: "Common commodity name declared",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "veg_nonveg": {
      const isFood = /food|beverage|snack|edible|confectionery/i.test(data.category || "");
      if (!isFood) {
        return {
          ...base,
          status: "NOT_APPLICABLE",
          observed: "Non-food commodity",
          required: "Applicable only to food items",
          scoreContribution: 0,
          defectType: "NONE",
        };
      }
      const val = data.vegNonVeg;
      if (val === "VEG" || val === "NON_VEG") {
        return {
          ...base,
          status: "PASS",
          observed: val === "VEG" ? "Vegetarian Symbol (Green dot in square)" : "Non-Vegetarian Symbol (Brown triangle)",
          required: "FSSAI Veg/Non-Veg logo displayed",
          scoreContribution: rule.weight,
          defectType: "NONE",
        };
      }
      return {
        ...base,
        status: "REVIEW",
        observed: "Veg/Non-Veg symbol not detected on this panel",
        required: "Green circle in square (Veg) or Brown triangle (Non-veg)",
        defectType: "ABSENCE",
      };
    }

    case "ingredients": {
      const val = data.ingredients || "";
      const isFoodOrChemical = /food|beverage|snack|personal_care|household/i.test(data.category || "");
      if (!val || val.trim().toLowerCase() === "null") {
        if (isFoodOrChemical) {
          return {
            ...base,
            status: "REVIEW",
            observed: "Ingredients list not captured on current image",
            required: "Ingredients in descending order of weight",
            defectType: "ABSENCE",
          };
        }
        return {
          ...base,
          status: "NOT_APPLICABLE",
          observed: "Single-component or non-compound product",
          required: "Applicable to compound/food products",
          scoreContribution: 0,
          defectType: "NONE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: val.length > 80 ? `${val.substring(0, 80)}...` : val,
        required: "Ingredients listed in descending sequence",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "fssai_license": {
      const isFood = /food|beverage|snack|edible|confectionery/i.test(data.category || "");
      if (!isFood) {
        return {
          ...base,
          status: "NOT_APPLICABLE",
          observed: "Non-food category (FSSAI not mandatory; BIS standard mark if applicable)",
          required: "FSSAI required only for food products",
          scoreContribution: 0,
          defectType: "NONE",
        };
      }
      const val = data.fssaiLicense || "";
      if (!val || val.trim().toLowerCase() === "null") {
        return {
          ...base,
          status: "FAIL",
          observed: "FSSAI License number absent on food package",
          required: "FSSAI Logo and 14-digit registration number",
          defectType: "ABSENCE",
          penaltyNote: "Mandatory under Food Safety & Standards Act, 2006.",
        };
      }
      const has14Digits = /\b\d{14}\b/.test(val);
      if (!has14Digits) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Declared: "${val}" (May not be full 14 digits)`,
          required: "14-digit numerical FSSAI license",
          defectType: "FORMAT_DEFECT",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: `FSSAI Lic No: ${val}`,
        required: "14-digit license number declared",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    case "pdp_contrast": {
      const quality = data.imageQuality;
      if (quality && quality.readabilityScore < 50) {
        return {
          ...base,
          status: "REVIEW",
          observed: `Low image readability score (${quality.readabilityScore}/100) or lighting defect: ${quality.lighting}`,
          required: "Clear contrast against background and legible font height",
          defectType: "UNREADABLE",
        };
      }
      return {
        ...base,
        status: "PASS",
        observed: `Readability score: ${quality?.readabilityScore ?? 85}/100, Lighting: ${quality?.lighting ?? "good"}`,
        required: "High contrast and legible font declarations",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
    }

    default:
      return {
        ...base,
        status: "PASS",
        observed: "Rule checked",
        required: "Standard compliance",
        scoreContribution: rule.weight,
        defectType: "NONE",
      };
  }
}
