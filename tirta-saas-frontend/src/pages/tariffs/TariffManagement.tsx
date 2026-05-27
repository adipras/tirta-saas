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
  PageHeader,
  useToast,
  type Column,
} from '../../components';
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
      { key: 'name', label: 'Kategori', sortable: true },
      {
        key: 'type',
        label: 'Tipe',
        render: (value) => (
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {getCategoryTypeLabel(value as TariffCategoryType)}
          </span>
        ),
      },
      {
        key: 'is_active',
        label: 'Status',
        render: (_value, item) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
          <div className="flex justify-center gap-2">
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
        render: (_value, item) =>
          `${formatNumber(item.min_volume)} - ${
            item.max_volume === null ? 'Tanpa batas' : `${formatNumber(item.max_volume)} m³`
          }`,
      },
      {
        key: 'price_per_unit',
        label: 'Harga per m³',
        render: (value) => formatCurrency(Number(value)),
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
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
          <div className="flex justify-center gap-2">
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
      <PageHeader
        title="Tarif Progresif"
        subtitle="Kelola kategori tarif, susun tier harga progresif per m³, lalu uji simulasi tagihan sebelum dipakai operasional."
        actions={
          <div className="text-sm text-gray-500">
            {selectedCategory ? `Kategori aktif: ${selectedCategory.name}` : 'Belum ada kategori tarif'}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <RectangleStackIcon className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total kategori</p>
              <p className="text-xl font-semibold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Kategori aktif</p>
          <p className="text-xl font-semibold text-gray-900">{activeCategoryCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tier simulasi terakhir</p>
          <p className="text-xl font-semibold text-gray-900">{totalSimulationTiers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.9fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-gray-900">Kategori tarif</h2>
              <p className="mt-1 text-sm text-gray-500">
                Pisahkan tarif rumah tangga, komersial, industri, sosial, atau pemerintah agar skema billing lebih presisi.
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

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Tier tarif progresif</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedCategory
                    ? `Tier aktif untuk kategori ${selectedCategory.name}.`
                    : 'Pilih kategori tarif lebih dulu untuk melihat tier harga.'}
                </p>
              </div>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={resetRateForm}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Tambah Tier
                </button>
              )}
            </div>

            <div className="p-4 sm:p-5">
              {selectedCategory ? (
                <DataTable
                  data={rates}
                  columns={rateColumns}
                  loading={loadingRates}
                  searchable={false}
                  emptyMessage="Belum ada tier tarif untuk kategori ini."
                />
              ) : (
                <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                  Pilih kategori tarif untuk melihat dan mengelola tier harga progresif.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              {editingCategory ? 'Ubah kategori tarif' : 'Tambah kategori tarif'}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleCategorySubmit}>
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

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal Ubah
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCategory ? 'Menyimpan...' : editingCategory ? 'Perbarui Kategori' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              {editingRate ? 'Ubah tier tarif' : 'Tambah tier tarif'}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={handleRateSubmit}>
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

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                {(editingRate || rateForm.category_id) && (
                  <button
                    type="button"
                    onClick={resetRateForm}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingRate || categories.length === 0}
                  className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingRate ? 'Menyimpan...' : editingRate ? 'Perbarui Tier' : 'Simpan Tier'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Simulasi tagihan</h2>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSimulationSubmit}>
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
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {simulating ? 'Menghitung...' : 'Hitung Simulasi'}
              </button>
            </form>

            {simulationResult && (
              <div className="mt-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Kategori simulasi</p>
                    <p className="text-base font-semibold text-blue-900">{simulationResult.category.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Total tagihan</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formatCurrency(simulationResult.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {simulationResult.breakdown.map((item) => (
                    <div
                      key={`${item.tier_range}-${item.volume}`}
                      className="rounded-xl border border-blue-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.tier_range}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatNumber(item.volume)} m³ x {formatCurrency(item.price_per_unit)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
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
