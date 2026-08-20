import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { customerService } from '../../services/customerService';
import { PageHeader, useToast } from '../../components';
import { exportToCSV, generateExcelTemplate } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

interface PreviewRow {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  meter_number: string;
  location_name?: string;
  subscription_type_id: string;
  install_date: string;
  initial_reading?: string;
  password?: string;
  is_active?: string;
}

interface ImportResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: string[];
  durationMs: number;
}

const CSV_HEADERS = ['name', 'email', 'phone', 'address', 'meter_number', 'location_name', 'subscription_type_id', 'install_date', 'initial_reading', 'password', 'is_active'];
const REQUIRED_HEADERS = ['name', 'meter_number', 'subscription_type_id', 'install_date'];

const TEMPLATE_ROWS = [
  { name: 'Budi Santoso', email: 'budi@example.com', phone: '08123456789', address: 'Jl. Mawar 1', meter_number: 'MET-001', location_name: 'Rumah Induk', subscription_type_id: 'isi-uuid-subscription-type-di-sini', install_date: '2024-01-01', initial_reading: '0', password: 'rahasia123', is_active: 'true' },
  { name: 'Budi Santoso', email: '', phone: '', address: '', meter_number: 'MET-002', location_name: 'Kos Belakang', subscription_type_id: 'isi-uuid-subscription-type-di-sini', install_date: '2024-01-01', initial_reading: '0', password: '', is_active: '' },
  { name: 'Siti Aminah', email: '', phone: '08987654321', address: 'Jl. Melati 2', meter_number: 'MET-003', location_name: '', subscription_type_id: 'isi-uuid-subscription-type-di-sini', install_date: '2024-02-15', initial_reading: '150', password: '', is_active: 'true' },
];

export default function BulkImportPelanggan() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayFileName, setDisplayFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const isCSV = name.endsWith('.csv');
    const isXLSX = name.endsWith('.xlsx') || name.endsWith('.xls');
    if (!isCSV && !isXLSX) {
      setParseError('Hanya file CSV atau Excel (.xlsx) yang didukung.');
      setSelectedFile(null);
      setDisplayFileName('');
      setPreviewRows([]);
      return;
    }
    setDisplayFileName(file.name);
    setParseError('');
    setResult(null);
    if (isXLSX) {
      parseExcelFile(file);
    } else {
      setSelectedFile(file);
      parseCSVFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.trim().split('\n').filter(Boolean);
        if (lines.length < 2) {
          setParseError('File harus memiliki minimal 1 header dan 1 baris data.');
          setPreviewRows([]);
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
        for (const req of REQUIRED_HEADERS) {
          if (!headers.includes(req)) {
            setParseError(`Header wajib tidak ditemukan: "${req}"`);
            setPreviewRows([]);
            return;
          }
        }
        const rows: PreviewRow[] = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
          return row as unknown as PreviewRow;
        });
        setPreviewRows(rows.slice(0, 10));
        setParseError('');
      } catch {
        setParseError('Gagal membaca file CSV. Pastikan format CSV valid.');
        setPreviewRows([]);
      }
    };
    reader.readAsText(file);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonRows.length === 0) {
          setParseError('File Excel kosong atau tidak memiliki data.');
          setPreviewRows([]);
          return;
        }

        const normalizedRows = jsonRows.map((row) => {
          const normalized: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            normalized[k.toLowerCase().trim()] = String(v);
          }
          return normalized;
        });

        const headers = Object.keys(normalizedRows[0]);
        for (const req of REQUIRED_HEADERS) {
          if (!headers.includes(req)) {
            setParseError(`Header wajib tidak ditemukan: "${req}"`);
            setPreviewRows([]);
            return;
          }
        }

        setPreviewRows(normalizedRows.slice(0, 10) as unknown as PreviewRow[]);

        const csvLines = [
          headers.join(','),
          ...normalizedRows.map((row) =>
            headers
              .map((h) => {
                const val = row[h] ?? '';
                return val.includes(',') || val.includes('"') || val.includes('\n')
                  ? `"${val.replace(/"/g, '""')}"`
                  : val;
              })
              .join(',')
          ),
        ];
        const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
        setSelectedFile(new File([csvBlob], 'import.csv', { type: 'text/csv' }));
        setParseError('');
      } catch {
        setParseError('Gagal membaca file Excel. Pastikan format .xlsx valid.');
        setPreviewRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    exportToCSV(TEMPLATE_ROWS, 'template_pelanggan.csv', CSV_HEADERS);
  };

  const handleDownloadExcelTemplate = () => {
    generateExcelTemplate(CSV_HEADERS, TEMPLATE_ROWS, 'template_pelanggan');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      const res = await customerService.bulkImportPelanggan(selectedFile);
      setResult(res);
      if (res.successCount > 0) {
        toast.success(`Berhasil import ${res.successCount} pelanggan`);
      }
      if (res.failureCount > 0) {
        toast.warning(`${res.failureCount} baris gagal diimport`);
      }
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, 'Gagal mengimport data'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDisplayFileName('');
    setPreviewRows([]);
    setParseError('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Import Pelanggan"
        subtitle="Import banyak pelanggan sekaligus dari file CSV atau Excel"
        actions={
          <button
            onClick={() => navigate('/admin/customers')}
            className="btn-secondary"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Kembali
          </button>
        }
      />

      {/* Instructions */}
      <div className="rounded-xl border border-info-200 bg-info-50 p-4">
        <h3 className="text-[13px] font-semibold text-info-800 mb-2">Format File yang Diperlukan</h3>
        <p className="text-[13px] text-info-700 mb-2">
          File CSV atau Excel harus memiliki kolom berikut (case-insensitive):
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {REQUIRED_HEADERS.map((h) => (
            <span key={h} className="px-2 py-0.5 bg-info-100 text-info-800 text-[12px] font-mono rounded-lg">
              {h} <span className="text-danger-600">*</span>
            </span>
          ))}
          {CSV_HEADERS.filter((h) => !REQUIRED_HEADERS.includes(h)).map((h) => (
            <span key={h} className="px-2 py-0.5 bg-surface-100 text-surface-600 text-[12px] font-mono rounded-lg">
              {h}
            </span>
          ))}
        </div>
        <p className="text-[12px] text-info-600 mb-3">* Wajib diisi</p>
        <p className="text-[12px] text-info-700 mb-2">
          Kolom <span className="font-mono">subscription_type_id</span> wajib diisi dengan UUID golongan langganan yang valid. Kolom <span className="font-mono">install_date</span> menggunakan format <span className="font-mono">YYYY-MM-DD</span>.
        </p>
        <div className="mb-3 rounded-xl bg-info-100/50 border border-info-200 px-3 py-2">
          <p className="text-[12px] font-medium text-info-800">
            Pelanggan dengan lebih dari 1 meter: tambahkan baris baru dengan kolom <span className="font-mono">name</span> yang sama. Kolom data pelanggan (email, phone, address, password, is_active) hanya dibaca dari baris pertama.
          </p>
        </div>
        <div className="rounded-xl bg-warning-50 border border-warning-200 px-3 py-2">
          <p className="text-[12px] font-medium text-warning-800">
            ⚠️ Import tidak akan menghasilkan invoice registrasi otomatis. Invoice registrasi harus dibuat secara manual jika diperlukan.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center text-[13px] text-info-700 hover:text-info-900 font-medium"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Download Template CSV
          </button>
          <button
            onClick={handleDownloadExcelTemplate}
            className="inline-flex items-center text-[13px] text-info-700 hover:text-info-900 font-medium"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Download Template Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="h-5 w-5 text-surface-400" />
          <h3 className="text-base font-semibold text-surface-900">Upload File CSV atau Excel</h3>
        </div>
        <div
          className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <ArrowUpTrayIcon className="h-10 w-10 text-surface-300 mx-auto mb-3" />
          {displayFileName ? (
            <div>
              <p className="text-[13px] font-medium text-surface-900">{displayFileName}</p>
              <p className="text-[12px] text-surface-400 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[13px] text-surface-600">Klik untuk pilih file, atau drag & drop</p>
              <p className="text-[12px] text-surface-400 mt-1">Mendukung .csv dan .xlsx</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {parseError && (
          <div className="mt-3 flex items-start gap-2 text-[13px] text-danger-700 bg-danger-50 border border-danger-200 rounded-xl p-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            {parseError}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewRows.length > 0 && !result && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-surface-900 mb-1">
            Preview Data ({previewRows.length} baris pertama)
          </h3>
          <p className="text-[12px] text-surface-400 mb-4">Total yang akan diimport akan terlihat setelah proses selesai.</p>
          <div className="overflow-x-auto rounded-xl border border-surface-100">
            <table className="min-w-full text-[13px] divide-y divide-surface-100">
              <thead className="bg-surface-50">
                <tr>
                  {['name', 'meter_number', 'location_name', 'subscription_id', 'address', 'phone', 'email'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-surface-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-2 text-surface-900">{row.name}</td>
                    <td className="px-4 py-2 text-surface-600 font-mono">{row.meter_number}</td>
                    <td className="px-4 py-2 text-surface-600">{row.location_name || '—'}</td>
                    <td className="px-4 py-2 text-surface-600 font-mono text-[12px]">{row.subscription_type_id}</td>
                    <td className="px-4 py-2 text-surface-600">{row.address}</td>
                    <td className="px-4 py-2 text-surface-600">{row.phone}</td>
                    <td className="px-4 py-2 text-surface-500">{row.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !!parseError}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Mengimport...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
                  Import Sekarang
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Ganti File
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-surface-900 mb-4">Hasil Import</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center">
              <CheckCircleIcon className="h-8 w-8 text-success-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-success-700">{result.successCount}</div>
              <div className="text-[13px] text-success-600">Berhasil</div>
            </div>
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-center">
              <XCircleIcon className="h-8 w-8 text-danger-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-danger-700">{result.failureCount}</div>
              <div className="text-[13px] text-danger-600">Gagal</div>
            </div>
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-warning-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-warning-700">{result.skippedCount}</div>
              <div className="text-[13px] text-warning-600">Dilewati (duplikat)</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 mb-4">
              <p className="text-[13px] font-semibold text-danger-800 mb-2">Detail Error:</p>
              <ul className="text-[13px] text-danger-700 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-danger-400 flex-shrink-0">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/customers')}
              className="btn-primary"
            >
              Lihat Daftar Pelanggan
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Import Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
