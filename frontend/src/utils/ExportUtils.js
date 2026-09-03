// utils/exportUtils.js
// Lightweight, dependency-free import/export helpers shared by every
// inventory page (Products, Categories, Suppliers, Stock, Expiry).
// "Export Excel" produces a real XLSX workbook.
// "Export PDF" / "Print" render a simple printable table and invoke the
// browser's print dialog (which offers "Save as PDF").

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";


export function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename, headers, rows) {
  const lines = [headers.map(toCsvValue).join(",")];
  for (const row of rows) {
    lines.push(row.map(toCsvValue).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Creates a genuine XLSX workbook with one header row and one row per table record.
export function downloadExcel(filename, sheetName, headers, rows, rowOffset = 0) {
  const workbookHeaders = ["No.", ...headers];
  const normalizedRows = rows.map((row, rowIndex) => [rowOffset + rowIndex + 1, ...headers.map((_, index) => row[index] ?? "")]);
  const worksheet = XLSX.utils.aoa_to_sheet([workbookHeaders, ...normalizedRows]);
  worksheet["!cols"] = workbookHeaders.map((header, index) => ({
    wch: Math.min(40, Math.max(12, String(header).length + 2, ...normalizedRows.map((row) => String(row[index] ?? "").length + 2))),
  }));
  if (workbookHeaders.length) worksheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: normalizedRows.length, c: workbookHeaders.length - 1 } }) };

  const workbook = XLSX.utils.book_new();
  const safeSheetName = String(sheetName || "Report").replace(/[\\/?*:]/g, " ").replaceAll("[", " ").replaceAll("]", " ").slice(0, 31) || "Report";
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  const xlsxFilename = String(filename || "export.xlsx").replace(/\.(xls|csv)$/i, ".xlsx");
  XLSX.writeFile(workbook, xlsxFilename.endsWith(".xlsx") ? xlsxFilename : `${xlsxFilename}.xlsx`, { compression: true });
}

export function downloadTemplate(filename, headers) {
  downloadCsv(filename, headers, []);
}

// Parses a simple CSV file (no quoted-comma edge cases beyond the basics)
// and returns an array of objects keyed by the header row.
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = text
          .split(/\r?\n/)
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
        if (rows.length === 0) return resolve([]);
        const headers = rows[0].split(",").map((h) => normalizeHeader(h));
        const records = rows.slice(1).map((line) => {
          const cells = line.split(",");
          const record = {};
          headers.forEach((h, i) => {
            record[h] = (cells[i] ?? "").trim();
          });
          return record;
        });
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(reader.result);
        const sheet = workbook.worksheets[0];
        if (!sheet) return resolve([]);

        const headerRow = sheet.getRow(1);
        const headers = [];
        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber - 1] = normalizeHeader(cell.value);
        });

        const records = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header
          const values = row.values; // 1-indexed, values[0] is empty
          // Skip fully blank rows
          const isBlank = headers.every((_, i) => {
            const v = values[i + 1];
            return v === undefined || v === null || String(v).trim() === "";
          });
          if (isBlank) return;

          const record = {};
          headers.forEach((h, i) => {
            const cellValue = values[i + 1];
            // ExcelJS can return rich objects for formulas/hyperlinks; coerce to plain value
            const plain =
              cellValue && typeof cellValue === "object" && "result" in cellValue
                ? cellValue.result
                : cellValue;
            record[h] = plain === undefined || plain === null ? "" : String(plain).trim();
          });
          records.push(record);
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function printTable(title, headers, rows) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const style = `
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 12px; text-align: left; }
      th { background: #f3f4f6; }
    </style>
  `;
  const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => `<tr>${r.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`
    <html>
      <head><title>${title}</title>${style}</head>
      <body>
        <h1>${title}</h1>
        <table>${head}${body}</table>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
}

// Generates a real .xlsx file with a bold header row.
export async function downloadXlsx(filename, headers, rows, sheetName = "Sheet1") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers);

  // Bold + style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" }, // light gray header background
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });

  rows.forEach((row) => sheet.addRow(row));

  // Auto-width columns based on content
  sheet.columns.forEach((col, i) => {
    const header = String(headers[i] ?? "");
    const maxDataLen = rows.reduce((max, r) => {
      const len = String(r[i] ?? "").length;
      return len > max ? len : max;
    }, 0);
    col.width = Math.max(header.length, maxDataLen, 8) + 4;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadXlsxTemplate(filename, headers) {
  return downloadXlsx(filename, headers, []);
}

export function parseImportFile(file) {
  const name = file.name || "";
  if (/\.xlsx?$/i.test(name)) {
    return parseXlsxFile(file);
  }
  return parseCsvFile(file);
}
