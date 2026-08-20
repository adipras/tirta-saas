import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import invoiceService, { type CreateInvoicePayload } from '../../services/invoiceService';
import customerService from '../../services/customerService';
import CustomerSearchSelect from '../../components/CustomerSearchSelect';
import type { Customer } from '../../types/customer';
import { useToast } from '../../components';

interface InvoiceFormData {
  customerId: string;
  dueDate: string;
  notes: string;
  items: Array<{
    description: string;
    quantity: number | string;
    unitPrice: number;
  }>;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    defaultValues: {
      customerId: '',
      dueDate: '',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });
  const watchedCustomerId = useWatch({ control, name: 'customerId' });
  const totalAmount = (watchedItems || []).reduce((sum, item) => {
    const quantity = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.unitPrice) || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await customerService.getPelanggan(1, 1000);
        setCustomers(response.data);
      } catch {
        toast.error('Gagal memuat data pelanggan');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [toast]);

  const onSubmit = async (data: InvoiceFormData) => {
    if (!data.customerId) {
      toast.error('Pelanggan wajib dipilih');
      return;
    }

    const items = data.items
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.description !== '' && item.quantity > 0 && item.unitPrice >= 0);

    if (items.length === 0) {
      toast.error('Tambahkan minimal satu item tagihan yang valid');
      return;
    }

    const payload: CreateInvoicePayload = {
      customerId: data.customerId,
      dueDate: data.dueDate,
      notes: data.notes.trim() || undefined,
      items,
    };

    try {
      setSaving(true);
      await invoiceService.createInvoice(payload);
      toast.success('Tagihan berhasil dibuat');
      navigate('/admin/invoices');
    } catch {
      toast.error('Gagal membuat tagihan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="card p-6 space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-surface-100" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-10 animate-pulse rounded-xl bg-surface-100" />
            <div className="h-10 animate-pulse rounded-xl bg-surface-100" />
          </div>
          <div className="h-20 animate-pulse rounded-xl bg-surface-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button onClick={() => navigate('/admin/invoices')} className="hover:text-surface-600 transition-colors">
          Tagihan
        </button>
        <span>/</span>
        <span className="text-surface-700 font-medium">Buat Tagihan Manual</span>
      </nav>

      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/invoices')}
        className="inline-flex items-center gap-1.5 text-[13px] text-surface-400 hover:text-surface-600 transition-colors"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Kembali ke daftar tagihan
      </button>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="border-b border-surface-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2">
                <DocumentTextIcon className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-surface-900">Buat tagihan manual</h3>
                <p className="mt-0.5 text-[12px] text-surface-400">
                  Digunakan untuk tagihan di luar registrasi dan pemakaian air. Status otomatis diset sebagai belum bayar.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-6 px-6 py-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <input
                  type="hidden"
                  {...register('customerId', { required: 'Pelanggan wajib dipilih' })}
                />
                <CustomerSearchSelect
                  customers={customers}
                  value={watchedCustomerId || ''}
                  onChange={(customerId) => {
                    setValue('customerId', customerId, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  error={errors.customerId?.message}
                  label="Pelanggan"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                  Jatuh tempo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDaysIcon className="h-4 w-4 text-surface-400" />
                  </div>
                  <input
                    {...register('dueDate', { required: 'Jatuh tempo wajib diisi' })}
                    type="date"
                    id="dueDate"
                    className="input-base pl-10"
                  />
                </div>
                {errors.dueDate && <p className="mt-1.5 text-[12px] text-danger-600">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Catatan
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                placeholder="Contoh: biaya pemasangan ulang, denda administrasi, atau layanan tambahan."
                className="input-base"
              />
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-medium text-surface-800">Rincian tagihan</h4>
                  <p className="text-[12px] text-surface-400">Tambahkan item biaya yang akan masuk ke invoice manual ini.</p>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  Total: Rp{totalAmount.toLocaleString('id-ID')}
                </div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-surface-100 bg-surface-50/50 p-4 md:grid-cols-[minmax(0,1fr)_120px_180px_auto] md:items-center">
                  <div>
                    <label htmlFor={`items.${index}.description`} className="mb-1 block text-[12px] font-medium text-surface-600">
                      Deskripsi item {index + 1}
                    </label>
                    <input
                      {...register(`items.${index}.description`, { required: 'Deskripsi wajib diisi' })}
                      id={`items.${index}.description`}
                      placeholder="Deskripsi biaya"
                      className="input-base"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="mt-1 text-[12px] text-danger-600">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`items.${index}.quantity`} className="mb-1 block text-[12px] font-medium text-surface-600">
                      Qty
                    </label>
                    <input
                      {...register(`items.${index}.quantity`, { valueAsNumber: true, min: { value: 1, message: 'Minimal 1' } })}
                      id={`items.${index}.quantity`}
                      type="number"
                      placeholder="Qty"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label htmlFor={`items.${index}.unitPrice`} className="mb-1 block text-[12px] font-medium text-surface-600">
                      Harga satuan
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BanknotesIcon className="h-3.5 w-3.5 text-surface-400" />
                      </div>
                      <input
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
                        id={`items.${index}.unitPrice`}
                        type="number"
                        step="1"
                        placeholder="Harga satuan"
                        className="input-base pl-8"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-danger-500 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                    aria-label={`Hapus item ${index + 1}`}
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Tambah item
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-surface-100 bg-surface-50/50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/invoices')}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Buat tagihan
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
