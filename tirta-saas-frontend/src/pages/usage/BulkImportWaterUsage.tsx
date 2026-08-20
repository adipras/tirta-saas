import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { usageService } from '../../services/usageService';
import { PageHeader } from '../../components';
import { useToast } from '../../components';
import { generateExcelTemplate } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

interface RowEntry {
  meter_number: string;
  meter_end: string;
  notes: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface ImportErrorEntry {
  meter_number: string;
  error: string;
}

const EMPTY_ROW: RowEntry = { meter_number: '', meter_end: '', notes: '' };

const USAGE_TEMPLATE_HEADERS = ['meter_number', 'customer_name', 'meter_end', 'notes'];
const USAGE_TEMPLATE_ROWS = [
  { meter_number: 'MTR-001', customer_name: 'Budi Santoso', meter_end: 125.5, notes: 'Normal' },
  { meter_number: 'MTR-002', customer_name: 'Siti Rahayu', meter_end: 980, notes: '' },
];

export default function BulkImportWaterPemakaian() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usageMonth, setPemakaianMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<RowEntry[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  const parseExcelForUsage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonRows.length === 0) {
          toast.error('File Excel kosong atau tidak memiliki data.');
          return;
        }

        const parsed: RowEntry[] = jsonRows
          .map((row) => {
            const n: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              n[k.toLowerCase().trim()] = String(v);
            }
            return {
              meter_number: n['meter_number'] || n['no_meter'] || '',
              meter_end: n['meter_end'] || n['meter_akhir'] || '',
              notes: n['notes'] || n['catatan'] || '',
            };
          })
          .filter((r) => r.meter_number);

        if (parsed.length === 0) {
          toast.error('Tidak ada data valid. Pastikan kolom meter_number tersedia di file Excel.');
          return;
        }

        setRows(parsed);
        toast.success(`${parsed.length} baris berhasil dibaca dari file Excel.`);
      } catch {
        toast.error('Gagal membaca file Excel. Pastikan format .xlsx valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadExcelTemplate = () => {
    generateExcelTemplate(USAGE_TEMPLATE_HEADERS, USAGE_TEMPLATE_ROWS, 'template_pemakaian_air');
  };

  const updateRow = (index: number, field: keyof RowEntry, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handlePasteCSV = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.trim();
    if (!text) return;
    const parsed: RowEntry[] = text.split('\n').map(line => {
      const parts = line.split('\t').map(p => p.trim());
      return {
        meter_number: parts[0] || '',
        meter_end: parts[1] || '',
        notes: parts[2] || '',
      };
    });
    setRows(parsed);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.meter_number && r.meter_end);
    if (!usageMonth) {
      toast.error('Pilih bulan pemakaian');
      return;
    }
    if (validRows.length === 0) {
      toast.error('Tidak ada data yang valid untuk diimport');
      return;
    }

    setLoading(true);
    try {
      const records = validRows.map(r => ({
        meter_number: r.meter_number,
        meter_end: parseFloat(r.meter_end),
        notes: r.notes,
      }));

      const res = await usageService.bulkImportWaterPemakaian(usageMonth, records);
      setResult(res);

      const updatedRows = rows.map(r => {
        if (!r.meter_number) return r;
        const errEntry = res.errors?.find((e: ImportErrorEntry) => e.meter_number === r.meter_number);
        return errEntry
          ? { ...r, status: 'error' as const, error: errEntry.error }
          : { ...r, status: 'success' as const };
      });
      setRows(updatedRows);

      const msg = `Import selesai: ${res.success} berhasil, ${res.failed} gagal`;
      if (res.failed === 0) {
        toast.success(msg);
      } else {
        toast.warning(msg);
      }
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, 'Import gagal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import Meter Reading"
        subtitle="Import data pembacaan meter banyak pelanggan sekaligus"
        actions={
          <button onClick={() => navigate('/admin/usage')} className="btn-secondary">
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Kembali
          </button>
        }
      />

      {/* Result summary */}
      {result && (
        <div className={`rounded-xl border p-4 ${result.failed === 0 ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'}`}>
          <p className="text-[13px] font-medium">
            Hasil Import: <span className="text-success-700">{result.success} berhasil</span>
            {result.failed > 0 && <>, <span className="text-danger-700">{result.failed} gagal</span></>}
            {' '}dari {result.total} data
          </p>
        </div>
      )}

      <div className="card p-6 space-y-6">
        {/* Pemakaian Month */}
        <div className="max-w-xs">
          <label className="block text-[13px] font-medium text-surface-700 mb-1.5">Bulan Pemakaian</label>
          <input
            type="month"
            value={usageMonth}
            onChange={e => setPemakaianMonth(e.target.value)}
            className="input-base"
          />
        </div>

        {/* Upload Excel */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-medium text-surface-700">Upload File Excel</label>
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="inline-flex items-center text-[12px] text-brand-600 hover:text-brand-800 font-medium"
            >
              <DocumentArrowDownIcon className="h-3.5 w-3.5 mr-1" />
              Download Template Excel
            </button>
          </div>
          <div
            className="border-2 border-dashed border-surface-200 rounded-xl p-5 text-center hover:border-brand-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <ArrowUpTrayIcon className="h-7 w-7 text-surface-300 mx-auto mb-2" />
            <p className="text-[13px] text-surface-600">Klik untuk upload file Excel (.xlsx)</p>
            <p className="text-[12px] text-surface-400 mt-0.5">
              Kolom: <span className="font-mono">meter_number</span>, <span className="font-mono">customer_name</span> (opsional), <span className="font-mono">meter_end</span>, <span className="font-mono">notes</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseExcelForUsage(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
          <p className="text-[12px] text-surface-400 mt-1.5">Data dari Excel akan mengisi tabel di bawah untuk direview sebelum disubmit.</p>
        </div>

        {/* Paste CSV hint */}
        <div>
          <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
            Atau paste data (tab-separated: no_meter, meter_akhir, catatan)
          </label>
          <textarea
            rows={3}
            onChange={handlePasteCSV}
            placeholder="000001&#9;1250&#9;Normal&#10;000002&#9;980&#9;"
            className="input-base font-mono"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-surface-100">
          <table className="min-w-full divide-y divide-surface-100 text-[13px]">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider w-8">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider">No. Meter *</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider">Meter Akhir (m³) *</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider">Catatan</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider w-24">Status</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rows.map((row, i) => (
                <tr key={i} className={`${row.status === 'error' ? 'bg-danger-50/50' : row.status === 'success' ? 'bg-success-50/50' : ''} transition-colors`}>
                  <td className="px-3 py-2 text-surface-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.meter_number}
                      onChange={e => updateRow(i, 'meter_number', e.target.value)}
                      placeholder="000001"
                      className="input-base"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={row.meter_end}
                      onChange={e => updateRow(i, 'meter_end', e.target.value)}
                      placeholder="0"
                      className="input-base"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={e => updateRow(i, 'notes', e.target.value)}
                      className="input-base"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {row.status === 'success' && <CheckCircleIcon className="h-5 w-5 text-success-500" />}
                    {row.status === 'error' && (
                      <span title={row.error} className="flex items-center gap-1 text-danger-600 text-[12px]">
                        <XCircleIcon className="h-4 w-4 flex-shrink-0" />{row.error}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(i)} aria-label="Hapus baris ini" className="text-surface-400 hover:text-danger-500 transition-colors">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-[13px] text-brand-600 hover:text-brand-800 font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah baris
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/usage')}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              <BoltIcon className="h-4 w-4 mr-1.5" />
              {loading ? 'Mengimport...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
