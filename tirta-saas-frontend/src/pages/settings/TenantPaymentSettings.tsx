import { useCallback, useEffect, useState } from 'react';
import {
  BuildingLibraryIcon,
  CloudArrowUpIcon,
  PencilIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  XMarkIcon,
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
import { ConfirmModal, ImageCropModal, Modal, PageHeader, useToast } from '../../components';

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

function extractBankList(payload: unknown): RawBankAccount[] {
  if (Array.isArray(payload)) {
    return payload as RawBankAccount[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: RawBankAccount[] }).data;
  }

  return [];
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
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bank' | 'qr'; id: string } | null>(null);
  const [currentTenantLogoUrl, setCurrentTenantLogoUrl] = useState<string | null>(null);
  const [tenantLogoFile, setTenantLogoFile] = useState<File | null>(null);
  const [tenantLogoPreviewUrl, setTenantLogoPreviewUrl] = useState<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [qrCropSrc, setQrCropSrc] = useState<string | null>(null);

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
    isActive: true,
    isPrimary: false,
  });

  const [qrForm, setQRForm] = useState<{
    type: QRCodeType;
    imageFile: File | null;
    isActive: boolean;
    isPrimary: boolean;
    notes: string;
  }>({
    type: 'QRIS',
    imageFile: null,
    isActive: true,
    isPrimary: false,
    notes: '',
  });

  useEffect(() => {
    return () => {
      if (tenantLogoPreviewUrl) {
        URL.revokeObjectURL(tenantLogoPreviewUrl);
      }
    };
  }, [tenantLogoPreviewUrl]);

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
    } catch (error) {
      console.error('Failed to load tenant settings:', error);
      toast.error('Gagal memuat pengaturan tenant.');
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleProfileChange = (
    field: keyof TenantProfileForm,
    value: string
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetTenantLogoSelection = () => {
    if (tenantLogoPreviewUrl) {
      URL.revokeObjectURL(tenantLogoPreviewUrl);
    }
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

    // Open crop modal
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
    } catch (error) {
      console.error('Failed to save tenant profile:', error);
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
    } catch (error) {
      console.error('Failed to save billing settings:', error);
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
      setBankForm({
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankCode: '',
        isActive: true,
        isPrimary: false,
      });
    }

    setShowBankModal(true);
  };

  const closeBankModal = () => {
    setShowBankModal(false);
    setEditingBank(null);
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
    } catch (error) {
      console.error('Failed to save bank account:', error);
      toast.error('Gagal menyimpan rekening bank.');
    }
  };

  const openQRModal = (qr?: QRCode) => {
    if (qr) {
      setEditingQR(qr);
      setQRForm({
        type: qr.type,
        imageFile: null,
        isActive: qr.is_active,
        isPrimary: qr.is_primary,
        notes: qr.notes || '',
      });
      setQrPreviewUrl(qr.imageDisplayUrl || '');
    } else {
      setEditingQR(null);
      setQRForm({
        type: 'QRIS',
        imageFile: null,
        isActive: true,
        isPrimary: false,
        notes: '',
      });
      setQrPreviewUrl(null);
    }

    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setEditingQR(null);
    setQrPreviewUrl(null);
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

    // Open crop modal (1:1 for QR)
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
    } catch (error) {
      console.error('Failed to save QR code:', error);
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
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Gagal menghapus data.');
    }
  };

  const displayedTenantLogo = tenantLogoPreviewUrl || currentTenantLogoUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Tenant"
        subtitle="Kelola profil tenant, logo, siklus tagihan, rekening bank, dan QR code pembayaran"
      />

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Profil Tenant</h2>
          <p className="mt-1 text-sm text-gray-600">
            Perbarui identitas tenant yang tampil di sidebar dan informasi kontak utama.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
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

              <div>
                <label htmlFor="tenant-logo-input" className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  <CloudArrowUpIcon className="mr-2 h-5 w-5" />
                  Upload Logo
                </label>
                <input
                  id="tenant-logo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  onChange={handleTenantLogoChange}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format JPG, PNG, GIF, atau WEBP. Maksimal 5MB.
                </p>
                {tenantLogoPreviewUrl && (
                  <button
                    type="button"
                    onClick={resetTenantLogoSelection}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Batalkan logo baru
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nama Tenant
                </label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => handleProfileChange('companyName', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telepon
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="https://contoh-domain.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Alamat
                </label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jam Operasional
                </label>
                <input
                  type="text"
                  value={profileForm.operatingHours}
                  onChange={(e) => handleProfileChange('operatingHours', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Senin - Jumat, 08.00 - 16.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Area Layanan
                </label>
                <input
                  type="text"
                  value={profileForm.serviceArea}
                  onChange={(e) => handleProfileChange('serviceArea', e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Kelurahan Sejahtera dan sekitarnya"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {profileSaving ? 'Menyimpan...' : 'Simpan Profil Tenant'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Siklus Tagihan Bulanan</h2>
          <p className="mt-1 text-sm text-gray-600">
            Atur tanggal generate tagihan dan batas akhir pembayaran pelanggan.
          </p>
        </div>

        <form onSubmit={handleBillingSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Generate Tagihan
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={billingForm.invoiceGenerationDay}
                onChange={(e) =>
                  setBillingForm((prev) => ({ ...prev, invoiceGenerationDay: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Jatuh Tempo
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={billingForm.invoiceDueDay}
                onChange={(e) =>
                  setBillingForm((prev) => ({ ...prev, invoiceDueDay: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Tagihan akan digenerate tanggal <strong>{billingForm.invoiceGenerationDay}</strong> dan
            jatuh tempo pada tanggal <strong>{billingForm.invoiceDueDay}</strong>.
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={billingSaving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {billingSaving ? 'Menyimpan...' : 'Simpan Siklus Tagihan'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <BuildingLibraryIcon className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Rekening Bank</h2>
            </div>
            <button
              onClick={() => openBankModal()}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Tambah Rekening
            </button>
          </div>
        </div>

        <div className="p-6">
          {bankAccounts.length === 0 ? (
            <div className="py-8 text-center">
              <BuildingLibraryIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Belum ada rekening bank yang dikonfigurasi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((bank) => (
                <div
                  key={bank.id}
                  className={`rounded-lg border p-4 ${
                    bank.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{bank.bankName}</h3>
                          {bank.isPrimary && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Utama
                            </span>
                          )}
                          {!bank.isActive && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Nama akun: {bank.accountName}</p>
                        <p className="mt-1 font-mono text-base font-semibold text-gray-900">
                          {bank.accountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => openBankModal(bank)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'bank', id: bank.id })}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <QrCodeIcon className="mr-2 h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
            </div>
            <button
              onClick={() => openQRModal()}
              className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 sm:w-auto"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Tambah QR Code
            </button>
          </div>
        </div>

        <div className="p-6">
          {qrCodes.length === 0 ? (
            <div className="py-8 text-center">
              <QrCodeIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Belum ada QR code pembayaran.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className={`rounded-lg border p-4 ${
                    qr.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        {qr.type}
                      </span>
                      {qr.is_primary && (
                        <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          Utama
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openQRModal(qr)}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'qr', id: qr.id })}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {qr.imageDisplayUrl ? (
                      <img
                        src={qr.imageDisplayUrl}
                        alt={`${qr.type} QR Code`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <QrCodeIcon className="h-20 w-20 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showBankModal}
        onClose={closeBankModal}
        title={editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
        size="md"
        mobileFullscreen
        bodyClassName="p-0"
      >
        <form onSubmit={handleBankSubmit} className="flex min-h-full flex-col">
          <div className="flex-1 space-y-4 p-4 sm:p-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Kode / Cabang Bank
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankCode}
                      onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bankForm.isActive}
                        onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Aktif</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bankForm.isPrimary}
                        onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Jadikan utama</span>
                    </label>
                  </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeBankModal}
                className="w-full rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
              >
                {editingBank ? 'Simpan Perubahan' : 'Tambah Rekening'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showQRModal}
        onClose={closeQRModal}
        title={editingQR ? 'Edit QR Code' : 'Tambah QR Code'}
        size="md"
        mobileFullscreen
        bodyClassName="p-0"
      >
        <form onSubmit={handleQRSubmit} className="flex min-h-full flex-col">
          <div className="flex-1 space-y-4 p-4 sm:p-6">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipe</label>
                    <select
                      value={qrForm.type}
                      onChange={(e) => setQRForm({ ...qrForm, type: e.target.value as QRCodeType })}
                      className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Gambar QR Code
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
                      {qrPreviewUrl ? (
                        <div className="relative">
                          <img src={qrPreviewUrl} alt="QR Preview" className="w-full rounded-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setQrPreviewUrl(null);
                              setQRForm({ ...qrForm, imageFile: null });
                            }}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <label htmlFor="qr-upload" className="mt-2 inline-block cursor-pointer">
                            <span className="inline-block rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                              Upload Gambar
                            </span>
                            <input
                              id="qr-upload"
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

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={qrForm.isActive}
                        onChange={(e) => setQRForm({ ...qrForm, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Aktif</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={qrForm.isPrimary}
                        onChange={(e) => setQRForm({ ...qrForm, isPrimary: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Jadikan utama</span>
                    </label>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
                    <input
                      type="text"
                      value={qrForm.notes}
                      onChange={(e) => setQRForm({ ...qrForm, notes: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="Catatan opsional"
                    />
                  </div>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeQRModal}
                className="w-full rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 sm:w-auto"
              >
                {editingQR ? 'Simpan Perubahan' : 'Tambah QR Code'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'bank' ? 'Hapus Rekening Bank' : 'Hapus QR Code'}
        message={
          deleteTarget?.type === 'bank'
            ? 'Apakah Anda yakin ingin menghapus rekening bank ini?'
            : 'Apakah Anda yakin ingin menghapus QR code ini?'
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {logoCropSrc && (
        <ImageCropModal
          src={logoCropSrc}
          filename="logo.png"
          onConfirm={(croppedFile) => {
            resetTenantLogoSelection();
            setTenantLogoFile(croppedFile);
            setTenantLogoPreviewUrl(URL.createObjectURL(croppedFile));
            setLogoCropSrc(null);
          }}
          onCancel={() => {
            URL.revokeObjectURL(logoCropSrc);
            setLogoCropSrc(null);
          }}
        />
      )}

      {qrCropSrc && (
        <ImageCropModal
          src={qrCropSrc}
          filename="qr.png"
          aspect={1}
          onConfirm={(croppedFile) => {
            setQRForm((prev) => ({ ...prev, imageFile: croppedFile }));
            setQrPreviewUrl(URL.createObjectURL(croppedFile));
            setQrCropSrc(null);
          }}
          onCancel={() => {
            URL.revokeObjectURL(qrCropSrc);
            setQrCropSrc(null);
          }}
        />
      )}
    </div>
  );
}
