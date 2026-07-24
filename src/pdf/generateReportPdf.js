import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 14;
const PAGE_WIDTH = 210; // A4, mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function slugify(text) {
  const slug = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return slug || "report";
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function addHeading(doc, y, text, size = 13) {
  y = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(13, 13, 13);
  doc.text(text, MARGIN, y);
  return y + size * 0.6 + 4;
}

function addParagraph(doc, y, text, size = 10) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(55, 65, 81);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    y = ensureSpace(doc, y, 6);
    doc.text(line, MARGIN, y);
    y += 5;
  }
  return y + 2;
}

function recommendationLabel(rec) {
  return rec === "relational" ? "Relational" : rec === "document" ? "Document" : "Polyglot";
}

export function downloadReportPdf(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("SPCS · SCHEMA PATTERN COMPARISON SYSTEM", MARGIN, y);
  y += 8;

  doc.setFontSize(20);
  doc.setTextColor(13, 13, 13);
  doc.text(data.projectName, MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${data.projectType}  ·  ${recommendationLabel(data.recommendation)} Architecture  ·  ${data.confidence}% confidence`,
    MARGIN,
    y,
  );
  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  y = addParagraph(doc, y, data.whyBestFit);

  // Dimension scores
  y = addHeading(doc, y + 4, "Dimension Scores");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 1: { halign: "right" } },
    head: [["Dimension", "Score"]],
    body: Object.entries(data.dimensionScores).map(([k, v]) => [
      k.replace(/([A-Z])/g, " $1").trim(),
      String(v),
    ]),
  });
  y = doc.lastAutoTable.finalY + 8;

  // Key factors
  y = addHeading(doc, y, "Key Decision Factors");
  data.keyFactors.forEach((f, i) => {
    y = addParagraph(doc, y, `${i + 1}. ${f}`);
  });

  // Real-world comparison
  if (data.realWorldComparison) {
    y = addHeading(doc, y + 2, "Real-World Comparison");
    y = addParagraph(
      doc,
      y,
      `Similar to ${data.realWorldComparison.similarSystem}. ${data.realWorldComparison.howSimilar} Their approach: ${data.realWorldComparison.theirApproach}`,
    );
  }

  // Schema structure
  doc.addPage();
  y = MARGIN;
  y = addHeading(doc, y, "Schema Structure", 15);
  y = addParagraph(doc, y, data.schemaStructure.description);

  data.schemaStructure.entities.forEach((entity) => {
    y = ensureSpace(doc, y, 20);
    y = addHeading(
      doc,
      y + 3,
      `${entity.name}  (${entity.type} · ${entity.database})`,
      11,
    );
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [13, 13, 13] },
      head: [["Field", "Type", "Note"]],
      body: entity.fields.map((f) => [f.name, f.type, f.note || ""]),
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  // Schema comparison
  doc.addPage();
  y = MARGIN;
  y = addHeading(doc, y, "Schema Comparison — Relational vs. Document", 15);
  y = addParagraph(doc, y, data.schemaComparison.description);

  data.schemaComparison.entities.forEach((entity) => {
    y = ensureSpace(doc, y, 20);
    y = addHeading(doc, y + 3, entity.name, 11);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [13, 13, 13] },
      head: [["Aspect", "Relational approach", "Document approach"]],
      body: entity.divergencePoints.map((d) => [d.aspect, d.relationalApproach, d.documentApproach]),
    });
    y = doc.lastAutoTable.finalY + 6;
  });

  // Patterns
  doc.addPage();
  y = MARGIN;
  y = addHeading(doc, y, "Recommended Schema Patterns", 15);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [13, 13, 13] },
    head: [["Pattern", "Paradigm", "Reason", "Applies To"]],
    body: data.recommendedPatterns.map((p) => [
      p.name,
      p.paradigm,
      p.reason,
      p.appliesTo,
    ]),
  });
  y = doc.lastAutoTable.finalY + 10;

  // Risk assessment
  y = addHeading(doc, y, "Risk Assessment");
  y = addParagraph(
    doc,
    y,
    `${data.riskAssessment.level} risk — ${data.riskAssessment.reason}`,
  );
  data.riskAssessment.mitigations.forEach((m) => {
    y = addParagraph(doc, y, `•  ${m}`);
  });

  // Governance
  y = addHeading(doc, y + 3, "Governance Assessment");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      ["Auditability", data.governanceAssessment.auditability],
      ["Compliance Readiness", data.governanceAssessment.complianceReadiness],
      ["Data Lineage", data.governanceAssessment.dataLineage],
    ],
  });
  y = doc.lastAutoTable.finalY + 4;
  if (data.governanceAssessment.notes) {
    y = addParagraph(doc, y, data.governanceAssessment.notes);
  }

  // Future readiness
  y = addHeading(doc, y + 3, "Future Readiness");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    body: [
      ["AI / ML Readiness", data.futureReadiness.aiReadiness],
      ["Cloud Readiness", data.futureReadiness.cloudReadiness],
      ["Scalability Readiness", data.futureReadiness.scalabilityReadiness],
    ],
  });
  y = doc.lastAutoTable.finalY + 4;
  if (data.futureReadiness.notes) {
    y = addParagraph(doc, y, data.futureReadiness.notes);
  }

  // Roadmap
  doc.addPage();
  y = MARGIN;
  y = addHeading(doc, y, "Implementation Roadmap", 15);
  data.implementationRoadmap.forEach((phase) => {
    y = ensureSpace(doc, y, 14);
    y = addHeading(doc, y + 2, `Phase ${phase.phase}: ${phase.title}`, 12);
    phase.tasks.forEach((task) => {
      y = addParagraph(doc, y, `›  ${task}`);
    });
  });

  doc.save(`SPCS-${slugify(data.projectName)}.pdf`);
}
