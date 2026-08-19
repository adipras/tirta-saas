import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import { waterRateService } from '../../services/waterRateService';
import { CustomerSearchSelect } from '../../components';
import type { WaterPemakaianFormData } from '../../types/usage';
import type { Customer, Meter, MeterStartResolution } from '../../types/customer';
import type { WaterRate } from '../../types/waterRate';
import { PageHeader } from '../../components';
import { useToast } from '../../components';
import { useAppSelector } from '../../hooks/redux';
import { extractApiErrorMessage } from '../../utils/apiError';

export default function MeterReadingForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [customerMeters, setCustomerMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [meterStartInfo, setMeterStartInfo] = useState<MeterStartResolution | null>(null);
  const [previousReading, setPreviousReading] = useState<number | null>(null);
  const [calculatedPemakaian, setCalculatedPemakaian] = useState<number>(0);
  const [activeRate, setActiveRate] = useState<WaterRate | null>(null);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [rateWarning, setRateWarning] = useState<string>('');

  const [formData, setFormData] = useState<WaterPemakaianFormData>({
    customerId: '',
    usageMonth: new Date().toISOString().slice(0, 7),
    meterEnd: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterPemakaianFormData, string>>>({});
  const canManageWaterRates = userRole === 'admin' || userRole === 'platform_owner' || userRole === 'tenant_admin';
  const inactiveRateGuidance = canManageWaterRates
    ? 'Tambahkan atau aktifkan tarif terlebih dahulu di menu Konfigurasi Tarif Air.'
    : 'Hubungi admin tenant untuk menambahkan atau mengaktifkan tarif air pelanggan ini.';

  const fetchPelanggan = useCallback(async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000, { isActive: true });
      setPelanggan(response.data);
    } catch  {
      toast.error('Gagal memuat data pelanggan');
    }
  }, [toast]);

  const fetchActiveRate = useCallback(async (subscriptionId: string) => {
    try {
      setIsCheckingRate(true);
      const rate = await waterRateService.getCurrentRate(subscriptionId);
      setActiveRate(rate);
      setRateWarning(
        rate
          ? ''
          : `Belum ada tarif air aktif untuk tipe langganan pelanggan ini. ${inactiveRateGuidance}`
      );
    } catch {
      setActiveRate(null);
      setRateWarning('Gagal memeriksa tarif air aktif untuk pelanggan ini.');
    } finally {
      setIsCheckingRate(false);
    }
  }, [inactiveRateGuidance]);

  const fetchCustomerMeters = useCallback(async (customerId: string) => {
    try {
      const result = await customerService.getCustomerWithMeters(customerId);
      const activeMeters = (result.meters ?? []).filter((m) => m.status === 'active');
      setCustomerMeters(activeMeters);
      if (activeMeters.length === 1) {
        setSelectedMeterId(activeMeters[0].id);
      } else {
        setSelectedMeterId('');
      }
    } catch {
      setCustomerMeters([]);
    }
  }, []);

  const resolveMeterStart = useCallback(async (meterId: string, month: string) => {
    try {
      const info = await customerService.resolveMeterStart(meterId, month);
      setMeterStartInfo(info);
      setPreviousReading(info.value);
    } catch {
      setMeterStartInfo(null);
      setPreviousReading(null);
    }
  }, []);

  const fetchWaterPemakaian = useCallback(async (usageId: string) => {
    try {
      setLoading(true);
      const data = await usageService.getWaterPemakaian(usageId);
      setFormData({
        customerId: data.customerId,
        usageMonth: data.usageMonth,
        meterEnd: data.meterEnd.toString(),
        notes: data.notes || '',
      });
      setPreviousReading(data.meterStart);
    } catch  {
      toast.error('Gagal memuat data pemakaian air');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchPelanggan();
    if (isEditMode && id) {
      void fetchWaterPemakaian(id);
    }
  }, [fetchPelanggan, fetchWaterPemakaian, id, isEditMode]);

  useEffect(() => {
    if (formData.customerId && !isEditMode) {
      void fetchCustomerMeters(formData.customerId);
    }
  }, [fetchCustomerMeters, formData.customerId, isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    if (selectedMeterId && formData.usageMonth) {
      void resolveMeterStart(selectedMeterId, formData.usageMonth);
    } else {
      setPreviousReading(null);
      setMeterStartInfo(null);
    }
  }, [formData.usageMonth, isEditMode, resolveMeterStart, selectedMeterId]);

  useEffect(() => {
    if (!formData.customerId) {
      setActiveRate(null);
      setRateWarning('');
      return;
    }

    const selectedCustomer = customers.find((customer) => customer.id === formData.customerId);
    if (!selectedCustomer?.subscription_id) {
      setActiveRate(null);
      setRateWarning('Tipe langganan pelanggan belum tersedia.');
      return;
    }

    void fetchActiveRate(selectedCustomer.subscription_id);
  }, [customers, fetchActiveRate, formData.customerId]);

  useEffect(() => {
    if (previousReading !== null && formData.meterEnd) {
      const meterEnd = parseFloat(formData.meterEnd);
      if (!isNaN(meterEnd)) {
        setCalculatedPemakaian(Math.max(0, meterEnd - previousReading));
      }
    }
  }, [previousReading, formData.meterEnd]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaterPemakaianFormData, string>> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Pelanggan wajib dipilih';
    }

    if (!formData.usageMonth) {
      newErrors.usageMonth = 'Bulan pemakaian wajib diisi';
    }

    const meterEnd = parseFloat(formData.meterEnd);
    if (isNaN(meterEnd) || meterEnd < 0) {
      newErrors.meterEnd = 'Meter akhir harus berupa angka dan tidak boleh negatif';
    } else if (previousReading !== null && meterEnd < previousReading) {
      newErrors.meterEnd = `Meter akhir tidak boleh lebih kecil dari meter sebelumnya (${previousReading.toFixed(2)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof WaterPemakaianFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isEditMode && !activeRate) {
      toast.error(rateWarning || 'Tarif air aktif belum tersedia untuk pelanggan ini');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerId: formData.customerId,
        meterId: selectedMeterId || undefined,
        usageMonth: formData.usageMonth,
        meterEnd: parseFloat(formData.meterEnd),
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode && id) {
        await usageService.updateWaterPemakaian(id, {
          meterEnd: payload.meterEnd,
          notes: payload.notes,
        });
        toast.success('Pembacaan meter berhasil diperbarui');
      } else {
        await usageService.createWaterPemakaian(payload);
        toast.success('Pembacaan meter berhasil dicatat');
      }

      navigate('/admin/usage');
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(
          error,
          `Gagal ${isEditMode ? 'memperbarui' : 'mencatat'} pembacaan meter`
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin/usage')}
        className="flex items-center gap-1.5 text-[13px] text-surface-400 hover:text-surface-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Kembali ke Pemakaian Air
      </button>

      <PageHeader
        title={isEditMode ? 'Ubah Pembacaan Meter' : 'Catat Pembacaan Meter'}
        subtitle={isEditMode ? 'Perbarui pembacaan meter, pemakaian akan dihitung ulang' : 'Masukkan meter akhir untuk menghitung pemakaian air'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="card p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-900">Informasi Pelanggan</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <CustomerSearchSelect
                customers={customers}
                value={formData.customerId}
                onChange={(customerId) => {
                  setFormData({ ...formData, customerId });
                  setErrors({ ...errors, customerId: '' });
                  setCustomerMeters([]);
                  setSelectedMeterId('');
                  setMeterStartInfo(null);
                  setPreviousReading(null);
                }}
                disabled={isEditMode}
                error={errors.customerId}
                label="Pelanggan"
                required
              />
            </div>

            <div>
              <label htmlFor="usageMonth" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Bulan Pemakaian <span className="text-danger-500">*</span>
              </label>
              <input
                type="month"
                id="usageMonth"
                name="usageMonth"
                value={formData.usageMonth}
                onChange={handleChange}
                disabled={isEditMode}
                className={`input-base ${
                  errors.usageMonth ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10' : ''
                } ${isEditMode ? 'bg-surface-50 cursor-not-allowed opacity-60' : ''}`}
              />
              {errors.usageMonth && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.usageMonth}</p>
              )}
            </div>
          </div>

          {/* Meter Selection */}
          {formData.customerId && !isEditMode && (
            <div className="mt-5">
              <label className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Pilih Meter <span className="text-danger-500">*</span>
              </label>
              {customerMeters.length === 0 ? (
                <p className="text-[12px] text-surface-400">Memuat meter...</p>
              ) : customerMeters.length === 1 ? (
                <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-[13px] text-surface-700">
                  {customerMeters[0].meter_number}
                  {customerMeters[0].location_name && <span className="text-surface-400"> ({customerMeters[0].location_name})</span>}
                  <span className="ml-2 text-[11px] text-surface-400">(satu-satunya meter)</span>
                </div>
              ) : (
                <select
                  value={selectedMeterId}
                  onChange={(e) => setSelectedMeterId(e.target.value)}
                  className="input-base"
                >
                  <option value="">Pilih meter</option>
                  {customerMeters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.meter_number}{m.location_name ? ` (${m.location_name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Rate Status */}
          {formData.customerId && (
            <div className={`mt-5 rounded-xl border p-4 ${
              activeRate ? 'border-success-200 bg-success-50' : 'border-warning-200 bg-warning-50'
            }`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-surface-900">
                    {isCheckingRate ? 'Memeriksa tarif...' : 'Status Tarif Air'}
                  </p>
                  <p className="mt-1 text-[12px] text-surface-500">
                    Tipe langganan: {customers.find((c) => c.id === formData.customerId)?.subscription?.name || '—'}
                  </p>
                  {activeRate ? (
                    <p className="mt-1 text-[12px] font-medium text-success-700">
                      Tarif aktif: Rp {activeRate.amount.toLocaleString('id-ID')} / m³
                    </p>
                  ) : (
                    <p className="mt-1 text-[12px] text-warning-700">
                      {rateWarning || 'Tarif air aktif belum tersedia.'}
                    </p>
                  )}
                </div>

                {!activeRate && !isCheckingRate && !isEditMode && canManageWaterRates && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/water-rates')}
                    className="btn-secondary shrink-0 text-[12px]"
                  >
                    Buka Konfigurasi Tarif
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meter Reading */}
        <div className="card p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-surface-900">Pembacaan Meter</h3>
            <p className="mt-1 text-[12px] text-surface-400">
              Hanya <span className="font-medium text-surface-600">Angka Akhir Meter</span> yang perlu diisi. Nilai lainnya dihitung otomatis.
            </p>
          </div>

          {!isEditMode && meterStartInfo?.source === 'default' && (
            <div className="mb-5 flex gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-warning-500" />
              <div>
                <p className="text-[12px] font-semibold text-warning-800">Angka awal meter belum diatur (masih 0.00)</p>
                <p className="mt-1 text-[12px] text-warning-700">
                  Ini bisa menyebabkan pemakaian terhitung sangat besar. Perbarui "Angka Awal Meter" di halaman Detail Pelanggan sesuai kondisi fisik.
                </p>
              </div>
            </div>
          )}

          {/* Meter values */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Angka Awal — read-only */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <label className="text-[13px] font-medium text-surface-500">Angka Awal</label>
                <span className="rounded-md bg-surface-100 px-1.5 py-0.5 text-[10px] font-medium text-surface-500">
                  Otomatis
                </span>
              </div>
              <div className="flex min-h-[42px] items-center rounded-lg border border-dashed border-surface-200 bg-surface-50 px-3 py-2 text-[13px] text-surface-600 select-none">
                {previousReading !== null ? (
                  <span className="font-mono font-medium">{previousReading.toFixed(2)}</span>
                ) : (
                  <span className="italic text-surface-300">—</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-surface-400">
                {meterStartInfo ? meterStartInfo.description : 'Pilih pelanggan & meter'}
              </p>
            </div>

            {/* Meter Akhir — editable */}
            <div>
              <label htmlFor="meterEnd" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Angka Akhir Meter <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                id="meterEnd"
                name="meterEnd"
                value={formData.meterEnd}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full rounded-lg border-2 px-3 py-2.5 text-[13px] font-mono transition-all ${
                  errors.meterEnd
                    ? 'border-danger-400 bg-danger-50 focus:border-danger-500 focus:ring-2 focus:ring-danger-100 focus:outline-none'
                    : 'border-brand-400 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'
                }`}
                placeholder="0.00"
                autoComplete="off"
              />
              {errors.meterEnd ? (
                <p className="mt-1 text-[11px] text-danger-600">{errors.meterEnd}</p>
              ) : (
                <p className="mt-1 text-[11px] text-brand-500">Ketik angka yang terbaca di meter</p>
              )}
            </div>

            {/* Pemakaian — computed */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <label className="text-[13px] font-medium text-surface-500">Pemakaian</label>
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                  Dihitung
                </span>
              </div>
              <div className="flex min-h-[42px] items-center rounded-lg border border-dashed border-brand-200 bg-brand-50 px-3 py-2 select-none">
                <span className="font-mono text-lg font-bold text-brand-700">
                  {calculatedPemakaian.toFixed(2)}
                </span>
                <span className="ml-1 text-[12px] font-medium text-brand-500">m³</span>
              </div>
              <p className="mt-1 text-[11px] text-surface-400">Akhir − Awal</p>
            </div>
          </div>

          {/* Catatan */}
          <div className="mt-5">
            <label htmlFor="notes" className="mb-1.5 block text-[13px] font-medium text-surface-700">
              Catatan <span className="text-[11px] font-normal text-surface-400">(opsional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="input-base resize-none"
              placeholder="Catatan tambahan tentang pembacaan ini..."
            />
          </div>
        </div>

        {/* High usage warning */}
        {calculatedPemakaian > 100 && (
          <div className="flex gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-warning-500" />
            <p className="text-[13px] text-warning-800">
              <strong>Pemakaian tinggi:</strong> {calculatedPemakaian.toFixed(2)} m³ — pastikan angka meter sudah benar.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-surface-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/usage')}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || (!isEditMode && !activeRate) || isCheckingRate}
            className="btn-primary"
          >
            {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui Pembacaan' : 'Catat Pembacaan'}
          </button>
        </div>
      </form>
    </div>
  );
}
