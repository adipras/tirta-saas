import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { platformQrCodeService } from '../../services/platformQrCodeService';
import type { QRCode } from '../../services/qrCodeService';
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

interface PlatformBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  isActive: boolean;
  isPrimary: boolean;
  description?: string;
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
  notes?: string;
}

type QRCodeType = 'QRIS' | 'DANA' | 'GOPAY' | 'OVO' | 'SHOPEEPAY';

interface BankFormState {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  description: string;
  isActive: boolean;
  isPrimary: boolean;
}

interface QRFormState {
  type: QRCodeType;
  notes: string;
  imageFile: File | null;
  isActive: boolean;
  isPrimary: boolean;
}

const qrTypeOptions = [
  { value: 'QRIS', label: 'QRIS (semua e-wallet)' },
  { value: 'GOPAY', label: 'GoPay' },
  { value: 'OVO', label: 'OVO' },
  { value: 'DANA', label: 'DANA' },
  { value: 'SHOPEEPAY', label: 'ShopeePay' },
];

const emptyBankForm: BankFormState = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  bankCode: '',
  description: '',
  isActive: true,
  isPrimary: false,
};

const emptyQRForm: QRFormState = {
  type: 'QRIS',
  notes: '',
  imageFile: null,
  isActive: true,
  isPrimary: false,
};

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

function mapBank(bank: RawBankAccount): PlatformBankAccount {
  return {
    id: bank.id,
    bankName: bank.bank_name,
    accountNumber: bank.account_number,
    accountName: bank.account_name,
    bankCode: bank.swift_code || bank.bank_branch || '',
    isActive: bank.is_active,
    isPrimary: bank.is_primary,
    description: bank.notes || '',
  };
}

const revokeBlobUrl = (url: string | null) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export default function PlatformPaymentSettings() {
  const toast = useToast();
  const [bankAccounts, setBankAccounts] = useState<PlatformBankAccount[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingBank, setEditingBank] = useState<PlatformBankAccount | null>(null);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrCropSrc, setQrCropSrc] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bank' | 'qr'; id: string } | null>(
    null
  );
  const [bankForm, setBankForm] = useState<BankFormState>(emptyBankForm);
  const [qrForm, setQRForm] = useState<QRFormState>(emptyQRForm);

  const loadSettings = useCallback(async () => {
    try {
      const [bankRes, qrRes] = await Promise.allSettled([
        apiClient.get<unknown>('/platform/payment-methods/bank-accounts'),
        platformQrCodeService.getQRCodes(),
      ]);

      if (bankRes.status === 'fulfilled') {
        const list = extractBankList(bankRes.value);
        setBankAccounts(list.map(mapBank));
      }

      if (qrRes.status === 'fulfilled') {
        setQRCodes(qrRes.value);
      }
    } catch  {
      toast.error('Gagal memuat pengaturan pembayaran platform.');
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    return () => {
      revokeBlobUrl(previewUrl);
      revokeBlobUrl(qrCropSrc);
    };
  }, [previewUrl, qrCropSrc]);

  const stats = useMemo(
    () => ({
      banks: bankAccounts.length,
      activeBanks: bankAccounts.filter((bank) => bank.isActive).length,
      qrCodes: qrCodes.length,
      activeQrCodes: qrCodes.filter((qr) => qr.is_active).length,
    }),
    [bankAccounts, qrCodes]
  );

  const openBankModal = (bank?: PlatformBankAccount) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
        bankCode: bank.bankCode,
        description: bank.description || '',
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
        notes: bankForm.description,
        is_primary: bankForm.isPrimary,
        is_active: bankForm.isActive,
      };

      if (editingBank) {
        await apiClient.put(`/platform/payment-methods/bank-accounts/${editingBank.id}`, payload);
        toast.success('Rekening bank platform berhasil diperbarui.');
      } else {
        await apiClient.post('/platform/payment-methods/bank-accounts', payload);
        toast.success('Rekening bank platform berhasil ditambahkan.');
      }

      await loadSettings();
      closeBankModal();
    } catch  {
      toast.error('Gagal menyimpan rekening bank.');
    }
  };

  const openQRModal = (qr?: QRCode) => {
    revokeBlobUrl(previewUrl);

    if (qr) {
      setEditingQR(qr);
      setQRForm({
        type: qr.type,
        notes: qr.notes || '',
        imageFile: null,
        isActive: qr.is_active,
        isPrimary: qr.is_primary,
      });
      setPreviewUrl(qr.imageDisplayUrl || null);
    } else {
      setEditingQR(null);
      setQRForm(emptyQRForm);
      setPreviewUrl(null);
    }

    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setEditingQR(null);
    revokeBlobUrl(previewUrl);
    setPreviewUrl(null);
    setQRForm(emptyQRForm);
  };

  const handleQRFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.warning('Harap pilih file gambar untuk QR code.');
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
        await platformQrCodeService.updateQRCode(editingQR.id, {
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
        toast.success('QR code platform berhasil diperbarui.');
      } else {
        await platformQrCodeService.createQRCode({
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
        toast.success('QR code platform berhasil ditambahkan.');
      }

      await loadSettings();
      closeQRModal();
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
        await apiClient.delete(`/platform/payment-methods/bank-accounts/${deleteTarget.id}`);
        toast.success('Rekening bank berhasil dihapus.');
      } else {
        await platformQrCodeService.deleteQRCode(deleteTarget.id);
        toast.success('QR code berhasil dihapus.');
      }

      setDeleteTarget(null);
      await loadSettings();
    } catch  {
      toast.error('Gagal menghapus data pembayaran.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Pembayaran Platform"
        subtitle="Kelola rekening bank dan QR code yang ditampilkan ke tenant saat proses langganan atau perpanjangan."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Rekening Bank"
          value={stats.banks.toLocaleString('id-ID')}
          helper="Metode transfer"
          subtitle="Total rekening tujuan pembayaran tenant."
          icon={BuildingLibraryIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Bank Aktif"
          value={stats.activeBanks.toLocaleString('id-ID')}
          helper="Sedang dipublikasikan"
          subtitle="Rekening yang saat ini tampil pada flow pembayaran tenant."
          icon={BuildingLibraryIcon}
          tone="green"
        />
        <DashboardStatCard
          title="QR Code"
          value={stats.qrCodes.toLocaleString('id-ID')}
          helper="Pembayaran digital"
          subtitle="Total QR code yang tersedia untuk tenant."
          icon={QrCodeIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="QR Aktif"
          value={stats.activeQrCodes.toLocaleString('id-ID')}
          helper="Siap dipakai"
          subtitle="QR code aktif yang dapat dipilih tenant."
          icon={QrCodeIcon}
          tone="green"
        />
      </div>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <p className="text-sm leading-6 text-blue-900">
          Metode pembayaran di halaman ini akan muncul pada alur langganan tenant. Pastikan rekening
          dan QR code yang aktif memang siap menerima pembayaran.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">Rekening bank</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Rekening transfer manual yang tersedia untuk tenant.
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
                Belum ada rekening bank platform.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Tambahkan rekening pertama agar tenant bisa melakukan transfer bank.
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
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <BuildingLibraryIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{bank.bankName}</h3>
                          {bank.isPrimary && (
                            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                              Utama
                            </span>
                          )}
                          {!bank.isActive && (
                            <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{bank.accountName}</p>
                        <p className="mt-1 break-all font-mono text-base font-semibold text-gray-900">
                          {bank.accountNumber}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">Kode / cabang: {bank.bankCode}</p>
                        {bank.description && (
                          <p className="mt-2 text-sm text-gray-500">{bank.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openBankModal(bank)}
                        className="inline-flex items-center justify-center rounded-lg p-2.5 text-blue-600 hover:bg-blue-50"
                        aria-label="Edit rekening bank"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'bank', id: bank.id })}
                        className="inline-flex items-center justify-center rounded-lg p-2.5 text-red-600 hover:bg-red-50"
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
                  QRIS dan QR e-wallet yang dapat dipakai tenant untuk membayar langganan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openQRModal()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Tambah QR Code
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {qrCodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center">
              <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900">Belum ada QR code pembayaran.</p>
              <p className="mt-1 text-sm text-gray-500">
                Tambahkan QR pertama agar tenant bisa membayar lewat kanal digital.
              </p>
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
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        {qr.type}
                      </span>
                      {qr.is_primary && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Utama
                        </span>
                      )}
                      {!qr.is_active && (
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openQRModal(qr)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                        aria-label="Edit QR code"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'qr', id: qr.id })}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Hapus QR code"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                    {qr.imageDisplayUrl ? (
                      <img
                        src={qr.imageDisplayUrl}
                        alt={`QR ${qr.type}`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
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
        title={editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
        size="md"
        mobileFullscreen
      >
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <FormInput
            label="Nama bank"
            required
            value={bankForm.bankName}
            onChange={(event) =>
              setBankForm((current) => ({ ...current, bankName: event.target.value }))
            }
            placeholder="Contoh: Bank BCA"
          />
          <FormInput
            label="Nomor rekening"
            required
            value={bankForm.accountNumber}
            onChange={(event) =>
              setBankForm((current) => ({ ...current, accountNumber: event.target.value }))
            }
            placeholder="Contoh: 9876543210"
          />
          <FormInput
            label="Nama pemilik rekening"
            required
            value={bankForm.accountName}
            onChange={(event) =>
              setBankForm((current) => ({ ...current, accountName: event.target.value }))
            }
            placeholder="Contoh: PT Tirta SaaS Indonesia"
          />
          <FormInput
            label="Kode / cabang bank"
            required
            value={bankForm.bankCode}
            onChange={(event) =>
              setBankForm((current) => ({ ...current, bankCode: event.target.value }))
            }
            placeholder="Contoh: BCA atau KCP Sudirman"
          />
          <FormTextarea
            label="Deskripsi"
            rows={3}
            value={bankForm.description}
            onChange={(event) =>
              setBankForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Catatan tambahan untuk tenant, misalnya khusus pembayaran langganan."
          />
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <FormCheckbox
              checked={bankForm.isActive}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, isActive: event.target.checked }))
              }
              label="Aktifkan rekening ini untuk tenant"
            />
            <FormCheckbox
              checked={bankForm.isPrimary}
              onChange={(event) =>
                setBankForm((current) => ({ ...current, isPrimary: event.target.checked }))
              }
              label="Jadikan rekening utama"
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
        title={editingQR ? 'Edit QR Code' : 'Tambah QR Code'}
        size="md"
        mobileFullscreen
      >
        <form onSubmit={handleQRSubmit} className="space-y-4">
          <FormSelect
            label="Tipe QR"
            required
            value={qrForm.type}
            onChange={(event) =>
              setQRForm((current) => ({ ...current, type: event.target.value as QRCodeType }))
            }
            options={qrTypeOptions}
          />
          <FormTextarea
            label="Catatan"
            rows={3}
            value={qrForm.notes}
            onChange={(event) =>
              setQRForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Contoh: QRIS utama untuk pembayaran langganan tenant."
          />

          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700">
              Gambar QR code {editingQR ? '(opsional jika tidak diganti)' : '*'}
            </label>
            <div className="mt-3 rounded-2xl border-2 border-dashed border-gray-300 p-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview QR code"
                    className="mx-auto max-h-72 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      revokeBlobUrl(previewUrl);
                      setPreviewUrl(null);
                      setQRForm((current) => ({ ...current, imageFile: null }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white"
                    aria-label="Hapus preview QR"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                    Upload Gambar
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleQRFileChange}
                      required={!editingQR}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">JPG atau PNG, maksimal 2MB.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <FormCheckbox
              checked={qrForm.isActive}
              onChange={(event) =>
                setQRForm((current) => ({ ...current, isActive: event.target.checked }))
              }
              label="Aktifkan QR code ini"
            />
            <FormCheckbox
              checked={qrForm.isPrimary}
              onChange={(event) =>
                setQRForm((current) => ({ ...current, isPrimary: event.target.checked }))
              }
              label="Jadikan QR code utama"
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
              {editingQR ? 'Simpan Perubahan' : 'Tambah QR Code'}
            </button>
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
            ? 'Rekening bank ini akan dihapus dari pilihan pembayaran tenant. Tindakan ini tidak dapat dibatalkan.'
            : 'QR code ini akan dihapus dari pilihan pembayaran tenant. Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {qrCropSrc && (
        <ImageCropModal
          src={qrCropSrc}
          filename="platform-qr.png"
          aspect={1}
          onConfirm={(croppedFile) => {
            revokeBlobUrl(previewUrl);
            setQRForm((current) => ({ ...current, imageFile: croppedFile }));
            setPreviewUrl(URL.createObjectURL(croppedFile));
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
