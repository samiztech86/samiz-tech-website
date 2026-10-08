import * as XLSX from "xlsx";

export type ExcelSheet = {
  name: string;
  rows: Record<string, unknown>[];
};

export function exportSheetsToExcel(
  filename: string,
  sheets: ExcelSheet[],
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);

    worksheet["!cols"] = getColumnWidths(sheet.rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.slice(0, 31),
    );
  });

  XLSX.writeFile(workbook, filename);
}

function getColumnWidths(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return [];
  }

  const keys = Object.keys(rows[0]);

  return keys.map((key) => {
    const maxLength = Math.max(
      key.length,
      ...rows.map((row) =>
        String(row[key] ?? "").length,
      ),
    );

    return {
      wch: Math.min(Math.max(maxLength + 2, 12), 45),
    };
  });
}

export function downloadReportExcel(
  filename: string,
  sheets: ExcelSheet[],
) {
  exportSheetsToExcel(filename, sheets);
}