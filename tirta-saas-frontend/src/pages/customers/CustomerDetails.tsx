import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { Customer, Meter, AddMeterDto, SubscriptionType } from '../../types/customer';
import { PageHeader } from '../../components';
import { useToast } from '../../components';

interface AddMeterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (meter: Meter) => void;
  customerId: string;
  subscriptionTypes: SubscriptionType[];
}

function AddMeterModal({ open, onClose, onSuccess, customerId, subscriptionTypes }: AddMeterModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddMeterDto>({
    meter_number: '',
    subscription_type_id: '',
    install_date: new Date().toISOString().slice(0, 10),
    initial_reading: 0,
    brand: '',
    model: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meter_number || !form.subscription_type_id || !form.install_date) {
      toast.error('Nomor meter, golongan langganan, dan tanggal pasang wajib diisi');
      return;
    }
    try {
      setSaving(true);
      const result = await customerService.addMeterToCustomer(customerId, form);
      toast.success('Meter berhasil ditambahkan. Invoice registrasi telah dibuat.');
      onSuccess(result.meter);
      onClose();
    } catch {
      toast.error('Gagal menambahkan meter');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Meter</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nomor Meter *</label>
              <input
                type="text"
                value={form.meter_number}
                onChange={(e) => setForm((f) => ({ ...f, meter_number: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="MET-002"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Golongan Langganan *</label>
              <select
                value={form.subscription_type_id}
                onChange={(e) => setForm((f) => ({ ...f, subscription_type_id: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700">Tanggal Pasang *</label>
              <input
                type="date"
                value={form.install_date}
                onChange={(e) => setForm((f) => ({ ...f, install_date: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Angka Awal Meter</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.initial_reading ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, initial_reading: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Merek</label>
                <input
                  type="text"
                  value={form.brand || ''}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  value={form.model || ''}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <input
                type="text"
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Tambah Meter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetails() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMeter, setShowAddMeter] = useState(false);

  const fetchCustomer = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      const result = await customerService.getCustomerWithMeters(customerId);
      setCustomer(result.customer);
      setMeters(result.meters ?? []);
    } catch {
      toast.error('Gagal memuat data pelanggan');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (id) {
      void fetchCustomer(id);
      void customerService.getSubscriptionTypes().then(setSubscriptionTypes).catch(() => {});
    } else {
      setLoading(false);
    }
  }, [id, fetchCustomer]);

  const handleStatusChange = async (newIsActive: boolean) => {
    if (!customer) return;
    try {
      const updated = newIsActive
        ? await customerService.activateCustomer(customer.id)
        : await customerService.deactivateCustomer(customer.id);
      if (updated) {
        setCustomer(updated as Customer);
        toast.success(`Pelanggan berhasil ${newIsActive ? 'diaktifkan' : 'dinonaktifkan'}`);
      }
    } catch {
      toast.error('Gagal memperbarui status pelanggan');
    }
  };

  const handleMeterAdded = (newMeter: Meter) => {
    setMeters((prev) => [...prev, newMeter]);
  };

  const statusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? (
        <><CheckCircleIcon className="mr-2 h-4 w-4" />Active</>
      ) : (
        <><XCircleIcon className="mr-2 h-4 w-4" />Inactive</>
      )}
    </span>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-12"><p className="text-gray-500">Customer not found</p></div>;
  }

  const primaryMeterNumber = meters[0]?.meter_number ?? '-';

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name || 'Customer Details'}
        subtitle={`Meter Utama: ${primaryMeterNumber}`}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/customers')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </button>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${customer.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => handleStatusChange(!customer.is_active)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  customer.is_active ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    customer.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Ubah
            </button>
          </div>
        }
      />

      {/* Customer Info */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
            <p className="mt-1 text-sm text-gray-500">Pelanggan sejak {new Date(customer.created_at).toLocaleDateString('id-ID')}</p>
          </div>
          {statusBadge(customer.is_active)}
        </div>
        <div className="border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">{customer.email}</a>
                ) : '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nomor Telepon</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.phone || '-'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Alamat</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.address || '-'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Area Layanan</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.service_area_name || <span className="text-gray-400">Belum ditentukan</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Meter Terpasang */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-4 sm:px-6 flex items-center justify-between border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Meter Terpasang ({meters.length})</h3>
          <button
            onClick={() => setShowAddMeter(true)}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Meter
          </button>
        </div>
        {meters.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            Belum ada meter terpasang.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Nomor Meter', 'Golongan Langganan', 'Tgl Pasang', 'Angka Awal', 'Bacaan Terakhir', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meters.map((meter, idx) => (
                  <tr key={meter.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{meter.meter_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {meter.subscription_type?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{meter.install_date}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {meter.initial_reading?.toLocaleString('id-ID') ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {meter.latest_meter_end != null
                        ? `${meter.latest_meter_end.toLocaleString('id-ID')} (${meter.latest_usage_month})`
                        : <span className="text-gray-400">Belum ada</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          meter.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {meter.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { icon: DocumentTextIcon, label: 'Tagihan Terbaru', action: 'Lihat tagihan', path: `/admin/invoices?customerId=${customer.id}` },
          { icon: CreditCardIcon, label: 'Riwayat Pembayaran', action: 'Lihat pembayaran', path: `/admin/payments?customerId=${customer.id}` },
          { icon: ChartBarIcon, label: 'Pemakaian Air', action: 'Lihat pemakaian', path: `/admin/water-usage?customerId=${customer.id}` },
        ].map(({ icon: Icon, label, action, path }) => (
          <div key={label} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <Icon className="h-6 w-6 text-gray-400 flex-shrink-0" />
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-lg font-medium text-gray-900">Lihat Semua</p>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <button onClick={() => navigate(path)} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                {action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddMeterModal
        open={showAddMeter}
        onClose={() => setShowAddMeter(false)}
        onSuccess={handleMeterAdded}
        customerId={customer.id}
        subscriptionTypes={subscriptionTypes}
      />
    </div>
  );
}
