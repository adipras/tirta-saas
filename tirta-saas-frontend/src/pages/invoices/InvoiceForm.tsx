import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali ke daftar tagihan
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-6 px-4 py-5 sm:p-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Buat tagihan manual</h3>
              <p className="mt-1 text-sm text-gray-500">
                Digunakan untuk tagihan di luar registrasi dan pemakaian air. Status otomatis diset sebagai belum bayar.
              </p>
            </div>

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
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Jatuh tempo *
                </label>
                <input
                  {...register('dueDate', { required: 'Jatuh tempo wajib diisi' })}
                  type="date"
                  id="dueDate"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.dueDate && <p className="mt-2 text-sm text-red-600">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Catatan
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                placeholder="Contoh: biaya pemasangan ulang, denda administrasi, atau layanan tambahan."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-md font-medium text-gray-800">Rincian tagihan</h4>
                  <p className="text-sm text-gray-500">Tambahkan item biaya yang akan masuk ke invoice manual ini.</p>
                </div>
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Total: Rp{totalAmount.toLocaleString('id-ID')}
                </div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[minmax(0,1fr)_120px_180px_auto] md:items-center">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Deskripsi item {index + 1}
                    </label>
                    <input
                      {...register(`items.${index}.description`, { required: 'Deskripsi wajib diisi' })}
                      placeholder="Deskripsi biaya"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="mt-2 text-sm text-red-600">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Qty
                    </label>
                    <input
                      {...register(`items.${index}.quantity`, { valueAsNumber: true, min: { value: 1, message: 'Minimal 1' } })}
                      type="number"
                      placeholder="Qty"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Harga satuan
                    </label>
                    <input
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
                      type="number"
                      step="1"
                      placeholder="Harga satuan"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-red-600 hover:bg-red-50 hover:text-red-800"
                    title="Hapus item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Tambah item
              </button>
            </div>
          </div>

          <div className="space-x-3 bg-gray-50 px-4 py-3 text-right sm:px-6">
            <button
              type="button"
              onClick={() => navigate('/admin/invoices')}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Buat tagihan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
