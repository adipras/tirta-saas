import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { customerService } from '../../services/customerService';
import { PageHeader } from '../../components';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

interface RowEntry {
  meter_number: string;
  initial_reading: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

interface ErrorEntry {
  row: number;
  meter_number: string;
  error?: string;
}

const EMPTY_ROW: RowEntry = { meter_number: '', initial_reading: '' };

const TEMPLATE_HEADERS = ['meter_number', 'customer_name', 'initial_reading'];

export default function BulkSetInitialReading() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<RowEntry[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  const parseExcel = (file: File) => {
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
              initial_reading: n['initial_reading'] || n['meter_awal'] || n['meter_sebelumnya'] || '',
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

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      const customers = await customerService.getAllCustomers();
      const dataRows = customers
        .filter((c) => c.is_active !== false)
        .sort((a, b) => a.meter_number.localeCompare(b.meter_number))
        .map((c) => ({ meter_number: c.meter_number, customer_name: c.name, initial_reading: '' }));

      const aoa = [
        TEMPLATE_HEADERS,
        ...dataRows.map((r) => TEMPLATE_HEADERS.map((h) => (r as Record<string, string | number>)[h] ?? '')),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'InitialReading');
      XLSX.writeFile(wb, 'template_initial_reading_meter.xlsx');
      toast.success(`Template berhasil diunduh — ${dataRows.length} pelanggan`);
    } catch {
      toast.error('Gagal mengunduh template. Coba lagi.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const updateRow = (index: number, field: keyof RowEntry, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePasteTab = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.trim();
    if (!text) return;
    const parsed: RowEntry[] = text.split('\n').map((line) => {
      const parts = line.split('\t').map((p) => p.trim());
      return {
        meter_number: parts[0] || '',
        initial_reading: parts[1] || '',
      };
    });
    setRows(parsed);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.meter_number && r.initial_reading !== '');
    if (validRows.length === 0) {
      toast.error('Tidak ada data yang valid untuk disubmit');
      return;
    }

    setLoading(true);
    try {
      const records = validRows.map((r) => ({
        meter_number: r.meter_number,
        initial_reading: parseFloat(r.initial_reading),
      }));

      const res = await customerService.bulkSetInitialReading(records);
      setResult(res);

      const updatedRows = rows.map((r) => {
        if (!r.meter_number) return r;
        const errEntry = res.errors?.find((e: ErrorEntry) => e.meter_number === r.meter_number);
        return errEntry
          ? { ...r, status: 'error' as const, error: errEntry.error }
          : { ...r, status: 'success' as const };
      });
      setRows(updatedRows);

      const msg = `Set initial reading selesai: ${res.success} berhasil, ${res.failed} gagal`;
      if (res.failed === 0) {
        toast.success(msg);
      } else {
        toast.warning(msg);
      }
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, 'Gagal menyimpan initial reading'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Set Initial Reading Meter"
        subtitle="Isi nilai meter awal (meter akhir bulan terakhir sebelum mulai menggunakan sistem ini)"
        actions={
          <button
            onClick={() => navigate('/admin/customers')}
            aria-label="Kembali ke halaman pelanggan"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        }
      />

      {/* Penjelasan kontekstual */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Kapan fitur ini digunakan?</p>
          <p>
            Saat pertama kali mengimport data pemakaian air (misalnya mulai <strong>Januari 2026</strong>), sistem
            membutuhkan nilai meter awal (= nilai meteran akhir bulan sebelumnya, misalnya akhir Desember 2025)
            sebagai <em>meter_start</em> untuk hitung pemakaian m³.
          </p>
          <p>
            Isi kolom <strong>initial_reading</strong> dengan angka yang tertera di meteran pada akhir bulan
            terakhir sebelum sistem ini mulai digunakan. Cukup dilakukan <strong>satu kali</strong> per meter.
          </p>
        </div>
      </div>

      {/* Result summary */}
      {result && (
        <div
          className={`rounded-md p-4 ${
            result.failed === 0
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <p className="text-sm font-medium">
            Hasil:{' '}
            <span className="text-green-700">{result.success} berhasil</span>
            {result.failed > 0 && (
              <>
                , <span className="text-red-700">{result.failed} gagal</span>
              </>
            )}{' '}
            dari {result.total} data
          </p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Upload Excel */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Upload File Excel</label>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={templateLoading}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-3.5 w-3.5 mr-1" />
              {templateLoading ? 'Mengunduh...' : 'Download Template Excel'}
            </button>
          </div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <ArrowUpTrayIcon className="h-7 w-7 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Klik untuk upload file Excel (.xlsx)</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Kolom:{' '}
              <span className="font-mono">meter_number</span>,{' '}
              <span className="font-mono">initial_reading</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseExcel(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Data dari Excel akan mengisi tabel di bawah untuk direview sebelum disimpan.
          </p>
        </div>

        {/* Paste tab-separated */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Atau paste data (tab-separated: no_meter, initial_reading)
          </label>
          <textarea
            rows={3}
            onChange={handlePasteTab}
            placeholder={'MTR-001\t1250.5\nMTR-002\t980'}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-8">#</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">No. Meter *</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Initial Reading (m³) *
                  <span className="text-gray-400 font-normal ml-1">(nilai meter akhir bulan sebelumnya)</span>
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-32">Status</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={
                    row.status === 'error'
                      ? 'bg-red-50'
                      : row.status === 'success'
                      ? 'bg-green-50'
                      : ''
                  }
                >
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.meter_number}
                      onChange={(e) => updateRow(i, 'meter_number', e.target.value)}
                      placeholder="MTR-001"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.initial_reading}
                      onChange={(e) => updateRow(i, 'initial_reading', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {row.status === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {row.status === 'error' && (
                      <span title={row.error} className="flex items-center gap-1 text-red-600 text-xs">
                        <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                        {row.error}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRow(i)}
                      aria-label="Hapus baris ini"
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:text-blue-800">
            + Tambah baris
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/customers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Simpan Initial Reading'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
