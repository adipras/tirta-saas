import { useState } from 'react';
import { useForm } from 'react-hook-form';
import meterService from '../../services/meterService';
import type { Meter, CreateMeterDto, UpdateMeterDto } from '../../types/meter';
import type { SubscriptionType } from '../../types/subscription';
import { useToast } from '../../components';

type MeterFormData = {
  meter_number: string;
  subscription_type_id: string;
  brand?: string;
  model?: string;
  install_date: string;
  initial_reading?: number;
  notes?: string;
  status?: 'active' | 'inactive' | 'broken' | 'replaced';
};

interface MeterFormProps {
  customerId: string;
  meter?: Meter | null;
  subscriptionTypes: SubscriptionType[];
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function MeterForm({
  customerId,
  meter,
  subscriptionTypes,
  onSaveSuccess,
  onCancel,
}: MeterFormProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<MeterFormData>({
    defaultValues: meter ? {
      meter_number: meter.meter_number,
      subscription_type_id: meter.subscription_type_id || '',
      brand: meter.brand || '',
      model: meter.model || '',
      install_date: meter.install_date.split('T')[0],
      initial_reading: meter.initial_reading,
      notes: meter.notes || '',
      status: meter.status,
    } : {
      meter_number: '',
      subscription_type_id: '',
      brand: '',
      model: '',
      install_date: new Date().toISOString().split('T')[0],
      initial_reading: 0,
      notes: '',
      status: 'active',
    },
  });

  const status = watch('status');

  const onSubmit = async (data: MeterFormData): Promise<void> => {
    // Validate required fields
    if (!data.meter_number.trim()) {
      toast.error('Nomor meter harus diisi');
      return;
    }
    if (!data.subscription_type_id.trim()) {
      toast.error('Tipe langganan harus dipilih');
      return;
    }
    if (!data.install_date) {
      toast.error('Tanggal instalasi harus diisi');
      return;
    }

    try {
      setSaving(true);

      if (meter) {
        // Update existing meter
        const updateDto: UpdateMeterDto = {
          meter_number: data.meter_number,
          subscription_type_id: data.subscription_type_id,
          brand: data.brand,
          model: data.model,
          install_date: data.install_date,
          notes: data.notes,
          status: (data.status || 'active') as 'active' | 'inactive' | 'broken' | 'replaced',
        };
        await meterService.updateMeter(customerId, meter.id, updateDto);
      } else {
        // Create new meter
        const createDto: CreateMeterDto = {
          meter_number: data.meter_number,
          subscription_type_id: data.subscription_type_id,
          brand: data.brand,
          model: data.model,
          install_date: data.install_date,
          initial_reading: data.initial_reading || 0,
          notes: data.notes,
        };
        await meterService.createMeter(customerId, createDto);
      }

      onSaveSuccess();
      reset();
    } catch {
      toast.error('Gagal menyimpan meter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">
          {meter ? 'Edit Meter' : 'Tambah Meter Baru'}
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Meter Number */}
        <div>
          <label htmlFor="meter_number" className="block text-sm font-medium text-gray-700">
            Nomor Meter <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('meter_number', { required: 'Nomor meter harus diisi' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Contoh: MTR-001"
          />
          {errors.meter_number && (
            <p className="mt-1 text-sm text-red-600">{errors.meter_number.message}</p>
          )}
        </div>

        {/* Subscription Type */}
        <div>
          <label htmlFor="subscription_type_id" className="block text-sm font-medium text-gray-700">
            Tipe Langganan <span className="text-red-500">*</span>
          </label>
          <select
            {...register('subscription_type_id', { required: 'Tipe langganan harus dipilih' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">-- Pilih Tipe Langganan --</option>
            {subscriptionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.subscription_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.subscription_type_id.message}</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
            Merek
          </label>
          <input
            type="text"
            {...register('brand')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Contoh: Sensus"
          />
        </div>

        {/* Model */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model
          </label>
          <input
            type="text"
            {...register('model')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Contoh: VistaFlow"
          />
        </div>

        {/* Install Date */}
        <div>
          <label htmlFor="install_date" className="block text-sm font-medium text-gray-700">
            Tanggal Instalasi <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('install_date', { required: 'Tanggal instalasi harus diisi' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.install_date && (
            <p className="mt-1 text-sm text-red-600">{errors.install_date.message}</p>
          )}
        </div>

        {/* Initial Reading */}
        <div>
          <label htmlFor="initial_reading" className="block text-sm font-medium text-gray-700">
            Initial Reading (m³)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('initial_reading')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
          />
          {errors.initial_reading && (
            <p className="mt-1 text-sm text-red-600">{errors.initial_reading.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Catatan
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Catatan tambahan tentang meter ini"
        />
      </div>

      {/* Status (only for edit) */}
      {meter && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            {...register('status')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
            <option value="broken">Rusak</option>
            <option value="replaced">Diganti</option>
          </select>
          {status !== 'active' && (
            <p className="mt-2 text-sm text-yellow-600">
              ⚠️ Meter dengan status selain "Aktif" tidak akan digunakan untuk pencatatan pemakaian baru.
            </p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : meter ? 'Perbarui' : 'Tambah'}
        </button>
      </div>
    </form>
  );
}
