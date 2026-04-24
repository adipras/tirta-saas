import * as XLSX from 'xlsx';

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Export data to CSV and trigger browser download.
 */
export function exportToCSV(data: ExportRow[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export data to .xlsx and trigger browser download.
 * Supports multiple sheets: pass an array of { sheetName, data } objects.
 */
export function exportToExcel(
  sheets: { sheetName: string; data: ExportRow[] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new();
  for (const { sheetName, data } of sheets) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  }
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/** Format number as IDR string for export */
export function formatIDR(value: number | null | undefined): string {
  const normalizedValue = Number.isFinite(value) ? Number(value) : 0;
  return `Rp ${normalizedValue.toLocaleString('id-ID')}`;
}
