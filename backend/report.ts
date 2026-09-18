import { InspectionDetail } from "../src/types/inspection";

export function generateHtmlReport(inspection: InspectionDetail): string {
  const { extractedData, compliance, inspectorSummary } = inspection;
  const statusColor =
    compliance.status === "COMPLIANT"
      ? "#15803d"
      : compliance.status === "PARTIAL_COMPLIANT"
      ? "#b45309"
      : "#b91c1c";

  const statusBg =
    compliance.status === "COMPLIANT"
      ? "#f0fdf4"
      : compliance.status === "PARTIAL_COMPLIANT"
      ? "#fffbeb"
      : "#fef2f2";

  const rulesRows = compliance.rules
    .map(
      (r, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-weight: 600; font-size: 13px; color: #1e293b;">${r.name}</td>
      <td style="padding: 10px; font-size: 12px; color: #64748b;">${r.section}</td>
      <td style="padding: 10px; font-size: 12px; color: #334155;">${r.observed || "—"}</td>
      <td style="padding: 10px; text-align: center;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${
          r.status === "PASS"
            ? "background-color: #dcfce7; color: #166534;"
            : r.status === "FAIL"
            ? "background-color: #fee2e2; color: #991b1b;"
            : r.status === "REVIEW"
            ? "background-color: #fef3c7; color: #92400e;"
            : "background-color: #f1f5f9; color: #475569;"
        }">
          ${r.status}
        </span>
      </td>
    </tr>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Legal Metrology Certificate of Inspection — ${inspection.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; color: #0f172a; line-height: 1.5; background-color: #fff; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
    .emblem { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .subhead { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }
    .badge-box { text-align: right; }
    .verdict-badge { display: inline-block; padding: 6px 16px; border-radius: 6px; font-size: 14px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item { font-size: 11px; color: #64748b; }
    .meta-val { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; margin-bottom: 10px; border-left: 3px solid #2563eb; padding-left: 8px; }
    .summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; border-radius: 8px; font-size: 13px; color: #166534; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; }
    th { background: #f1f5f9; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 15mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="emblem">STATUTORY INSPECTION CERTIFICATE</div>
      <div class="subhead">LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011 & FSSAI REGULATIONS</div>
      <div style="font-size: 12px; color: #334155; margin-top: 4px;">Record Ref: <strong>${inspection.id}</strong> | Timestamp: ${new Date(inspection.timestamp).toLocaleString()}</div>
    </div>
    <div class="badge-box">
      <div class="verdict-badge">${compliance.status.replace("_", " ")} (${compliance.score}/100)</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Passed: ${compliance.passCount} / 15 Rules</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">Commodity Name<div class="meta-val">${extractedData.productName || "Packaged Good"}</div></div>
    <div class="meta-item">Brand / Category<div class="meta-val">${extractedData.brand || "—"} (${extractedData.category})</div></div>
    <div class="meta-item">Declared Net Qty<div class="meta-val">${extractedData.netQuantity || "MISSING"}</div></div>
    <div class="meta-item">Declared MRP<div class="meta-val">${extractedData.mrp || "MISSING"}</div></div>
    <div class="meta-item">Manufacturer<div class="meta-val">${extractedData.mfgName || "Not identified"}</div></div>
    <div class="meta-item">Mfg / Packing Date<div class="meta-val">${extractedData.mfgDate || "—"}</div></div>
    <div class="meta-item">Batch / Lot Code<div class="meta-val">${extractedData.batchNumber || "—"}</div></div>
    <div class="meta-item">Country of Origin<div class="meta-val">${extractedData.countryOfOrigin || "Not stated"}</div></div>
  </div>

  <div class="section-title">Inspector's Official Summary</div>
  <div class="summary-card">
    ${inspectorSummary}
  </div>

  <div class="section-title">15 Statutory Compliance Rules Audit</div>
  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Statutory Requirement</th>
        <th style="width: 22%;">Citation</th>
        <th style="width: 34%;">Observed On Package</th>
        <th style="width: 12%; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rulesRows}
    </tbody>
  </table>

  <div class="footer">
    <div>Generated by MetroScan Vision AI Inspector Engine (${inspection.aiEngineUsed})</div>
    <div>Official Digital Evidence Record — Legal Metrology Division</div>
  </div>
</body>
</html>`;
}
