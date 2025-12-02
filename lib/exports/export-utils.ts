// lib/exports/export-utils.ts
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ========================================
// Types
// ========================================

export type ExportFormat = "xlsx" | "pdf";

export type ExportColumn = {
  header: string;
  key: string;
  width?: number;
};

export type ExportOptions = {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, string | number>[];
  summaryData?: Record<string, string | number>;
  rtl?: boolean;
};

// ========================================
// Excel Export
// ========================================

export function exportToExcel(options: ExportOptions): void {
  const { title, subtitle, filename, columns, data, summaryData } = options;

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Prepare headers
  const headers = columns.map((col) => col.header);

  // Prepare rows
  const rows = data.map((row) => columns.map((col) => row[col.key] ?? ""));

  // Create worksheet data with title
  const wsData: (string | number)[][] = [];

  // Add title
  wsData.push([title]);
  if (subtitle) {
    wsData.push([subtitle]);
  }
  wsData.push([]); // Empty row

  // Add headers
  wsData.push(headers);

  // Add data rows
  rows.forEach((row) => wsData.push(row));

  // Add summary if provided
  if (summaryData) {
    wsData.push([]); // Empty row
    wsData.push(["סיכום"]);
    Object.entries(summaryData).forEach(([key, value]) => {
      wsData.push([key, String(value)]);
    });
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  ws["!cols"] = colWidths;

  // Set RTL
  ws["!dir"] = "rtl";

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "דוח");

  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ========================================
// PDF Export
// ========================================

export function exportToPDF(options: ExportOptions): void {
  const { title, subtitle, filename, columns, data, summaryData, rtl = true } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Add Hebrew font support - using built-in font for now
  // For full Hebrew support, you'd need to add a Hebrew font

  let yPos = 15;

  // Add title
  doc.setFontSize(18);
  doc.text(title, rtl ? doc.internal.pageSize.width - 15 : 15, yPos, {
    align: rtl ? "right" : "left",
  });
  yPos += 8;

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, rtl ? doc.internal.pageSize.width - 15 : 15, yPos, {
      align: rtl ? "right" : "left",
    });
    yPos += 10;
  }

  // Prepare table data
  const tableHeaders = rtl ? [...columns].reverse().map((col) => col.header) : columns.map((col) => col.header);
  const tableData = data.map((row) => {
    const rowData = columns.map((col) => String(row[col.key] ?? ""));
    return rtl ? rowData.reverse() : rowData;
  });

  // Add table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPos,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      halign: rtl ? "right" : "left",
    },
    headStyles: {
      fillColor: [79, 70, 229], // Violet
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  // Add summary if provided
  if (summaryData) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text("סיכום", rtl ? doc.internal.pageSize.width - 15 : 15, finalY, {
      align: rtl ? "right" : "left",
    });

    const summaryRows = Object.entries(summaryData).map(([key, value]) => [
      String(value),
      key,
    ]);

    autoTable(doc, {
      body: rtl ? summaryRows : summaryRows.map((r) => r.reverse()),
      startY: finalY + 5,
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: rtl ? "right" : "left",
      },
      columnStyles: {
        0: { fontStyle: "bold" },
      },
      margin: { right: 15, left: 15 },
    });
  }

  // Save PDF
  doc.save(`${filename}.pdf`);
}

// ========================================
// Combined Export Function
// ========================================

export function exportReport(format: ExportFormat, options: ExportOptions): void {
  if (format === "xlsx") {
    exportToExcel(options);
  } else {
    exportToPDF(options);
  }
}
