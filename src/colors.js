export const levelColor = (v) =>
  v === "High" ? "#16a34a" : v === "Medium" ? "#d97706" : "#dc2626";

export const paradigmColor = (p) =>
  p === "Relational"
    ? "#1d4ed8"
    : p === "Document"
      ? "#059669"
      : p === "Warehouse"
        ? "#7c3aed"
        : "#475569";
