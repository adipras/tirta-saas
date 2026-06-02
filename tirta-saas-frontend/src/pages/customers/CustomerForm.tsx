import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import serviceAreaService from '../../services/serviceAreaService';
import type { UpdateCustomerDto, SubscriptionType } from '../../types/customer';
import type { ServiceArea } from '../../types/serviceArea';
import { PageHeader } from '../../components';
import { useToast } from '../../components';

interface CustomerBaseFormData {
  name: string;
  email?: string;
  password: string;
  service_area_id?: string;
  phone?: string;
  address?: string;
}

interface MeterFormRow {
  meter_number: string;
  subscription_type_id: string;
  install_date: string;
  initial_reading: string;
  brand: string;
  model: string;
  notes: string;
}

const emptyMeterRow = (): MeterFormRow => ({
  meter_number: '',
  subscription_type_id: '',
  install_date: new Date().toISOString().slice(0, 10),
  initial_reading: '0',
  brand: '',
  model: '',
  notes: '',
});

interface CustomerFormProps {
  mode: 'create' | 'edit';
}

export default function CustomerForm({ mode }: CustomerFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [meters, setMeters] = useState<MeterFormRow[]>([emptyMeterRow()]);
  const [meterErrors, setMeterErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerBaseFormData>();

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await customerService.getSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch {
      toast.error('Gagal memuat daftar golongan langganan');
    }
  }, [toast]);

  const fetchCustomer = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      const { customer } = await customerService.getCustomerWithMeters(customerId);
      reset({
        name: customer.name,
        email: customer.email || '',
        password: '',
        service_area_id: customer.service_area_id || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } catch {
      toast.error('Gagal memuat data pelanggan');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  }, [navigate, reset, toast]);

  const fetchServiceAreas = useCallback(async () => {
    try {
      const items = await serviceAreaService.getServiceAreas();
      setServiceAreas(items.filter((area) => area.is_active));
    } catch {
      setServiceAreas([]);
    }
  }, []);

  useEffect(() => {
    void fetchSubscriptionTypes();
    void fetchServiceAreas();
    if (mode === 'edit' && id) {
      void fetchCustomer(id);
    }
  }, [fetchCustomer, fetchServiceAreas, fetchSubscriptionTypes, id, mode]);

  const updateMeter = (index: number, field: keyof MeterFormRow, value: string) => {
    setMeters((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMeterRow = () => {
    setMeters((prev) => [...prev, emptyMeterRow()]);
    setMeterErrors((prev) => [...prev, '']);
  };

  const removeMeterRow = (index: number) => {
    if (meters.length <= 1) return;
    setMeters((prev) => prev.filter((_, i) => i !== index));
    setMeterErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const validateMeters = (): boolean => {
    const newErrors = meters.map((m) => {
      if (!m.meter_number.trim()) return 'Nomor meter wajib diisi';
      if (!m.subscription_type_id) return 'Golongan langganan wajib dipilih';
      if (!m.install_date) return 'Tanggal pasang wajib diisi';
      return '';
    });
    setMeterErrors(newErrors);
    return newErrors.every((e) => e === '');
  };

  const onSubmit = async (data: CustomerBaseFormData) => {
    if (mode === 'create' && !validateMeters()) return;

    try {
      setSaving(true);

      if (mode === 'create') {
        const result = await customerService.createCustomer({
          ...data,
          email: data.email?.trim() || undefined,
          service_area_id: data.service_area_id || undefined,
          meters: meters.map((m) => ({
            meter_number: m.meter_number.trim(),
            subscription_type_id: m.subscription_type_id,
            install_date: m.install_date,
            initial_reading: parseFloat(m.initial_reading) || 0,
            brand: m.brand || undefined,
            model: m.model || undefined,
            notes: m.notes || undefined,
          })),
        });
        const invoiceCount = result.registration_invoices?.length ?? 0;
        toast.success(
          `Pelanggan berhasil ditambahkan. ${invoiceCount} invoice registrasi telah dibuat.`
        );
        navigate(`/admin/customers/${result.customer.id}`);
      } else if (mode === 'edit' && id) {
        await customerService.updateCustomer(id, {
          ...data,
          service_area_id: data.service_area_id || undefined,
        } as UpdateCustomerDto);
        toast.success('Pelanggan berhasil diperbarui');
        navigate('/admin/customers');
      }
    } catch {
      toast.error(`Gagal ${mode === 'create' ? 'menambahkan' : 'memperbarui'} pelanggan`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Tambah Pelanggan' : 'Ubah Pelanggan'}
        subtitle={
          mode === 'create'
            ? 'Daftarkan pelanggan baru beserta meter yang dipasang.'
            : 'Perbarui informasi pelanggan.'
        }
        actions={
          <button
            onClick={() => navigate('/admin/customers')}
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Kembali ke Pelanggan
          </button>
        }
      />

      <div className="md:mt-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              {/* === Data Pelanggan === */}
              <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Data Pelanggan
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap *
                  </label>
                  <input
                    {...register('name', { required: 'Nama wajib diisi' })}
                    type="text"
                    id="name"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Budi Santoso"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Alamat Email
                  </label>
                  <input
                    {...register('email', {
                      validate: (value) =>
                        !value ||
                        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
                        'Alamat email tidak valid',
                    })}
                    type="email"
                    id="email"
                    disabled={mode === 'edit'}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                    placeholder="budi@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password (Create mode only) */}
                {mode === 'create' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Kata Sandi *
                    </label>
                    <input
                      {...register('password', {
                        required: 'Kata sandi wajib diisi',
                        minLength: { value: 6, message: 'Kata sandi minimal 6 karakter' },
                      })}
                      type="password"
                      id="password"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Minimal 6 karakter"
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Nomor Telepon
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="081234567890"
                  />
                </div>

                {/* Service Area */}
                <div>
                  <label htmlFor="service_area_id" className="block text-sm font-medium text-gray-700">
                    Area Layanan
                  </label>
                  <select
                    {...register('service_area_id')}
                    id="service_area_id"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Pilih area layanan</option>
                    {serviceAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.code} - {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Alamat
                  </label>
                  <textarea
                    {...register('address')}
                    id="address"
                    rows={3}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="Jl. Mawar No. 1, RT 01 RW 05"
                  />
                </div>
              </div>

              {/* === Data Meter (Create only) === */}
              {mode === 'create' && (
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Data Meter <span className="text-red-500">*</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addMeterRow}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Tambah Meter
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Setiap meter akan otomatis menghasilkan invoice registrasi.
                  </p>

                  <div className="space-y-4">
                    {meters.map((meter, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        {meters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMeterRow(index)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
                            title="Hapus meter ini"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Meter {index + 1}
                        </p>
                        {meterErrors[index] && (
                          <p className="mb-2 text-sm text-red-600">{meterErrors[index]}</p>
                        )}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Nomor Meter *
                            </label>
                            <input
                              type="text"
                              value={meter.meter_number}
                              onChange={(e) => updateMeter(index, 'meter_number', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="MET-001"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Golongan Langganan *
                            </label>
                            <select
                              value={meter.subscription_type_id}
                              onChange={(e) => updateMeter(index, 'subscription_type_id', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Pilih golongan</option>
                              {subscriptionTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name} — Rp {t.monthly_fee.toLocaleString()}/bln
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Tanggal Pasang *
                            </label>
                            <input
                              type="date"
                              value={meter.install_date}
                              onChange={(e) => updateMeter(index, 'install_date', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Angka Awal Meter
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={meter.initial_reading}
                              onChange={(e) => updateMeter(index, 'initial_reading', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Merek Meter
                            </label>
                            <input
                              type="text"
                              value={meter.brand}
                              onChange={(e) => updateMeter(index, 'brand', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Sensus"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">
                              Model Meter
                            </label>
                            <input
                              type="text"
                              value={meter.model}
                              onChange={(e) => updateMeter(index, 'model', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="iPERL"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-xs font-medium text-gray-600">
                              Catatan
                            </label>
                            <input
                              type="text"
                              value={meter.notes}
                              onChange={(e) => updateMeter(index, 'notes', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Keterangan tambahan (opsional)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 bg-gray-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => navigate('/admin/customers')}
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {saving
                  ? 'Menyimpan...'
                  : mode === 'create'
                  ? 'Tambah Pelanggan'
                  : 'Perbarui Pelanggan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
