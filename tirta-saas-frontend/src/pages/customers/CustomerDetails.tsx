import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { Customer, Meter, AddMeterDto, SubscriptionType } from '../../types/customer';
import { PageHeader, Modal } from '../../components';
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
    location_name: '',
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

  return (
    <Modal isOpen={open} onClose={onClose} title="Tambah Meter" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Nomor Meter *</label>
            <input
              type="text"
              value={form.meter_number}
              onChange={(e) => setForm((f) => ({ ...f, meter_number: e.target.value }))}
              className="input-base"
              placeholder="MET-002"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Lokasi Pemasangan</label>
            <input
              type="text"
              value={form.location_name || ''}
              onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
              className="input-base"
              placeholder="Rumah Induk, Kos Belakang"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Golongan Langganan *</label>
          <select
            value={form.subscription_type_id}
            onChange={(e) => setForm((f) => ({ ...f, subscription_type_id: e.target.value }))}
            className="input-base"
          >
            <option value="">Pilih golongan</option>
            {subscriptionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — Rp {t.monthly_fee.toLocaleString()}/bln
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Tanggal Pasang *</label>
            <input
              type="date"
              value={form.install_date}
              onChange={(e) => setForm((f) => ({ ...f, install_date: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Angka Awal Meter</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.initial_reading ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, initial_reading: parseFloat(e.target.value) || 0 }))}
              className="input-base"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Merek</label>
            <input
              type="text"
              value={form.brand || ''}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Model</label>
            <input
              type="text"
              value={form.model || ''}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="input-base"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-surface-700">Catatan</label>
          <input
            type="text"
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input-base"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Menyimpan...' : 'Tambah Meter'}
          </button>
        </div>
      </form>
    </Modal>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card p-12 text-center">
        <p className="text-sm text-surface-500">Pelanggan tidak ditemukan</p>
      </div>
    );
  }

  const primaryMeterNumber = meters[0]?.meter_number ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name || 'Detail Pelanggan'}
        subtitle={`Meter utama: ${primaryMeterNumber}`}
        breadcrumbs={[
          { label: 'Pelanggan', href: '/admin/customers' },
          { label: customer.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/customers')}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Kembali
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-1.5">
              <span className={`text-[12px] font-medium ${customer.is_active ? 'text-success-600' : 'text-surface-400'}`}>
                {customer.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                onClick={() => handleStatusChange(!customer.is_active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                  customer.is_active ? 'bg-success-500' : 'bg-surface-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                    customer.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
              className="btn-secondary"
            >
              <PencilIcon className="h-4 w-4" />
              Ubah
            </button>
          </div>
        }
      />

      {/* Customer Info Card */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
              <span className="text-lg font-bold text-brand-600">
                {customer.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900">{customer.name}</h2>
              <p className="text-[12px] text-surface-400">
                Pelanggan sejak {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <span className={`badge ${customer.is_active ? 'badge-success' : 'badge-neutral'}`}>
            {customer.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-4 w-4 text-surface-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">Email</p>
                <p className="text-[13px] text-surface-700">
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-brand-600 hover:text-brand-700">{customer.email}</a>
                  ) : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-4 w-4 text-surface-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">Telepon</p>
                <p className="text-[13px] text-surface-700">{customer.phone || '—'}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-4 w-4 text-surface-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">Alamat</p>
                <p className="text-[13px] text-surface-700">{customer.address || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BoltIcon className="h-4 w-4 text-surface-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">Area Layanan</p>
                <p className="text-[13px] text-surface-700">{customer.service_area_name || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meter Terpasang */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Meter Terpasang</h3>
            <p className="text-[12px] text-surface-400">{meters.length} meter terdaftar</p>
          </div>
          <button
            onClick={() => setShowAddMeter(true)}
            className="btn-primary text-[13px]"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah
          </button>
        </div>
        {meters.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <BoltIcon className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm text-surface-500">Belum ada meter terpasang</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-100">
              <thead className="bg-surface-50/80">
                <tr>
                  {['No', 'Nomor Meter', 'Lokasi', 'Golongan', 'Tgl Pasang', 'Awal', 'Bacaan Terakhir', 'Status'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {meters.map((meter, idx) => (
                  <tr key={meter.id} className="transition-colors hover:bg-surface-50/50">
                    <td className="px-4 py-3 text-[13px] text-surface-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-[13px] font-medium text-surface-900">{meter.meter_number}</td>
                    <td className="px-4 py-3 text-[13px] text-surface-600">
                      {meter.location_name || <span className="text-surface-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-surface-600">
                      {meter.subscription_type?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-surface-600">{meter.install_date}</td>
                    <td className="px-4 py-3 text-[13px] text-surface-600">
                      {meter.initial_reading?.toLocaleString('id-ID') ?? 0}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-surface-600">
                      {meter.latest_meter_end != null
                        ? `${meter.latest_meter_end.toLocaleString('id-ID')} (${meter.latest_usage_month})`
                        : <span className="text-surface-300">Belum ada</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meter.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: DocumentTextIcon, label: 'Tagihan', desc: 'Lihat tagihan pelanggan', path: `/admin/invoices?customerId=${customer.id}`, tone: 'blue' },
          { icon: CreditCardIcon, label: 'Pembayaran', desc: 'Riwayat pembayaran', path: `/admin/payments?customerId=${customer.id}`, tone: 'green' },
          { icon: ChartBarIcon, label: 'Pemakaian', desc: 'Riwayat pemakaian air', path: `/admin/water-usage?customerId=${customer.id}`, tone: 'cyan' },
        ].map(({ icon: Icon, label, desc, path, tone }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="group card-hover flex items-center gap-4 p-4 text-left"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${tone}-50 ring-1 ring-${tone}-100`}>
              <Icon className={`h-5 w-5 text-${tone}-600`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-surface-900">{label}</p>
              <p className="text-[12px] text-surface-400">{desc}</p>
            </div>
          </button>
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
