// utils/exportUtils.js
// Lightweight, dependency-free import/export helpers shared by every
// inventory page (Products, Categories, Suppliers, Stock, Expiry).
// "Export Excel" produces a real XLSX workbook.
// "Export PDF" / "Print" render a simple printable table and invoke the
// browser's print dialog (which offers "Save as PDF").

import * as XLSX from "xlsx";

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
        const headers = rows[0].split(",").map((h) => h.trim());
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
