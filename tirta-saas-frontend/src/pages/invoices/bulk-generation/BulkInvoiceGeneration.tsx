import { useState } from 'react';
import { 
  CalendarIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { useToast, PageHeader } from '../../../components';

interface PreviewInvoice {
  invoice_number: string;
  customer_name: string;
  customer_code: string;
  usage_m3: number;
  water_charge: number;
  abonemen: number;
  maintenance_fee: number;
  penalty_amount: number;
  sub_total: number;
  total_amount: number;
}

interface GenerationResult {
  status: string;
  message: string;
  success: number;
  skipped: number;
  failed: number;
  total_amount: number;
  invoices: PreviewInvoice[];
  errors: string[];
  preview_only: boolean;
}

const BulkInvoiceGeneration = () => {
  const toast = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return lastMonth.toISOString().slice(0, 7); // YYYY-MM
  });
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<GenerationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post<GenerationResult>(
        '/invoices/preview-generation',
        {
          usage_month: selectedMonth,
          customer_ids: [],
        }
      );

      setPreviewData(data);
      setShowPreview(true);
    } catch  {
      toast.error('Gagal preview invoice. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm(`Yakin ingin membuat ${previewData?.success || 0} tagihan untuk periode ${selectedMonth}?`)) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post<GenerationResult>(
        API_ENDPOINTS.INVOICES.GENERATE_BULK,
        {
          usage_month: selectedMonth,
          customer_ids: [],
          preview: false,
        }
      );

      setGenerationResult(data);
      setShowPreview(false);
      setPreviewData(null);
      toast.success(`Berhasil! ${data.success} tagihan dibuat.`);
    } catch  {
      toast.error('Gagal membuat tagihan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Generate Tagihan Massal" subtitle="Buat tagihan bulanan untuk semua pelanggan secara massal" />

      {/* Selection Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="bulk-invoice-month" className="mb-2 block text-sm font-medium text-gray-700">
              <CalendarIcon className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Pilih Bulan
            </label>
            <input
              id="bulk-invoice-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              max={new Date().toISOString().slice(0, 7)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Pilih bulan pemakaian yang akan dibuatkan tagihan
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePreview}
              disabled={loading || !selectedMonth}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Memuat...' : 'Preview Tagihan'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {showPreview && previewData && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Hasil Preview — {selectedMonth}
            </h2>
            <button
              onClick={() => setShowPreview(false)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Tutup preview"
            >
              ×
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-sm font-medium text-green-600">Akan Dibuat</div>
              <div className="text-2xl font-bold text-green-700">{previewData.success}</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="text-sm font-medium text-yellow-600">Akan Dilewati</div>
              <div className="text-2xl font-bold text-yellow-700">{previewData.skipped}</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <div className="text-sm font-medium text-red-600">Gagal</div>
              <div className="text-2xl font-bold text-red-700">{previewData.failed}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-600">Total Nilai</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(previewData.total_amount)}
              </div>
            </div>
          </div>

          {/* Invoice List Preview */}
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Preview Tagihan ({previewData.invoices.length} item)
            </h3>
            <div className="max-h-96 overflow-y-auto rounded border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      No. Invoice
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Pelanggan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Pemakaian (m³)
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Biaya Air
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Abonemen
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Biaya Pemeliharaan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Denda
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.invoices.slice(0, 50).map((inv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{inv.invoice_number}</td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">{inv.customer_name}</div>
                        <div className="text-xs text-gray-500">{inv.customer_code}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {inv.usage_m3.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {formatCurrency(inv.water_charge)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {formatCurrency(inv.abonemen)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">
                        {formatCurrency(inv.maintenance_fee)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">
                        {inv.penalty_amount > 0 ? (
                          <span className="text-red-600">{formatCurrency(inv.penalty_amount)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.invoices.length > 50 && (
                <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                   ... dan {previewData.invoices.length - 50} tagihan lainnya
                 </div>
               )}
             </div>
          </div>

          {/* Errors */}
          {previewData.errors && previewData.errors.length > 0 && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-4">
              <h4 className="mb-2 text-sm font-medium text-red-800">
                <ExclamationCircleIcon className="mr-1 inline h-5 w-5" aria-hidden="true" />
                Kesalahan ({previewData.errors.length})
              </h4>
              <ul className="space-y-1 text-xs text-red-700">
                {previewData.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
                {previewData.errors.length > 10 && (
                  <li>... dan {previewData.errors.length - 10} kesalahan lainnya</li>
                )}
              </ul>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || previewData.success === 0}
              className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <CheckCircleIcon className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Buat {previewData.success} Tagihan
            </button>
          </div>
        </div>
      )}

      {/* Generation Result */}
      {generationResult && !showPreview && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" aria-hidden="true" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Tagihan Berhasil Dibuat!
            </h2>
            <p className="mb-6 text-gray-600">{generationResult.message}</p>

            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="text-sm text-green-600">Dibuat</div>
                <div className="text-2xl font-bold text-green-700">{generationResult.success}</div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <div className="text-sm text-yellow-600">Dilewati</div>
                <div className="text-2xl font-bold text-yellow-700">{generationResult.skipped}</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <div className="text-sm text-red-600">Gagal</div>
                <div className="text-2xl font-bold text-red-700">{generationResult.failed}</div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setGenerationResult(null);
                  setSelectedMonth(() => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return lastMonth.toISOString().slice(0, 7);
                  });
                }}
                className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Generate Bulan Lain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      {!showPreview && !generationResult && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex">
            <DocumentTextIcon className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" aria-hidden="true" />
            <div className="text-sm text-blue-800">
              <p className="mb-1 font-medium">Cara kerja:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Pilih bulan yang ingin dibuatkan tagihan</li>
                <li>Klik "Preview Tagihan" untuk melihat tagihan yang akan dibuat</li>
                <li>Tinjau preview lalu klik "Buat … Tagihan" untuk membuat tagihan</li>
                <li>Tagihan akan diberi nomor otomatis dan menyertakan denda keterlambatan jika berlaku</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkInvoiceGeneration;
