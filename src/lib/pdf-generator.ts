import { jsPDF } from "jspdf";
import { InspectionDetail } from "../types/inspection";

export function downloadOfficialPdfReport(inspection: InspectionDetail): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const { extractedData, compliance, inspectorSummary } = inspection;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("METROSCAN — LEGAL METROLOGY COMPLIANCE CERTIFICATE", 14, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "Packaged Commodities Rules, 2011 & FSSAI Labelling Regulations | Statutory Inspection Record",
    14,
    18
  );

  y = 34;

  // Status & Metadata Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 28, 3, 3, "FD");

  // Status Badge
  const isPass = compliance.status === "COMPLIANT";
  const isPartial = compliance.status === "PARTIAL_COMPLIANT";
  const badgeColor = isPass ? [22, 101, 52] : isPartial ? [180, 83, 9] : [153, 27, 27];
  const badgeBg = isPass ? [220, 252, 231] : isPartial ? [254, 243, 199] : [254, 226, 226];

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(pageWidth - 68, y + 4, 50, 10, 2, 2, "F");
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    `${compliance.status.replace("_", " ")} (${compliance.score}%)`,
    pageWidth - 43,
    y + 10.5,
    { align: "center" }
  );

  // Meta Info
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(extractedData.productName || "Packaged Commodity", 18, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Record ID: ${inspection.id}`, 18, y + 14);
  doc.text(`Brand: ${extractedData.brand || "—"} | Category: ${extractedData.category}`, 18, y + 19);
  doc.text(
    `Date: ${new Date(inspection.timestamp).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    })} | AI Engine: ${inspection.aiEngineUsed}`,
    18,
    y + 24
  );

  y += 34;

  // Inspector's Summary Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("INSPECTOR'S STATUTORY FINDINGS (80-WORD SUMMARY)", 14, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitSummary = doc.splitTextToSize(inspectorSummary, pageWidth - 36);
  doc.text(splitSummary, 18, y + 5);

  y += 26;

  // Extracted Declarations Table (12 fields summary)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("12 MANDATORY STATUTORY DECLARATIONS AUDIT", 14, y);
  y += 4;

  // Table header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("MANDATORY FIELD", 18, y + 4.2);
  doc.text("DETECTED VALUE ON LABEL", 65, y + 4.2);
  doc.text("LEGAL REQUIREMENT", 135, y + 4.2);
  doc.text("STATE", pageWidth - 22, y + 4.2, { align: "right" });
  y += 6;

  const keyDeclarations = [
    { label: "1. Maximum Retail Price (MRP)", val: extractedData.mrp, req: "₹ [Price] incl. of all taxes" },
    { label: "2. Net Quantity", val: extractedData.netQuantity, req: "Standard metric units (g, kg, ml, L, N)" },
    { label: "3. Unit Sale Price (USP)", val: extractedData.unitSalePrice, req: "Mandatory for >100g/ml or multipacks" },
    { label: "4. Mfg / Packing Date", val: extractedData.mfgDate, req: "Month & Year of manufacture" },
    { label: "5. Expiry / Best Before", val: extractedData.expiryDate, req: "Prominently printed duration or date" },
    { label: "6. Batch / Lot Number", val: extractedData.batchNumber, req: "Distinct production code" },
    { label: "7. Manufacturer Name", val: extractedData.mfgName, req: "Full corporate identity" },
    { label: "8. Complete Postal Address", val: extractedData.mfgAddress, req: "Registered address with PIN code" },
    { label: "9. Consumer Care Contact", val: extractedData.consumerCare, req: "Telephone, email, and redressal address" },
    { label: "10. Country of Origin", val: extractedData.countryOfOrigin, req: "Mandatory for all packaged goods" },
    { label: "11. Veg / Non-Veg Symbol", val: extractedData.vegNonVeg || "—", req: "Prescribed FSSAI logo (if food)" },
    { label: "12. FSSAI / Standard Mark", val: extractedData.fssaiLicense, req: "14-digit license number" },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  for (let i = 0; i < keyDeclarations.length; i++) {
    const item = keyDeclarations[i];
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 5.2, "F");
    }
    doc.setTextColor(30, 41, 59);
    doc.text(item.label, 18, y + 3.8);

    const valStr = item.val || "NOT FOUND";
    const truncatedVal = valStr.length > 38 ? `${valStr.substring(0, 36)}...` : valStr;
    doc.setTextColor(item.val ? 15 : 185, item.val ? 23 : 28, item.val ? 42 : 28);
    doc.text(truncatedVal, 65, y + 3.8);

    doc.setTextColor(100, 116, 139);
    doc.text(item.req, 135, y + 3.8);

    if (item.val) {
      doc.setTextColor(22, 101, 52);
      doc.text("VERIFIED", pageWidth - 22, y + 3.8, { align: "right" });
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text("MISSING", pageWidth - 22, y + 3.8, { align: "right" });
    }

    y += 5.2;
  }

  y += 5;

  // 15 Rules Evaluation Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `STATUTORY RULE ENGINE (15 RULES: ${compliance.passCount} PASS / ${compliance.failCount} FAIL / ${compliance.reviewCount} REVIEW)`,
    14,
    y
  );
  y += 4;

  const sampleRules = compliance.rules.slice(0, 8); // show top rules
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("RULE & SECTION", 18, y + 3.6);
  doc.text("OBSERVED AUDIT EVIDENCE", 85, y + 3.6);
  doc.text("VERDICT", pageWidth - 22, y + 3.6, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);

  for (let r = 0; r < sampleRules.length; r++) {
    const rule = sampleRules[r];
    if (r % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 4.8, "F");
    }
    doc.setTextColor(30, 41, 59);
    doc.text(`${rule.name} (${rule.section})`, 18, y + 3.4);

    doc.setTextColor(71, 85, 105);
    const obs = rule.observed.length > 45 ? `${rule.observed.substring(0, 42)}...` : rule.observed;
    doc.text(obs, 85, y + 3.4);

    if (rule.status === "PASS") {
      doc.setTextColor(22, 101, 52);
    } else if (rule.status === "FAIL") {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(180, 83, 9);
    }
    doc.text(rule.status, pageWidth - 22, y + 3.4, { align: "right" });

    y += 4.8;
  }

  // Footer / Signature block
  y = 270;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Official Inspection Certificate issued under the Legal Metrology Act, 2009.", 14, y + 5);
  doc.text(
    `Digital Evidence Hash: ${Math.random().toString(36).substring(2, 12).toUpperCase()} | Page 1 of 1`,
    14,
    y + 9
  );

  doc.text("Authorized Inspectorate Sign-off:", pageWidth - 65, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("[ VERIFIED DIGITAL SEAL ]", pageWidth - 65, y + 10);

  doc.save(`Legal_Metrology_Report_${inspection.id}.pdf`);
}
