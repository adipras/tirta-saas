import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import { platformQrCodeService } from '../../services/platformQrCodeService';
import type { QRCode } from '../../services/qrCodeService';
import { PageHeader, ConfirmModal, useToast } from '../../components';

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

type QRCodeType = 'QRIS' | 'DANA' | 'GOPAY' | 'OVO' | 'SHOPEEPAY';

function mapBank(b: any): PlatformBankAccount {
  return {
    id: b.id,
    bankName: b.bank_name,
    accountNumber: b.account_number,
    accountName: b.account_name,
    bankCode: b.swift_code || b.bank_branch || '',
    isActive: b.is_active,
    isPrimary: b.is_primary,
    description: b.notes || '',
  };
}

export default function PlatformPaymentSettings() {
  const toast = useToast();
  const [bankAccounts, setBankAccounts] = useState<PlatformBankAccount[]>([]);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingBank, setEditingBank] = useState<PlatformBankAccount | null>(null);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bank' | 'qr'; id: string } | null>(null);

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
    description: '',
    isActive: true,
    isPrimary: false,
  });

  const [qrForm, setQRForm] = useState<{
    type: QRCodeType;
    notes: string;
    imageFile: File | null;
    isActive: boolean;
    isPrimary: boolean;
  }>({
    type: 'QRIS',
    notes: '',
    imageFile: null,
    isActive: true,
    isPrimary: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [bankRes, qrRes] = await Promise.allSettled([
        apiClient.get('/platform/payment-methods/bank-accounts'),
        platformQrCodeService.getQRCodes(),
      ]);
      if (bankRes.status === 'fulfilled') {
        const list = (bankRes.value as any)?.data || [];
        setBankAccounts(list.map(mapBank));
      }
      if (qrRes.status === 'fulfilled') {
        setQRCodes(qrRes.value);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

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
      setBankForm({
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankCode: '',
        description: '',
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

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const res = await apiClient.put(`/platform/payment-methods/bank-accounts/${editingBank.id}`, payload);
        const updated = mapBank((res as any).data);
        setBankAccounts((prev) => prev.map((b) => (b.id === editingBank.id ? updated : b)));
      } else {
        const res = await apiClient.post('/platform/payment-methods/bank-accounts', payload);
        const created = mapBank((res as any).data);
        setBankAccounts((prev) => [...prev, created]);
      }
      closeBankModal();
    } catch (error) {
      console.error('Failed to save bank account:', error);
      toast.error('Gagal menyimpan rekening bank.');
    }
  };

  const handleDeleteBank = (id: string) => {
    setDeleteTarget({ type: 'bank', id });
  };

  const openQRModal = (qr?: QRCode) => {
    if (qr) {
      setEditingQR(qr);
      setQRForm({
        type: qr.type,
        notes: qr.notes || '',
        imageFile: null,
        isActive: qr.is_active,
        isPrimary: qr.is_primary,
      });
      setPreviewUrl(qr.imageDisplayUrl || '');
    } else {
      setEditingQR(null);
      setQRForm({
        type: 'QRIS',
        notes: '',
        imageFile: null,
        isActive: true,
        isPrimary: false,
      });
      setPreviewUrl(null);
    }
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setEditingQR(null);
    setPreviewUrl(null);
  };

  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.warning('Harap pilih file gambar');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('Ukuran file tidak boleh lebih dari 2MB');
        return;
      }
      setQRForm((prev) => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQR) {
        const updated = await platformQrCodeService.updateQRCode(editingQR.id, {
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
        setQRCodes((prev) => prev.map((q) => (q.id === editingQR.id ? updated : q)));
      } else {
        const created = await platformQrCodeService.createQRCode({
          type: qrForm.type,
          is_primary: qrForm.isPrimary,
          is_active: qrForm.isActive,
          notes: qrForm.notes,
          image: qrForm.imageFile || undefined,
        });
        setQRCodes((prev) => [...prev, created]);
      }
      closeQRModal();
    } catch (error) {
      console.error('Failed to save QR code:', error);
      toast.error('Gagal menyimpan QR code.');
    }
  };

  const handleDeleteQR = (id: string) => {
    setDeleteTarget({ type: 'qr', id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'bank') {
        await apiClient.delete(`/platform/payment-methods/bank-accounts/${deleteTarget.id}`);
        setBankAccounts((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      } else {
        await platformQrCodeService.deleteQRCode(deleteTarget.id);
        setQRCodes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Payment Settings" subtitle="Manage bank accounts and QR codes for tenant subscription payments" />

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These payment methods will be shown to tenants when they subscribe or renew their subscription.
        </p>
      </div>

      {/* Bank Accounts Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BuildingLibraryIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Bank Accounts</h2>
            </div>
            <button
              onClick={() => openBankModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Bank Account
            </button>
          </div>
        </div>

        <div className="p-6">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <BuildingLibraryIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No bank accounts configured</p>
              <button
                onClick={() => openBankModal()}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first bank account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((bank) => (
                <div
                  key={bank.id}
                  className={`border rounded-lg p-4 ${
                    bank.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{bank.bankName}</h3>
                          {bank.isPrimary && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              Primary
                            </span>
                          )}
                          {!bank.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Account Name: {bank.accountName}</p>
                        <p className="text-base font-mono font-semibold text-gray-900 mt-1">
                          {bank.accountNumber}
                        </p>
                        {bank.description && (
                          <p className="text-sm text-gray-500 mt-1">{bank.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openBankModal(bank)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
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

      {/* QR Codes Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <QrCodeIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">QR Codes</h2>
            </div>
            <button
              onClick={() => openQRModal()}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add QR Code
            </button>
          </div>
        </div>

        <div className="p-6">
          {qrCodes.length === 0 ? (
            <div className="text-center py-8">
              <QrCodeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No QR codes configured</p>
              <button
                onClick={() => openQRModal()}
                className="mt-3 text-green-600 hover:text-green-700 font-medium"
              >
                Add your first QR code
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className={`border rounded-lg p-4 ${
                    qr.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                        {qr.type}
                      </span>
                      {qr.is_primary && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                          Primary
                        </span>
                      )}
                      {!qr.is_active && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openQRModal(qr)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQR(qr.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                    {qr.imageDisplayUrl ? (
                      <img
                        src={qr.imageDisplayUrl}
                        alt={`${qr.type} QR Code`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <QrCodeIcon className="h-20 w-20 text-gray-400" />
                    )}
                  </div>
                  {qr.notes && (
                    <p className="text-xs text-gray-600 text-center">{qr.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Account Modal - Similar to Tenant version but with description */}
      {showBankModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleBankSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bank BCA"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 9876543210"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., PT Tirta SaaS Indonesia"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankForm.bankCode}
                      onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., BCA, MANDIRI"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={bankForm.description}
                      onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., For subscription payments"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bankForm.isActive}
                        onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bankForm.isPrimary}
                        onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Primary</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeBankModal}
                  className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBank ? 'Update' : 'Add'} Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal - Similar structure with description field */}
      {showQRModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleQRSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingQR ? 'Edit QR Code' : 'Add QR Code'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={qrForm.type}
                      onChange={(e) => setQRForm({ ...qrForm, type: e.target.value as QRCodeType })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="QRIS">QRIS (All E-Wallets)</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={qrForm.notes}
                      onChange={(e) => setQRForm({ ...qrForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., QRIS for subscription"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Image <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {previewUrl ? (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="QR Preview"
                            className="w-full rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl(null);
                              setQRForm({ ...qrForm, imageFile: null });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <label htmlFor="qr-upload" className="mt-2 inline-block cursor-pointer">
                            <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block">
                              Upload Image
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
                          <p className="mt-1 text-xs text-gray-500">PNG or JPG, max 2MB</p>
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
                      <span className="ml-2 text-sm text-gray-700">Active</span>
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
                      <span className="ml-2 text-sm text-gray-700">Set as Primary</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={closeQRModal}
                  className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingQR ? 'Update' : 'Add'} QR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'bank' ? 'Hapus Rekening Bank' : 'Hapus QR Code'}
        message={
          deleteTarget?.type === 'bank'
            ? 'Apakah kamu yakin ingin menghapus rekening bank ini? Tindakan ini tidak dapat dibatalkan.'
            : 'Apakah kamu yakin ingin menghapus QR code ini? Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
