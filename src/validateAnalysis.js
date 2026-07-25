// Parses and validates each phase of the Gemini response before it reaches
// Results.jsx, which dereferences deep nested fields without guards — a
// missing/truncated field must be caught here with a clear message rather
// than throwing mid-render.

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function requireFields(obj, fields, context) {
  for (const field of fields) {
    if (obj?.[field] === undefined || obj?.[field] === null) {
      throw new Error(`AI response is missing "${context}.${field}".`);
    }
  }
}

export function parseJson(rawText) {
  let clean = rawText.replace(/```json|```/gi, "").trim();

  // Fallback: if there's stray prose around the JSON despite the prompt's
  // instructions, slice from the first "{" to the last "}".
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start > 0 || end < clean.length - 1) {
    if (start !== -1 && end !== -1 && end > start) {
      clean = clean.slice(start, end + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("AI response was not valid JSON — please try again.");
  }
}

export function validateOverview(data) {
  if (data?.isValidProject === false) {
    throw new Error(
      data.invalidReason ||
        "That doesn't look like a project description — please describe an actual system or app you want to build.",
    );
  }

  requireFields(
    data,
    [
      "projectName",
      "projectType",
      "recommendation",
      "confidence",
      "whyBestFit",
      "dimensionScores",
      "keyFactors",
    ],
    "response",
  );
  return data;
}

export function validateDetails(data) {
  requireFields(
    data,
    [
      "recommendedPatterns",
      "schemaStructure",
      "schemaComparison",
      "riskAssessment",
      "governanceAssessment",
      "futureReadiness",
      "implementationRoadmap",
    ],
    "response",
  );

  if (!isNonEmptyArray(data.schemaStructure.entities)) {
    throw new Error('AI response is missing "schemaStructure.entities".');
  }
  for (const entity of data.schemaStructure.entities) {
    requireFields(entity, ["name", "type", "paradigm", "database", "fields"], "schemaStructure.entities[]");
    if (!isNonEmptyArray(entity.fields)) {
      throw new Error(`AI response entity "${entity.name}" has no fields.`);
    }
  }

  if (!isNonEmptyArray(data.schemaComparison.entities)) {
    throw new Error('AI response is missing "schemaComparison.entities".');
  }
  for (const entity of data.schemaComparison.entities) {
    requireFields(entity, ["name", "relational", "document", "divergencePoints"], "schemaComparison.entities[]");
    requireFields(entity.relational, ["database", "fields"], "schemaComparison.entities[].relational");
    requireFields(entity.document, ["database", "fields"], "schemaComparison.entities[].document");
    if (!isNonEmptyArray(entity.divergencePoints)) {
      throw new Error(`AI response comparison entity "${entity.name}" has no divergencePoints.`);
    }
  }

  requireFields(data.riskAssessment, ["level", "reason", "mitigations"], "riskAssessment");
  requireFields(
    data.governanceAssessment,
    ["auditability", "complianceReadiness", "dataLineage"],
    "governanceAssessment",
  );
  requireFields(
    data.futureReadiness,
    ["aiReadiness", "cloudReadiness", "scalabilityReadiness"],
    "futureReadiness",
  );

  if (!isNonEmptyArray(data.implementationRoadmap)) {
    throw new Error('AI response is missing "implementationRoadmap".');
  }
  for (const phase of data.implementationRoadmap) {
    requireFields(phase, ["phase", "title", "tasks"], "implementationRoadmap[]");
  }

  return data;
}
