import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { customerService } from '../../services/customerService';
import { PageHeader, useToast } from '../../components';
import { exportToCSV, generateExcelTemplate } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

interface PreviewRow {
  name: string;
  meter_number: string;
  address: string;
  phone: string;
  subscription_id: string;
  email?: string;
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

const CSV_HEADERS = ['name', 'meter_number', 'address', 'phone', 'subscription_id', 'email', 'password', 'is_active'];
const REQUIRED_HEADERS = ['name', 'meter_number', 'address', 'phone', 'subscription_id'];

const TEMPLATE_ROWS = [
  { name: 'John Doe', meter_number: 'MTR-001', address: 'Jl. Merdeka No. 1', phone: '081234567890', subscription_id: '123e4567-e89b-12d3-a456-426614174000', email: 'john@example.com', password: 'rahasia123', is_active: 'true' },
  { name: 'Jane Smith', meter_number: 'MTR-002', address: 'Jl. Sudirman No. 5', phone: '082345678901', subscription_id: '123e4567-e89b-12d3-a456-426614174001', email: '', password: '', is_active: 'true' },
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
        setPreviewRows(rows.slice(0, 10)); // preview max 10 rows
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

        // Normalize all headers to lowercase
        const normalizedRows = jsonRows.map((row) => {
          const normalized: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            normalized[k.toLowerCase().trim()] = String(v);
          }
          return normalized;
        });

        // Validate required headers
        const headers = Object.keys(normalizedRows[0]);
        for (const req of REQUIRED_HEADERS) {
          if (!headers.includes(req)) {
            setParseError(`Header wajib tidak ditemukan: "${req}"`);
            setPreviewRows([]);
            return;
          }
        }

        setPreviewRows(normalizedRows.slice(0, 10) as unknown as PreviewRow[]);

        // Convert to CSV blob and wrap as File so existing submit logic works unchanged
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Kembali
          </button>
        }
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Format File yang Diperlukan</h3>
        <p className="text-sm text-blue-700 mb-2">
          File CSV atau Excel harus memiliki kolom berikut (case-insensitive):
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {REQUIRED_HEADERS.map((h) => (
            <span key={h} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">
              {h} <span className="text-red-600">*</span>
            </span>
          ))}
          {CSV_HEADERS.filter((h) => !REQUIRED_HEADERS.includes(h)).map((h) => (
            <span key={h} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">
              {h}
            </span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mb-3">* Wajib diisi</p>
        <p className="text-xs text-blue-700 mb-3">
          Kolom <span className="font-mono">email</span> dan <span className="font-mono">password</span> bersifat opsional. Jika <span className="font-mono">password</span> diisi, pelanggan bisa login memakai nomor meter atau email.
        </p>
        <p className="text-xs text-blue-700 mb-3">
          Kolom <span className="font-mono">subscription_id</span> wajib diisi dengan UUID golongan pelanggan yang valid milik tenant.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Download Template CSV
          </button>
          <button
            onClick={handleDownloadExcelTemplate}
            className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Download Template Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Upload File CSV atau Excel</h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          {displayFileName ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{displayFileName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">Klik untuk pilih file, atau drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">Mendukung .csv dan .xlsx</p>
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
          <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            {parseError}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewRows.length > 0 && !result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Preview Data ({previewRows.length} baris pertama)
          </h3>
          <p className="text-xs text-gray-500 mb-4">Total yang akan diimport akan terlihat setelah proses selesai.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['name', 'meter_number', 'subscription_id', 'address', 'phone', 'email'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{row.name}</td>
                    <td className="px-4 py-2 text-gray-600 font-mono">{row.meter_number}</td>
                    <td className="px-4 py-2 text-gray-600 font-mono">{row.subscription_id}</td>
                    <td className="px-4 py-2 text-gray-600">{row.address}</td>
                    <td className="px-4 py-2 text-gray-600">{row.phone}</td>
                    <td className="px-4 py-2 text-gray-500">{row.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading || !!parseError}
              className="inline-flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Mengimport...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Import Sekarang
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Ganti File
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Hasil Import</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-700">{result.successCount}</div>
              <div className="text-sm text-green-600">Berhasil</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-700">{result.failureCount}</div>
              <div className="text-sm text-red-600">Gagal</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-700">{result.skippedCount}</div>
              <div className="text-sm text-yellow-600">Dilewati (duplikat)</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Detail Error:</p>
              <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-red-400 flex-shrink-0">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/customers')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Lihat Daftar Pelanggan
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Import Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
