// lib/document-types.ts

export type DocumentType =
  | "ID_CARD" // תעודת זהות
  | "EMPLOYMENT_CONTRACT" // הסכם עבודה
  | "FORM_101" // טופס 101
  | "BANK_DETAILS" // פרטי בנק
  | "MEDICAL_CERTIFICATE" // אישור רפואי
  | "DRIVERS_LICENSE" // רישיון נהיגה
  | "PASSPORT" // דרכון
  | "OTHER"; // אחר

export const documentTypeLabels: Record<DocumentType, string> = {
  ID_CARD: "תעודת זהות",
  EMPLOYMENT_CONTRACT: "הסכם עבודה",
  FORM_101: "טופס 101",
  BANK_DETAILS: "פרטי בנק",
  MEDICAL_CERTIFICATE: "אישור רפואי",
  DRIVERS_LICENSE: "רישיון נהיגה",
  PASSPORT: "דרכון",
  OTHER: "אחר",
};
