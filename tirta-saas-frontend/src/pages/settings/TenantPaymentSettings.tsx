import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BuildingLibraryIcon,
  CloudArrowUpIcon,
  PencilIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import { qrCodeService } from '../../services/qrCodeService';
import type { QRCode } from '../../services/qrCodeService';
import {
  tenantSettingsService,
  type TenantSettings,
} from '../../services/tenantSettingsService';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../hooks/redux';
import { setUser } from '../../store/slices/authSlice';
import {
  ConfirmModal,
  DashboardStatCard,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  ImageCropModal,
  Modal,
  PageHeader,
  useToast,
} from '../../components';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  isActive: boolean;
  isPrimary: boolean;
}

interface RawBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  swift_code?: string;
  bank_branch?: string;
  is_active: boolean;
  is_primary: boolean;
}

interface TenantProfileForm {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  operatingHours: string;
  serviceArea: string;
}

interface BillingSettingsForm {
  invoiceGenerationDay: string;
  invoiceDueDay: string;
}

type QRCodeType = 'QRIS' | 'DANA' | 'GOPAY' | 'OVO' | 'SHOPEEPAY';

interface BankFormState {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  isActive: boolean;
  isPrimary: boolean;
}

interface QRFormState {
  type: QRCodeType;
  imageFile: File | null;
  isActive: boolean;
  isPrimary: boolean;
  notes: string;
}

const qrTypeOptions = [
  { value: 'QRIS', label: 'QRIS (semua e-wallet)' },
  { value: 'GOPAY', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'DANA', label: 'DANA' },
  { value: 'SHOPEEPAY', label: 'ShopeePay' },
];

function extractBankList(payload: unknown): RawBankAccount[] {
  if (Array.isArray(payload)) {
    return payload as RawBankAccount[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: RawBankAccount[] }).data;
  }

  return [];
}

function mapBank(bank: RawBankAccount): BankAccount {
  return {
    id: bank.id,
    bankName: bank.bank_name,
    accountNumber: bank.account_number,
    accountName: bank.account_name,
    bankCode: bank.swift_code || bank.bank_branch || '',
    isActive: bank.is_active,
    isPrimary: bank.is_primary,
  };
}

const emptyProfileForm: TenantProfileForm = {
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  operatingHours: '',
  serviceArea: '',
};

const emptyBankForm: BankFormState = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  bankCode: '',
  isActive: true,
  isPrimary: false,
};

const emptyQRForm: QRFormState = {
  type: 'QRIS',
  imageFile: null,
  isActive: true,
  isPrimary: false,
  notes: '',
};

const revokeBlobUrl = (url: string | null) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export default function TenantPaymentSettings() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [profileForm, setProfileForm] = useState<TenantProfileForm>(emptyProfileForm);
  const [billingForm, setBillingForm] = useState<BillingSettingsForm>({
    invoiceGenerationDay: '5',
    invoiceDueDay: '25',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [billingSaving, setBillingSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bank' | 'qr'; id: string } | null>(
    null
  );
  const [currentTenantLogoUrl, setCurrentTenantLogoUrl] = useState<string | null>(null);
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);
  const [tenantLogoPreviewUrl, setTenantLogoPreviewUrl] = useState<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [qrCropSrc, setQrCropSrc] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankFormState>(emptyBankForm);
  const [qrForm, setQRForm] = useState<QRFormState>(emptyQRForm);

  useEffect(() => {
    return () => {
      revokeBlobUrl(tenantLogoPreviewUrl);
      revokeBlobUrl(qrPreviewUrl);
      revokeBlobUrl(logoCropSrc);
      revokeBlobUrl(qrCropSrc);
    };
  }, [tenantLogoPreviewUrl, qrPreviewUrl, logoCropSrc, qrCropSrc]);

  const syncTenantIdentity = (settings: TenantSettings, logoUrl?: string) => {
    const updatedUser = authService.updateStoredUser({
      tenant_name: settings.company_name || undefined,
      tenant_logo_url: logoUrl ?? settings.logo_url ?? null,
    });

    if (updatedUser) {
      dispatch(setUser(updatedUser));
    }
  };

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const [settingsRes, bankRes, qrRes] = await Promise.allSettled([
        tenantSettingsService.getTenantSettings(),
        apiClient.get<unknown>('/payment-methods/bank-accounts'),
        qrCodeService.getQRCodes(),
      ]);

      if (settingsRes.status === 'fulfilled') {
        const settings = settingsRes.value;
        setProfileForm({
          companyName: settings.company_name,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          operatingHours: settings.operating_hours,
          serviceArea: settings.service_area,
        });
        setBillingForm({
          invoiceGenerationDay: String(settings.invoice_generation_day),
          invoiceDueDay: String(settings.invoice_due_day),
        });
        setCurrentTenantLogoUrl(settings.logo_display_url || null);
      }

      if (bankRes.status === 'fulfilled') {
        const list = extractBankList(bankRes.value);
        setBankAccounts(list.map(mapBank));
      }

      if (qrRes.status === 'fulfilled') {
        setQRCodes(qrRes.value);
      }
    } catch  {
      toast.error('Gagal memuat pengaturan tenant.');
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const stats = useMemo(
    () => ({
      banks: bankAccounts.length,
      activeBanks: bankAccounts.filter((bank) => bank.isActive).length,
      qrCodes: qrCodes.length,
      activeQrCodes: qrCodes.filter((qr) => qr.is_active).length,
    }),
    [bankAccounts, qrCodes]
  );

  const handleProfileChange = (field: keyof TenantProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetTenantLogoSelection = () => {
    revokeBlobUrl(tenantLogoPreviewUrl);
    setTenantLogoFile(null);
    setTenantLogoPreviewUrl(null);
  };

  const handleTenantLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      resetTenantLogoSelection();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.warning('Logo tenant harus berupa file gambar.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Ukuran logo tenant maksimal 5MB.');
      return;
    }

    revokeBlobUrl(logoCropSrc);
    setLogoCropSrc(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);

    try {
      let updatedSettings = await tenantSettingsService.updateTenantSettings({
        company_name: profileForm.companyName,
        address: profileForm.address,
        phone: profileForm.phone,
        email: profileForm.email,
        website: profileForm.website,
        operating_hours: profileForm.operatingHours,
        service_area: profileForm.serviceArea,
      });

      let uploadedLogoUrl: string | undefined;

      if (tenantLogoFile) {
        const uploadedLogo = await tenantSettingsService.uploadTenantLogo(tenantLogoFile);
        uploadedLogoUrl = uploadedLogo.logo_url;
        updatedSettings = {
          ...updatedSettings,
          logo_url: uploadedLogo.logo_url,
          logo_display_url: uploadedLogo.logo_display_url,
        };
        setCurrentTenantLogoUrl(uploadedLogo.logo_display_url);
        resetTenantLogoSelection();
      } else {
        setCurrentTenantLogoUrl(updatedSettings.logo_display_url || null);
      }

      syncTenantIdentity(updatedSettings, uploadedLogoUrl);
      await loadSettings();
      toast.success('Profil tenant berhasil diperbarui.');
    } catch  {
      toast.error('Gagal menyimpan profil tenant.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBillingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const invoiceGenerationDay = Number(billingForm.invoiceGenerationDay);
    const invoiceDueDay = Number(billingForm.invoiceDueDay);

    if (
      !Number.isInteger(invoiceGenerationDay) ||
      invoiceGenerationDay < 1 ||
      invoiceGenerationDay > 31 ||
      !Number.isInteger(invoiceDueDay) ||
      invoiceDueDay < 1 ||
      invoiceDueDay > 31
    ) {
      toast.error('Tanggal generate dan jatuh tempo harus berupa angka 1 sampai 31.');
      return;
    }

    if (invoiceDueDay <= invoiceGenerationDay) {
      toast.error('Tanggal jatuh tempo harus lebih besar dari tanggal generate tagihan.');
      return;
    }

    setBillingSaving(true);

    try {
      await tenantSettingsService.updateTenantSettings({
        invoice_generation_day: invoiceGenerationDay,
        invoice_due_day: invoiceDueDay,
        invoice_due_days: Math.max(invoiceDueDay - invoiceGenerationDay, 1),
        grace_period_days: 0,
      });
      await loadSettings();
      toast.success('Siklus tagihan berhasil diperbarui.');
    } catch  {
      toast.error('Gagal menyimpan siklus tagihan.');
    } finally {
      setBillingSaving(false);
    }
  };

  const openBankModal = (bank?: BankAccount) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        bankCode: bank.bankCode,
        isActive: bank.isActive,
        isPrimary: bank.isPrimary,
      });
    } else {
      setEditingBank(null);
      setBankForm(emptyBankForm);
    }

    setShowBankModal(true);
  };

  const closeBankModal = () => {
    setShowBankModal(false);
    setEditingBank(null);
    setBankForm(emptyBankForm);
  };

  const handleBankSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload = {
        bank_name: bankForm.bankName,
        account_number: bankForm.accountNumber,
        account_name: bankForm.accountName,
        bank_branch: bankForm.bankCode,
        is_primary: bankForm.isPrimary,
        is_active: bankForm.isActive,
      };

      if (editingBank) {
        await apiClient.put(`/payment-methods/bank-accounts/${editingBank.id}`, payload);
      } else {
        await apiClient.post('/payment-methods/bank-accounts', payload);
      }

      await loadSettings();
      closeBankModal();
      toast.success('Rekening bank berhasil disimpan.');
    } catch  {
      toast.error('Gagal menyimpan rekening bank.');
    }
  };

  const openQRModal = (qr?: QRCode) => {
    revokeBlobUrl(qrPreviewUrl);

    if (qr) {
      setEditingQR(qr);
      setQRForm({
        type: qr.type,
        imageFile: null,
        isActive: qr.is_active,
        isPrimary: qr.is_primary,
        notes: qr.notes || '',
      });
      setQrPreviewUrl(qr.imageDisplayUrl || null);
    } else {
      setEditingQR(null);
      setQRForm(emptyQRForm);
      setQrPreviewUrl(null);
    }

    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setEditingQR(null);
    revokeBlobUrl(qrPreviewUrl);
    setQrPreviewUrl(null);
    setQRForm(emptyQRForm);
  };

  const handleQRFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.warning('Harap pilih file gambar.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Ukuran file QR code tidak boleh lebih dari 2MB.');
      return;
    }

    revokeBlobUrl(qrCropSrc);
    setQrCropSrc(URL.createObjectURL(file));
  };

  const handleQRSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editingQR) {
        await qrCodeService.updateQRCode(editingQR.id, {
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
      } else {
        await qrCodeService.createQRCode({
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
      }

      await loadSettings();
      closeQRModal();
      toast.success('QR code berhasil disimpan.');
    } catch  {
      toast.error('Gagal menyimpan QR code.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      if (deleteTarget.type === 'bank') {
        await apiClient.delete(`/payment-methods/bank-accounts/${deleteTarget.id}`);
      } else {
        await qrCodeService.deleteQRCode(deleteTarget.id);
      }

      setDeleteTarget(null);
      await loadSettings();
      toast.success(deleteTarget.type === 'bank' ? 'Rekening bank dihapus.' : 'QR code dihapus.');
    } catch  {
      toast.error('Gagal menghapus data.');
    }
  };

  const displayedTenantLogo = tenantLogoPreviewUrl || currentTenantLogoUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Tenant"
        subtitle="Kelola identitas tenant, siklus tagihan, rekening bank, dan kode QR pembayaran dengan layout yang nyaman di mobile."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Profil Tenant"
          value={profileForm.companyName || 'Belum diisi'}
          helper="Identitas utama"
          subtitle="Nama dan identitas tenant yang tampil di aplikasi."
          icon={UserCircleIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Jadwal Tagihan"
          value={`Tgl ${billingForm.invoiceGenerationDay}`}
          helper="Jadwal bulanan"
          subtitle={`Jatuh tempo pada tanggal ${billingForm.invoiceDueDay}.`}
          icon={CloudArrowUpIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Rekening Aktif"
          value={stats.activeBanks.toLocaleString('id-ID')}
          helper={`${stats.banks} total rekening`}
          subtitle="Metode transfer bank untuk pelanggan atau tenant."
          icon={BuildingLibraryIcon}
          tone="green"
        />
        <DashboardStatCard
          title="QR Aktif"
          value={stats.activeQrCodes.toLocaleString('id-ID')}
          helper={`${stats.qrCodes} total QR`}
          subtitle="Channel pembayaran digital yang saat ini aktif."
          icon={QrCodeIcon}
          tone="green"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Profil tenant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Perbarui identitas tenant yang tampil di sidebar dan informasi kontak utama.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                {displayedTenantLogo ? (
                  <img
                    src={displayedTenantLogo}
                    alt="Logo tenant"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <CloudArrowUpIcon className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm">Belum ada logo tenant</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="tenant-logo-input"
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                  Unggah Logo
                </label>
                <input
                  id="tenant-logo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={handleTenantLogoChange}
                />
                <p className="text-xs text-gray-500">JPG, PNG, GIF, atau WEBP. Maksimal 5MB.</p>
                {tenantLogoPreviewUrl && (
                  <button
                    type="button"
                    onClick={resetTenantLogoSelection}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Batalkan logo baru
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormInput
                  label="Nama tenant"
                  required
                  value={profileForm.companyName}
                  onChange={(event) => handleProfileChange('companyName', event.target.value)}
                />
              </div>
              <FormInput
                label="Telepon"
                value={profileForm.phone}
                onChange={(event) => handleProfileChange('phone', event.target.value)}
              />
              <FormInput
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
              />
              <div className="md:col-span-2">
                <FormInput
                  label="Website"
                  type="url"
                  value={profileForm.website}
                  onChange={(event) => handleProfileChange('website', event.target.value)}
                  placeholder="https://contoh-domain.com"
                />
              </div>
              <div className="md:col-span-2">
                <FormTextarea
                  label="Alamat"
                  rows={3}
                  value={profileForm.address}
                  onChange={(event) => handleProfileChange('address', event.target.value)}
                />
              </div>
              <FormInput
                label="Jam operasional"
                value={profileForm.operatingHours}
                onChange={(event) => handleProfileChange('operatingHours', event.target.value)}
                placeholder="Senin - Jumat, 08.00 - 16.00"
              />
              <FormInput
                label="Area layanan"
                value={profileForm.serviceArea}
                onChange={(event) => handleProfileChange('serviceArea', event.target.value)}
                placeholder="Kelurahan Sejahtera dan sekitarnya"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {profileSaving ? 'Menyimpan...' : 'Simpan Profil Tenant'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Siklus tagihan bulanan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Atur tanggal generate tagihan dan batas akhir pembayaran pelanggan.
          </p>
        </div>

        <form onSubmit={handleBillingSubmit} className="space-y-6 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Tanggal generate tagihan"
              type="number"
              min={1}
              max={31}
              value={billingForm.invoiceGenerationDay}
              onChange={(event) =>
                setBillingForm((prev) => ({ ...prev, invoiceGenerationDay: event.target.value }))
              }
            />
            <FormInput
              label="Tanggal jatuh tempo"
              type="number"
              min={1}
              max={31}
              value={billingForm.invoiceDueDay}
              onChange={(event) =>
                setBillingForm((prev) => ({ ...prev, invoiceDueDay: event.target.value }))
              }
            />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Tagihan akan digenerate tanggal <strong>{billingForm.invoiceGenerationDay}</strong> dan
            jatuh tempo pada tanggal <strong>{billingForm.invoiceDueDay}</strong>.
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="submit"
              disabled={billingSaving}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {billingSaving ? 'Menyimpan...' : 'Simpan Siklus Tagihan'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">Rekening bank</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Metode pembayaran transfer yang tersedia untuk tenant atau pelanggan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openBankModal()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Tambah Rekening
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {bankAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
              <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                Belum ada rekening bank yang dikonfigurasi.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((bank) => (
                <article
                  key={bank.id}
                  className={`rounded-2xl border p-4 ${
                    bank.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100">
                        <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{bank.bankName}</h3>
                          {bank.isPrimary && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                              Utama
                            </span>
                          )}
                          {!bank.isActive && (
                            <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Nama akun: {bank.accountName}</p>
                        <p className="mt-1 font-mono text-base font-semibold text-gray-900">
                          {bank.accountNumber}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Kode / cabang: {bank.bankCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openBankModal(bank)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        aria-label="Ubah rekening bank"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'bank', id: bank.id })}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label="Hapus rekening bank"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <QrCodeIcon className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">QR code pembayaran</h2>
                <p className="mt-1 text-sm text-gray-500">
                  QRIS atau e-wallet yang bisa digunakan pada alur pembayaran tenant.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openQRModal()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Tambah Kode QR
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {qrCodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
              <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900">Belum ada QR code pembayaran.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {qrCodes.map((qr) => (
                <article
                  key={qr.id}
                  className={`rounded-2xl border p-4 ${
                    qr.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        {qr.type}
                      </span>
                      {qr.is_primary && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Utama
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openQRModal(qr)}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                        aria-label="Ubah kode QR"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'qr', id: qr.id })}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Hapus kode QR"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    {qr.imageDisplayUrl ? (
                      <img
                        src={qr.imageDisplayUrl}
                        alt={`Kode QR ${qr.type}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <QrCodeIcon className="h-20 w-20 text-gray-400" />
                    )}
                  </div>

                  {qr.notes && <p className="mt-3 text-sm text-gray-500">{qr.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={showBankModal}
        onClose={closeBankModal}
        title={editingBank ? 'Ubah Rekening Bank' : 'Tambah Rekening Bank'}
        size="md"
        mobileFullscreen
      >
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <FormInput
            label="Nama bank"
            required
            value={bankForm.bankName}
            onChange={(event) =>
              setBankForm((prev) => ({ ...prev, bankName: event.target.value }))
            }
          />
          <FormInput
            label="Nomor rekening"
            required
            value={bankForm.accountNumber}
            onChange={(event) =>
              setBankForm((prev) => ({ ...prev, accountNumber: event.target.value }))
            }
          />
          <FormInput
            label="Nama pemilik rekening"
            required
            value={bankForm.accountName}
            onChange={(event) =>
              setBankForm((prev) => ({ ...prev, accountName: event.target.value }))
            }
          />
          <FormInput
            label="Kode / cabang bank"
            required
            value={bankForm.bankCode}
            onChange={(event) =>
              setBankForm((prev) => ({ ...prev, bankCode: event.target.value }))
            }
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <FormCheckbox
              checked={bankForm.isActive}
              onChange={(event) =>
                setBankForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
              label="Aktif"
            />
            <FormCheckbox
              checked={bankForm.isPrimary}
              onChange={(event) =>
                setBankForm((prev) => ({ ...prev, isPrimary: event.target.checked }))
              }
              label="Jadikan utama"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeBankModal}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
            >
              {editingBank ? 'Simpan Perubahan' : 'Tambah Rekening'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showQRModal}
        onClose={closeQRModal}
        title={editingQR ? 'Ubah Kode QR' : 'Tambah Kode QR'}
        size="md"
        mobileFullscreen
      >
        <form onSubmit={handleQRSubmit} className="space-y-4">
          <FormSelect
            label="Tipe"
            required
            value={qrForm.type}
            onChange={(event) =>
              setQRForm((prev) => ({ ...prev, type: event.target.value as QRCodeType }))
            }
            options={qrTypeOptions}
          />
          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700">
              Gambar QR code {editingQR ? '(opsional jika tidak diganti)' : '*'}
            </label>
            <div className="mt-3 rounded-2xl border-2 border-dashed border-gray-300 p-4">
              {qrPreviewUrl ? (
                <div className="relative">
                  <img
                    src={qrPreviewUrl}
                    alt="QR Preview"
                    className="mx-auto max-h-72 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      revokeBlobUrl(qrPreviewUrl);
                      setQrPreviewUrl(null);
                      setQRForm((prev) => ({ ...prev, imageFile: null }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white"
                    aria-label="Hapus preview QR"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                    Upload Gambar
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleQRFileChange}
                      required={!editingQR}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">PNG atau JPG, maksimal 2MB.</p>
                </div>
              )}
            </div>
          </div>
          <FormTextarea
            label="Catatan"
            rows={3}
            value={qrForm.notes}
            onChange={(event) => setQRForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Catatan opsional"
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <FormCheckbox
              checked={qrForm.isActive}
              onChange={(event) =>
                setQRForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
              label="Aktif"
            />
            <FormCheckbox
              checked={qrForm.isPrimary}
              onChange={(event) =>
                setQRForm((prev) => ({ ...prev, isPrimary: event.target.checked }))
              }
              label="Jadikan utama"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeQRModal}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
            >
              {editingQR ? 'Simpan Perubahan' : 'Tambah Kode QR'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'bank' ? 'Hapus Rekening Bank' : 'Hapus Kode QR'}
        message={
          deleteTarget?.type === 'bank'
            ? 'Apakah Anda yakin ingin menghapus rekening bank ini?'
            : 'Apakah Anda yakin ingin menghapus kode QR ini?'
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {logoCropSrc && (
        <ImageCropModal
          src={logoCropSrc}
          filename="tenant-logo.png"
          onConfirm={(croppedFile) => {
            resetTenantLogoSelection();
            setTenantLogoFile(croppedFile);
            setTenantLogoPreviewUrl(URL.createObjectURL(croppedFile));
            revokeBlobUrl(logoCropSrc);
            setLogoCropSrc(null);
          }}
          onCancel={() => {
            revokeBlobUrl(logoCropSrc);
            setLogoCropSrc(null);
          }}
        />
      )}

      {qrCropSrc && (
        <ImageCropModal
          src={qrCropSrc}
          filename="tenant-qr.png"
          aspect={1}
          onConfirm={(croppedFile) => {
            revokeBlobUrl(qrPreviewUrl);
            setQRForm((prev) => ({ ...prev, imageFile: croppedFile }));
            setQrPreviewUrl(URL.createObjectURL(croppedFile));
            revokeBlobUrl(qrCropSrc);
            setQrCropSrc(null);
          }}
          onCancel={() => {
            revokeBlobUrl(qrCropSrc);
            setQrCropSrc(null);
          }}
        />
      )}
    </div>
  );
}
