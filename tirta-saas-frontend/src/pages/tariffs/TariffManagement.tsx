import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalculatorIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {
  ActionIconButton,
  ConfirmModal,
  DataTable,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  useToast,
  type Column,
} from '../../components';
import { DashboardStatCard } from '../../components';
import tariffService from '../../services/tariffService';
import type {
  BillSimulationResult,
  ProgressiveRate,
  TariffCategory,
  TariffCategoryType,
} from '../../types/tariff';

type CategoryFormState = {
  code: string;
  name: string;
  type: TariffCategoryType;
  description: string;
  display_order: string;
  is_active: boolean;
};

type RateFormState = {
  category_id: string;
  min_volume: string;
  max_volume: string;
  price_per_unit: string;
  display_order: string;
  is_active: boolean;
};

type SimulationFormState = {
  category_id: string;
  usage_volume: string;
};

const CATEGORY_TYPE_OPTIONS: Array<{ value: TariffCategoryType; label: string }> = [
  { value: 'residential', label: 'Rumah Tangga' },
  { value: 'commercial', label: 'Komersial' },
  { value: 'industrial', label: 'Industri' },
  { value: 'social', label: 'Sosial' },
  { value: 'government', label: 'Pemerintah' },
];

const INITIAL_CATEGORY_FORM: CategoryFormState = {
  code: '',
  name: '',
  type: 'residential',
  description: '',
  display_order: '0',
  is_active: true,
};

const INITIAL_RATE_FORM: RateFormState = {
  category_id: '',
  min_volume: '0',
  max_volume: '',
  price_per_unit: '',
  display_order: '0',
  is_active: true,
};

const INITIAL_SIMULATION_FORM: SimulationFormState = {
  category_id: '',
  usage_volume: '',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

const getCategoryTypeLabel = (value: TariffCategoryType) =>
  CATEGORY_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;

export default function TariffManagement() {
  const toast = useToast();
  const [categories, setCategories] = useState<TariffCategory[]>([]);
  const [rates, setRates] = useState<ProgressiveRate[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TariffCategory | null>(null);
  const [editingRate, setEditingRate] = useState<ProgressiveRate | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<TariffCategory | null>(null);
  const [deleteRateTarget, setDeleteRateTarget] = useState<ProgressiveRate | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(INITIAL_CATEGORY_FORM);
  const [rateForm, setRateForm] = useState<RateFormState>(INITIAL_RATE_FORM);
  const [simulationForm, setSimulationForm] = useState<SimulationFormState>(INITIAL_SIMULATION_FORM);
  const [simulationResult, setSimulationResult] = useState<BillSimulationResult | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await tariffService.getTariffCategories();
      setCategories(data);

      if (data.length > 0) {
        const fallbackCategoryId = data[0].id;
        setSelectedCategoryId((prev) =>
          data.some((item) => item.id === prev) ? prev : fallbackCategoryId
        );
        setRateForm((prev) => ({
          ...prev,
          category_id:
            prev.category_id && data.some((item) => item.id === prev.category_id)
              ? prev.category_id
              : fallbackCategoryId,
        }));
        setSimulationForm((prev) => ({
          ...prev,
          category_id:
            prev.category_id && data.some((item) => item.id === prev.category_id)
              ? prev.category_id
              : fallbackCategoryId,
        }));
      } else {
        setSelectedCategoryId('');
        setRateForm(INITIAL_RATE_FORM);
        setSimulationForm(INITIAL_SIMULATION_FORM);
      }
    } catch {
      toast.error('Gagal memuat kategori tarif');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [toast]);

  const fetchRates = useCallback(
    async (categoryId: string) => {
      if (!categoryId) {
        setRates([]);
        return;
      }

      try {
        setLoadingRates(true);
        const data = await tariffService.getProgressiveRates(categoryId);
        setRates(data);
      } catch {
        toast.error('Gagal memuat tarif progresif');
        setRates([]);
      } finally {
        setLoadingRates(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchRates(selectedCategoryId);
  }, [fetchRates, selectedCategoryId]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const activeCategoryCount = useMemo(
    () => categories.filter((item) => item.is_active).length,
    [categories]
  );

  const totalSimulationTiers = simulationResult?.breakdown.length ?? 0;

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm(INITIAL_CATEGORY_FORM);
  };

  const resetRateForm = () => {
    setEditingRate(null);
    setRateForm({
      ...INITIAL_RATE_FORM,
      category_id: selectedCategoryId,
    });
  };

  const startEditCategory = (category: TariffCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      code: category.code,
      name: category.name,
      type: category.type,
      description: category.description,
      display_order: String(category.display_order),
      is_active: category.is_active,
    });
  };

  const startEditRate = (rate: ProgressiveRate) => {
    setEditingRate(rate);
    setRateForm({
      category_id: rate.category.id,
      min_volume: String(rate.min_volume),
      max_volume: rate.max_volume === null ? '' : String(rate.max_volume),
      price_per_unit: String(rate.price_per_unit),
      display_order: String(rate.display_order),
      is_active: rate.is_active,
    });
  };

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryForm.code.trim() && !editingCategory) {
      toast.error('Kode kategori tarif wajib diisi');
      return;
    }

    if (!categoryForm.name.trim()) {
      toast.error('Nama kategori tarif wajib diisi');
      return;
    }

    try {
      setSavingCategory(true);

      if (editingCategory) {
        await tariffService.updateTariffCategory(editingCategory.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          display_order: Number(categoryForm.display_order || 0),
          is_active: categoryForm.is_active,
        });
        toast.success('Kategori tarif berhasil diperbarui');
      } else {
        await tariffService.createTariffCategory({
          code: categoryForm.code.trim(),
          name: categoryForm.name.trim(),
          type: categoryForm.type,
          description: categoryForm.description.trim() || undefined,
        });
        toast.success('Kategori tarif berhasil ditambahkan');
      }

      resetCategoryForm();
      await fetchCategories();
    } catch {
      toast.error(`Gagal ${editingCategory ? 'memperbarui' : 'menambahkan'} kategori tarif`);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleRateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rateForm.category_id) {
      toast.error('Kategori tarif wajib dipilih');
      return;
    }

    if (Number(rateForm.price_per_unit) <= 0) {
      toast.error('Harga per m³ wajib lebih besar dari 0');
      return;
    }

    if (Number(rateForm.min_volume) < 0) {
      toast.error('Volume minimum tidak boleh negatif');
      return;
    }

    if (rateForm.max_volume !== '' && Number(rateForm.max_volume) <= Number(rateForm.min_volume)) {
      toast.error('Volume maksimum harus lebih besar dari volume minimum');
      return;
    }

    const payload = {
      min_volume: Number(rateForm.min_volume),
      max_volume: rateForm.max_volume === '' ? undefined : Number(rateForm.max_volume),
      price_per_unit: Number(rateForm.price_per_unit),
      display_order: Number(rateForm.display_order || 0),
      is_active: rateForm.is_active,
    };

    try {
      setSavingRate(true);

      if (editingRate) {
        await tariffService.updateProgressiveRate(editingRate.id, payload);
        toast.success('Tarif progresif berhasil diperbarui');
      } else {
        await tariffService.createProgressiveRate({
          category_id: rateForm.category_id,
          min_volume: payload.min_volume,
          max_volume: payload.max_volume,
          price_per_unit: payload.price_per_unit,
          display_order: payload.display_order,
        });
        toast.success('Tarif progresif berhasil ditambahkan');
      }

      resetRateForm();
      await fetchRates(selectedCategoryId || rateForm.category_id);
    } catch {
      toast.error(`Gagal ${editingRate ? 'memperbarui' : 'menambahkan'} tarif progresif`);
    } finally {
      setSavingRate(false);
    }
  };

  const handleSimulationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!simulationForm.category_id) {
      toast.error('Kategori simulasi wajib dipilih');
      return;
    }

    if (Number(simulationForm.usage_volume) <= 0) {
      toast.error('Volume pemakaian wajib lebih besar dari 0');
      return;
    }

    try {
      setSimulating(true);
      const result = await tariffService.simulateBill({
        category_id: simulationForm.category_id,
        usage_volume: Number(simulationForm.usage_volume),
      });
      setSimulationResult(result);
      toast.success('Simulasi tagihan berhasil dihitung');
    } catch {
      toast.error('Gagal menghitung simulasi tagihan');
      setSimulationResult(null);
    } finally {
      setSimulating(false);
    }
  };

  const categoryColumns = useMemo<Column<TariffCategory>[]>(
    () => [
      { key: 'code', label: 'Kode', sortable: true },
      {
        key: 'name',
        label: 'Kategori',
        sortable: true,
        render: (_value, item) => (
          <span className="font-medium text-surface-800">{item.name}</span>
        ),
      },
      {
        key: 'type',
        label: 'Tipe',
        render: (value) => (
          <span className="inline-flex rounded-full bg-info-50 px-2.5 py-0.5 text-[12px] font-medium text-info-700 ring-1 ring-inset ring-info-200/60">
            {getCategoryTypeLabel(value as TariffCategoryType)}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (_value, item) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${
              item.is_active
                ? 'bg-success-50 text-success-700 ring-success-200/60'
                : 'bg-surface-50 text-surface-500 ring-surface-200/60'
            }`}
          >
            {item.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
        align: 'center',
      },
      {
        key: 'actions',
        label: 'Aksi',
        render: (_value, item) => (
          <div className="flex justify-center gap-1.5">
            <ActionIconButton
              icon={PencilIcon}
              label={`Ubah kategori tarif ${item.name}`}
              tone="blue"
              onClick={() => startEditCategory(item)}
            />
            <ActionIconButton
              icon={TrashIcon}
              label={`Hapus kategori tarif ${item.name}`}
              tone="red"
              onClick={() => setDeleteCategoryTarget(item)}
            />
          </div>
        ),
        align: 'center',
      },
    ],
    []
  );

  const rateColumns = useMemo<Column<ProgressiveRate>[]>(
    () => [
      {
        key: 'min_volume',
        label: 'Rentang',
        render: (_value, item) => (
          <span className="text-surface-700">
            {formatNumber(item.min_volume)} -{' '}
            {item.max_volume === null ? 'Tanpa batas' : `${formatNumber(item.max_volume)} m³`}
          </span>
        ),
      },
      {
        key: 'price_per_unit',
        label: 'Harga per m³',
        render: (value) => (
          <span className="font-semibold text-brand-600">{formatCurrency(Number(value))}</span>
        ),
      },
      {
        key: 'display_order',
        label: 'Urutan',
        align: 'center',
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (_value, item) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${
              item.is_active
                ? 'bg-success-50 text-success-700 ring-success-200/60'
                : 'bg-surface-50 text-surface-500 ring-surface-200/60'
            }`}
          >
            {item.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Aksi',
        render: (_value, item) => (
          <div className="flex justify-center gap-1.5">
            <ActionIconButton
              icon={PencilIcon}
              label={`Ubah tier tarif ${item.category.name}`}
              tone="blue"
              onClick={() => startEditRate(item)}
            />
            <ActionIconButton
              icon={TrashIcon}
              label={`Hapus tier tarif ${item.category.name}`}
              tone="red"
              onClick={() => setDeleteRateTarget(item)}
            />
          </div>
        ),
        align: 'center',
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Tarif Progresif</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Kelola kategori tarif, susun tier harga progresif per m³, lalu uji simulasi tagihan.
          </p>
        </div>
        <div className="text-[13px] text-surface-400">
          {selectedCategory ? `Kategori aktif: ${selectedCategory.name}` : 'Belum ada kategori tarif'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="Total kategori"
          value={loadingCategories ? '...' : categories.length.toLocaleString('id-ID')}
          subtitle="Semua kategori tarif"
          icon={RectangleStackIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Kategori aktif"
          value={loadingCategories ? '...' : activeCategoryCount.toLocaleString('id-ID')}
          subtitle="Siap digunakan"
          icon={RectangleStackIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Tier simulasi terakhir"
          value={totalSimulationTiers.toLocaleString('id-ID')}
          subtitle="Hasil simulasi terakhir"
          icon={CalculatorIcon}
          tone="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.9fr)]">
        {/* Left: Categories + Rates */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-surface-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-surface-800">Kategori tarif</h2>
              <p className="mt-0.5 text-[13px] text-surface-400">
                Pisahkan tarif rumah tangga, komersial, industri, sosial, atau pemerintah.
              </p>
            </div>

            <DataTable
              data={categories}
              columns={categoryColumns}
              loading={loadingCategories}
              searchKeys={['code', 'name', 'description', 'type']}
              emptyMessage="Belum ada kategori tarif."
              onRowClick={(item) => {
                setSelectedCategoryId(item.id);
                setRateForm((prev) => ({ ...prev, category_id: item.id }));
                setSimulationForm((prev) => ({ ...prev, category_id: item.id }));
              }}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-surface-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-surface-800">Tier tarif progresif</h2>
                <p className="mt-0.5 text-[13px] text-surface-400">
                  {selectedCategory
                    ? `Tier aktif untuk kategori ${selectedCategory.name}.`
                    : 'Pilih kategori tarif lebih dulu untuk melihat tier harga.'}
                </p>
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={resetRateForm}
                  className="btn-primary self-start"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tambah Tier
                </button>
              )}
            </div>

            <div className="p-5">
              {selectedCategory ? (
                <DataTable
                  data={rates}
                  columns={rateColumns}
                  loading={loadingRates}
                  searchable={false}
                  emptyMessage="Belum ada tier tarif untuk kategori ini."
                />
              ) : (
                <p className="rounded-xl border border-dashed border-surface-200 px-4 py-6 text-center text-[13px] text-surface-400">
                  Pilih kategori tarif untuk melihat dan mengelola tier harga progresif.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="space-y-6">
          {/* Category Form */}
          <div className="card overflow-hidden">
            <div className="border-b border-surface-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-surface-800">
                {editingCategory ? 'Ubah kategori tarif' : 'Tambah kategori tarif'}
              </h2>
            </div>
            <form className="p-5 space-y-4" onSubmit={handleCategorySubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Kode kategori"
                  value={categoryForm.code}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="RT-A"
                  disabled={Boolean(editingCategory)}
                />
                <FormSelect
                  label="Tipe kategori"
                  value={categoryForm.type}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, type: event.target.value as TariffCategoryType }))
                  }
                  options={CATEGORY_TYPE_OPTIONS}
                />
                <FormInput
                  label="Nama kategori"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Rumah Tangga A"
                  fullWidth
                />
                <FormInput
                  label="Urutan tampil"
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, display_order: event.target.value }))
                  }
                />
              </div>

              <FormTextarea
                label="Deskripsi"
                rows={3}
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Catatan ringkas untuk operator billing."
              />

              {editingCategory && (
                <FormCheckbox
                  label="Kategori aktif"
                  checked={categoryForm.is_active}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 border-t border-surface-100 sm:flex-row sm:justify-end">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="btn-secondary"
                  >
                    Batal Ubah
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="btn-primary"
                >
                  {savingCategory ? 'Menyimpan...' : editingCategory ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>

          {/* Rate Form */}
          <div className="card overflow-hidden">
            <div className="border-b border-surface-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-surface-800">
                {editingRate ? 'Ubah tier tarif' : 'Tambah tier tarif'}
              </h2>
            </div>
            <form className="p-5 space-y-4" onSubmit={handleRateSubmit}>
              <FormSelect
                label="Kategori tarif"
                value={rateForm.category_id}
                onChange={(event) => setRateForm((prev) => ({ ...prev, category_id: event.target.value }))}
                options={[
                  { value: '', label: 'Pilih kategori tarif' },
                  ...categories.map((item) => ({
                    value: item.id,
                    label: `${item.code} - ${item.name}`,
                  })),
                ]}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Volume minimum (m³)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.min_volume}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, min_volume: event.target.value }))}
                />
                <FormInput
                  label="Volume maksimum (m³)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.max_volume}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, max_volume: event.target.value }))}
                  helperText="Kosongkan untuk tier tanpa batas atas."
                />
                <FormInput
                  label="Harga per m³ (IDR)"
                  type="number"
                  min="0"
                  step="100"
                  value={rateForm.price_per_unit}
                  onChange={(event) =>
                    setRateForm((prev) => ({ ...prev, price_per_unit: event.target.value }))
                  }
                />
                <FormInput
                  label="Urutan tampil"
                  type="number"
                  value={rateForm.display_order}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, display_order: event.target.value }))}
                />
              </div>

              {editingRate && (
                <FormCheckbox
                  label="Tier aktif"
                  checked={rateForm.is_active}
                  onChange={(event) => setRateForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 border-t border-surface-100 sm:flex-row sm:justify-end">
                {(editingRate || rateForm.category_id) && (
                  <button
                    type="button"
                    onClick={resetRateForm}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingRate || categories.length === 0}
                  className="btn-primary"
                >
                  {savingRate ? 'Menyimpan...' : editingRate ? 'Perbarui Tier' : 'Simpan Tier'}
                </button>
              </div>
            </form>
          </div>

          {/* Simulation */}
          <div className="card overflow-hidden">
            <div className="border-b border-surface-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-50 text-info-600 ring-1 ring-inset ring-info-200/60">
                  <CalculatorIcon className="h-4 w-4" />
                </div>
                <h2 className="text-[15px] font-semibold text-surface-800">Simulasi tagihan</h2>
              </div>
            </div>
            <form className="p-5 space-y-4" onSubmit={handleSimulationSubmit}>
              <FormSelect
                label="Kategori simulasi"
                value={simulationForm.category_id}
                onChange={(event) =>
                  setSimulationForm((prev) => ({ ...prev, category_id: event.target.value }))
                }
                options={[
                  { value: '', label: 'Pilih kategori tarif' },
                  ...categories.map((item) => ({
                    value: item.id,
                    label: `${item.code} - ${item.name}`,
                  })),
                ]}
              />
              <FormInput
                label="Volume pemakaian (m³)"
                type="number"
                min="0"
                step="0.01"
                value={simulationForm.usage_volume}
                onChange={(event) =>
                  setSimulationForm((prev) => ({ ...prev, usage_volume: event.target.value }))
                }
                placeholder="Contoh: 25"
              />
              <button
                type="submit"
                disabled={simulating || categories.length === 0}
                className="btn-primary w-full"
              >
                {simulating ? 'Menghitung...' : 'Hitung Simulasi'}
              </button>
            </form>

            {simulationResult && (
              <div className="mx-5 mb-5 space-y-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-brand-600">Kategori simulasi</p>
                    <p className="text-[15px] font-semibold text-brand-800">{simulationResult.category.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-brand-600">Total tagihan</p>
                    <p className="text-lg font-semibold text-brand-800">
                      {formatCurrency(simulationResult.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {simulationResult.breakdown.map((item) => (
                    <div
                      key={`${item.tier_range}-${item.volume}`}
                      className="rounded-lg border border-brand-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium text-surface-800">{item.tier_range}</p>
                          <p className="mt-0.5 text-[12px] text-surface-400">
                            {formatNumber(item.volume)} m³ x {formatCurrency(item.price_per_unit)}
                          </p>
                        </div>
                        <p className="text-[13px] font-semibold text-surface-800">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteCategoryTarget !== null}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={async () => {
          if (!deleteCategoryTarget) {
            return;
          }

          try {
            await tariffService.deleteTariffCategory(deleteCategoryTarget.id);
            toast.success('Kategori tarif berhasil dihapus');
            if (selectedCategoryId === deleteCategoryTarget.id) {
              setSelectedCategoryId('');
              setRates([]);
            }
            setDeleteCategoryTarget(null);
            resetCategoryForm();
            await fetchCategories();
          } catch {
            toast.error('Gagal menghapus kategori tarif');
          }
        }}
        title="Hapus Kategori Tarif"
        message="Kategori yang sudah memiliki tier aktif tidak dapat dihapus. Pastikan tier terkait sudah dibersihkan bila ingin menghapus kategori ini."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteRateTarget !== null}
        onClose={() => setDeleteRateTarget(null)}
        onConfirm={async () => {
          if (!deleteRateTarget) {
            return;
          }

          try {
            await tariffService.deleteProgressiveRate(deleteRateTarget.id);
            toast.success('Tier tarif berhasil dihapus');
            setDeleteRateTarget(null);
            resetRateForm();
            await fetchRates(selectedCategoryId || deleteRateTarget.category.id);
          } catch {
            toast.error('Gagal menghapus tier tarif');
          }
        }}
        title="Hapus Tier Tarif"
        message="Tier tarif yang dihapus akan hilang dari simulasi dan konfigurasi progresif kategori ini."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
