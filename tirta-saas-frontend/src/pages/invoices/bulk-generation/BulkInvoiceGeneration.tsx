import { useState } from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { ConfirmModal, PageHeader, useToast } from '../../../components';

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
    return lastMonth.toISOString().slice(0, 7);
  });

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<GenerationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

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
    } catch {
      toast.error('Gagal preview invoice. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
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
      setShowGenerateConfirm(false);
      toast.success(`Berhasil! ${data.success} tagihan dibuat.`);
    } catch {
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
      <PageHeader title="Buat Tagihan Massal" subtitle="Buat tagihan bulanan untuk semua pelanggan secara massal" />

      {/* Selection Form */}
      <div className="card p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="bulk-invoice-month" className="mb-2 block text-[13px] font-medium text-surface-700">
              <CalendarIcon className="mr-1.5 inline h-4 w-4 text-surface-400" aria-hidden="true" />
              Pilih Bulan
            </label>
            <input
              id="bulk-invoice-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-base"
              max={new Date().toISOString().slice(0, 7)}
            />
            <p className="mt-1.5 text-[12px] text-surface-400">
              Pilih bulan pemakaian yang akan dibuatkan tagihan
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePreview}
              disabled={loading || !selectedMonth}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Memuat...
                </span>
              ) : (
                'Preview Tagihan'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {showPreview && previewData && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-surface-900">
              Hasil Preview — {selectedMonth}
            </h2>
            <button
              onClick={() => setShowPreview(false)}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              aria-label="Tutup preview"
            >
              ×
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-success-200 bg-success-50 p-4">
              <div className="text-[12px] font-medium text-success-600">Akan Dibuat</div>
              <div className="mt-1 text-2xl font-bold text-success-700">{previewData.success}</div>
            </div>
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
              <div className="text-[12px] font-medium text-warning-600">Akan Dilewati</div>
              <div className="mt-1 text-2xl font-bold text-warning-700">{previewData.skipped}</div>
            </div>
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
              <div className="text-[12px] font-medium text-danger-600">Gagal</div>
              <div className="mt-1 text-2xl font-bold text-danger-700">{previewData.failed}</div>
            </div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="text-[12px] font-medium text-brand-600">Total Nilai</div>
              <div className="mt-1 text-2xl font-bold text-brand-700">
                {formatCurrency(previewData.total_amount)}
              </div>
            </div>
          </div>

          {/* Invoice List Preview */}
          <div className="mb-4">
            <h3 className="mb-2 text-[13px] font-medium text-surface-600">
              Preview Tagihan ({previewData.invoices.length} item)
            </h3>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-surface-100">
              <table className="min-w-full divide-y divide-surface-100">
                <thead className="sticky top-0 bg-surface-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      No. Invoice
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Pelanggan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Pemakaian (m³)
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Biaya Air
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Abonemen
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Biaya Pemeliharaan
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Denda
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-surface-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-surface-100">
                  {previewData.invoices.slice(0, 50).map((inv, idx) => (
                    <tr key={idx} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-4 py-2 text-[13px] text-surface-900">{inv.invoice_number}</td>
                      <td className="px-4 py-2">
                        <div className="text-[13px] text-surface-900">{inv.customer_name}</div>
                        <div className="text-[12px] text-surface-400">{inv.customer_code}</div>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right text-surface-900">
                        {(inv.usage_m3 ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right text-surface-900">
                        {formatCurrency(inv.water_charge ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right text-surface-900">
                        {formatCurrency(inv.abonemen ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right text-surface-900">
                        {formatCurrency(inv.maintenance_fee ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right">
                        {(inv.penalty_amount ?? 0) > 0 ? (
                          <span className="text-danger-600">{formatCurrency(inv.penalty_amount)}</span>
                        ) : (
                          <span className="text-surface-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-[13px] text-right font-medium text-surface-900">
                        {formatCurrency(inv.total_amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.invoices.length > 50 && (
                <div className="bg-surface-50 px-4 py-2 text-[13px] text-surface-500 text-center">
                  ... dan {previewData.invoices.length - 50} tagihan lainnya
                </div>
              )}
            </div>
          </div>

          {/* Errors */}
          {previewData.errors && previewData.errors.length > 0 && (
            <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
              <h4 className="mb-2 text-[13px] font-medium text-danger-800">
                <ExclamationCircleIcon className="mr-1 inline h-4 w-4" aria-hidden="true" />
                Kesalahan ({previewData.errors.length})
              </h4>
              <ul className="space-y-1 text-[12px] text-danger-700">
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
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              onClick={() => setShowGenerateConfirm(true)}
              disabled={loading || previewData.success === 0}
              className="btn-primary"
            >
              <CheckCircleIcon className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
              Buat {previewData.success} Tagihan
            </button>
          </div>
        </div>
      )}

      {/* Generation Result */}
      {generationResult && !showPreview && (
        <div className="card p-6">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success-50 mb-4">
              <CheckCircleIcon className="h-10 w-10 text-success-500" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-surface-900">
              Tagihan Berhasil Dibuat!
            </h2>
            <p className="mb-6 text-[13px] text-surface-500">{generationResult.message}</p>

            <div className="mx-auto grid max-w-2xl grid-cols-3 gap-4">
              <div className="rounded-xl border border-success-200 bg-success-50 p-4">
                <div className="text-[12px] text-success-600">Dibuat</div>
                <div className="mt-1 text-2xl font-bold text-success-700">{generationResult.success}</div>
              </div>
              <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
                <div className="text-[12px] text-warning-600">Dilewati</div>
                <div className="mt-1 text-2xl font-bold text-warning-700">{generationResult.skipped}</div>
              </div>
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
                <div className="text-[12px] text-danger-600">Gagal</div>
                <div className="mt-1 text-2xl font-bold text-danger-700">{generationResult.failed}</div>
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
                className="btn-primary"
              >
                Buat untuk Bulan Lain
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showGenerateConfirm}
        onClose={() => setShowGenerateConfirm(false)}
        onConfirm={handleGenerate}
        title="Buat Tagihan Massal"
        message={`Yakin ingin membuat ${previewData?.success || 0} tagihan untuk periode ${selectedMonth}?`}
        confirmText="Ya, buat tagihan"
        cancelText="Batal"
        type="warning"
        isLoading={loading}
      />

      {/* Info Card */}
      {!showPreview && !generationResult && (
        <div className="rounded-xl border border-info-200 bg-info-50 p-4">
          <div className="flex">
            <DocumentTextIcon className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-info-600" aria-hidden="true" />
            <div className="text-[13px] text-info-800">
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
