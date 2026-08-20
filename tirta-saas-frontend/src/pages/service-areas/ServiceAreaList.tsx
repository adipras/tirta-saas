import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ActionIconButton, ConfirmModal, DataTable, FormCheckbox, FormInput, FormSelect, FormTextarea, useToast } from '../../components';
import { DashboardStatCard } from '../../components';
import serviceAreaService from '../../services/serviceAreaService';
import type { CreateServiceAreaDto, ServiceArea, ServiceAreaType, UpdateServiceAreaDto } from '../../types/serviceArea';

type FormState = {
  code: string;
  name: string;
  type: ServiceAreaType;
  parent_id: string;
  description: string;
  population: string;
  coverage_area: string;
  is_active: boolean;
};

const SERVICE_AREA_TYPE_OPTIONS: Array<{ value: ServiceAreaType; label: string }> = [
  { value: 'Zone', label: 'Zone' },
  { value: 'RW', label: 'RW' },
  { value: 'RT', label: 'RT' },
  { value: 'Blok', label: 'Blok' },
];

const INITIAL_FORM_STATE: FormState = {
  code: '',
  name: '',
  type: 'Zone',
  parent_id: '',
  description: '',
  population: '',
  coverage_area: '',
  is_active: true,
};

export default function ServiceAreaList() {
  const toast = useToast();
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceArea | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);

  const fetchServiceAreas = useCallback(async () => {
    try {
      setLoading(true);
      const items = await serviceAreaService.getServiceAreas();
      setServiceAreas(items);
    } catch {
      toast.error('Gagal memuat area layanan');
      setServiceAreas([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchServiceAreas();
  }, [fetchServiceAreas]);

  const resetForm = () => {
    setEditingArea(null);
    setForm(INITIAL_FORM_STATE);
  };

  const startEdit = (area: ServiceArea) => {
    setEditingArea(area);
    setForm({
      code: area.code,
      name: area.name,
      type: area.type,
      parent_id: area.parent?.id || '',
      description: area.description || '',
      population: area.population ? String(area.population) : '',
      coverage_area: area.coverage_area || '',
      is_active: area.is_active,
    });
  };

  const parentOptions = useMemo(
    () =>
      serviceAreas
        .filter((area) => !editingArea || area.id !== editingArea.id)
        .map((area) => ({
          value: area.id,
          label: `${area.code} - ${area.name}`,
        })),
    [editingArea, serviceAreas]
  );

  const filteredServiceAreas = useMemo(() => {
    return serviceAreas.filter((area) => {
      const matchesSearch =
        search.trim() === '' ||
        `${area.code} ${area.name} ${area.description} ${area.coverage_area}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesType = filterType === '' || area.type === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && area.is_active) ||
        (filterStatus === 'inactive' && !area.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filterStatus, filterType, search, serviceAreas]);

  const activeCount = serviceAreas.filter((area) => area.is_active).length;
  const totalCustomers = serviceAreas.reduce((sum, area) => sum + area.customer_count, 0);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() && !editingArea) {
      toast.error('Kode area layanan wajib diisi');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Nama area layanan wajib diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingArea) {
        const payload: UpdateServiceAreaDto = {
          name: form.name.trim(),
          description: form.description.trim(),
          population: form.population === '' ? 0 : Number(form.population),
          coverage_area: form.coverage_area.trim(),
          is_active: form.is_active,
        };
        await serviceAreaService.updateServiceArea(editingArea.id, payload);
        toast.success('Area layanan berhasil diperbarui');
      } else {
        const payload: CreateServiceAreaDto = {
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          parent_id: form.parent_id || undefined,
          description: form.description.trim(),
          population: form.population === '' ? 0 : Number(form.population),
          coverage_area: form.coverage_area.trim(),
        };
        await serviceAreaService.createServiceArea(payload);
        toast.success('Area layanan berhasil ditambahkan');
      }

      resetForm();
      await fetchServiceAreas();
    } catch {
      toast.error(`Gagal ${editingArea ? 'memperbarui' : 'menambahkan'} area layanan`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await serviceAreaService.deleteServiceArea(deleteTarget.id);
      toast.success('Area layanan berhasil dihapus');
      setDeleteTarget(null);
      if (editingArea?.id === deleteTarget.id) {
        resetForm();
      }
      await fetchServiceAreas();
    } catch {
      toast.error('Gagal menghapus area layanan');
    }
  };

  const columns = [
    { key: 'code', label: 'Kode', sortable: true },
    { key: 'name', label: 'Nama', sortable: true },
    {
      key: 'type',
      label: 'Tipe',
      render: (_value: unknown, area: ServiceArea) => (
        <span className="inline-flex rounded-full bg-info-50 px-2.5 py-0.5 text-[12px] font-medium text-info-700 ring-1 ring-inset ring-info-200/60">
          {area.type}
        </span>
      ),
      align: 'center' as const,
    },
    {
      key: 'parent',
      label: 'Induk',
      render: (_value: unknown, area: ServiceArea) => (
        <span className="text-surface-500">{area.parent?.name || '-'}</span>
      ),
    },
    {
      key: 'customer_count',
      label: 'Pelanggan',
      render: (_value: unknown, area: ServiceArea) => (
        <span className="text-right font-medium text-surface-700">{area.customer_count.toLocaleString('id-ID')}</span>
      ),
      align: 'right' as const,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (_value: unknown, area: ServiceArea) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${
            area.is_active
              ? 'bg-success-50 text-success-700 ring-success-200/60'
              : 'bg-surface-50 text-surface-500 ring-surface-200/60'
          }`}
        >
          {area.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
      align: 'center' as const,
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_value: unknown, area: ServiceArea) => (
        <div className="flex justify-center gap-1.5">
          <ActionIconButton
            icon={PencilIcon}
            label={`Ubah area layanan ${area.name}`}
            tone="blue"
            onClick={() => startEdit(area)}
          />
          <ActionIconButton
            icon={TrashIcon}
            label={`Hapus area layanan ${area.name}`}
            tone="red"
            onClick={() => setDeleteTarget(area)}
          />
        </div>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Area Layanan</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Kelola pembagian wilayah layanan seperti zone, RW, RT, atau blok agar data pelanggan lebih terstruktur.
          </p>
        </div>
        {editingArea ? (
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary self-start"
          >
            Batal Ubah
          </button>
        ) : (
          <button
            type="button"
            onClick={resetForm}
            className="btn-primary self-start"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Area
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="Total area"
          value={loading ? '...' : serviceAreas.length.toLocaleString('id-ID')}
          subtitle="Semua area layanan"
          icon={MapIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Area aktif"
          value={loading ? '...' : activeCount.toLocaleString('id-ID')}
          subtitle="Sedang digunakan"
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Pelanggan terpetakan"
          value={loading ? '...' : totalCustomers.toLocaleString('id-ID')}
          subtitle="Total dari semua area"
          icon={MapIcon}
          tone="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
        {/* Left: Filters + Table */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormInput
                label="Cari area"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Kode, nama, atau cakupan"
              />
              <FormSelect
                label="Tipe"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                options={[
                  { value: '', label: 'Semua tipe' },
                  ...SERVICE_AREA_TYPE_OPTIONS,
                ]}
              />
              <FormSelect
                label="Status"
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as 'all' | 'active' | 'inactive')}
                options={[
                  { value: 'all', label: 'Semua status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredServiceAreas}
              loading={loading}
              emptyMessage="Belum ada area layanan. Tambahkan area pertama untuk mulai mengelola wilayah."
            />
          </div>
        </div>

        {/* Right: Form */}
        <div className="card overflow-hidden">
          <div className="border-b border-surface-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-surface-800">
              {editingArea ? `Ubah ${editingArea.name}` : 'Tambah Area Layanan'}
            </h2>
            <p className="mt-0.5 text-[13px] text-surface-400">
              {editingArea
                ? 'Perbarui informasi area layanan yang sudah ada.'
                : 'Masukkan data area layanan baru untuk kebutuhan segmentasi pelanggan.'}
            </p>
          </div>

          <form className="p-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Kode"
                value={form.code}
                onChange={(event) => handleChange('code', event.target.value)}
                placeholder="RW-01"
                disabled={Boolean(editingArea)}
                helperText={editingArea ? 'Kode tidak dapat diubah setelah area dibuat.' : undefined}
                required
              />
              <FormSelect
                label="Tipe"
                value={form.type}
                onChange={(event) => handleChange('type', event.target.value as ServiceAreaType)}
                options={SERVICE_AREA_TYPE_OPTIONS}
                disabled={Boolean(editingArea)}
                helperText={editingArea ? 'Tipe area saat ini hanya dapat ditentukan saat pembuatan.' : undefined}
                required
              />
            </div>

            <FormInput
              label="Nama area"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="RW 01 Kelurahan Tirta"
              required
            />

            <FormSelect
              label="Area induk"
              value={form.parent_id}
              onChange={(event) => handleChange('parent_id', event.target.value)}
              options={[{ value: '', label: 'Tanpa area induk' }, ...parentOptions]}
              disabled={Boolean(editingArea)}
              helperText={editingArea ? 'Relasi induk saat ini belum bisa diubah lewat endpoint update.' : undefined}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Populasi"
                type="number"
                min={0}
                value={form.population}
                onChange={(event) => handleChange('population', event.target.value)}
                placeholder="0"
              />
              <FormInput
                label="Cakupan area"
                value={form.coverage_area}
                onChange={(event) => handleChange('coverage_area', event.target.value)}
                placeholder="Perumahan Tirta Indah"
              />
            </div>

            <FormTextarea
              label="Deskripsi"
              rows={4}
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="Catatan tambahan mengenai area layanan"
            />

            {editingArea && (
              <FormCheckbox
                label="Area aktif"
                checked={form.is_active}
                onChange={(event) => handleChange('is_active', event.target.checked)}
              />
            )}

            <div className="flex gap-3 pt-2 border-t border-surface-100">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Menyimpan...' : editingArea ? 'Simpan Perubahan' : 'Tambah Area'}
              </button>
              {(editingArea || form !== INITIAL_FORM_STATE) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Area Layanan"
        message={`Yakin ingin menghapus area layanan "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
