import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import meterService from '../../services/meterService';
import { subscriptionService } from '../../services/subscriptionService';
import type { Meter } from '../../types/meter';
import type { SubscriptionType } from '../../types/subscription';
import { useToast } from '../../components';
import MeterForm from './MeterForm';

interface CustomerMetersSectionProps {
  customerId: string;
  onMetersUpdated?: () => void;
}

export default function CustomerMetersSection({ customerId, onMetersUpdated }: CustomerMetersSectionProps) {
  const toast = useToast();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [deletingMeter, setDeletingMeter] = useState<Meter | null>(null);

  const fetchMeters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await meterService.getMetersByCustomer(customerId);
      setMeters(data);
    } catch {
      toast.error('Gagal memuat data meter');
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch {
      toast.error('Gagal memuat tipe langganan');
    }
  }, [toast]);

  useEffect(() => {
    fetchMeters();
    fetchSubscriptionTypes();
  }, [fetchMeters, fetchSubscriptionTypes]);

  const handleSaveSuccess = () => {
    setShowForm(false);
    setEditingMeter(null);
    fetchMeters();
    onMetersUpdated?.();
    toast.success(editingMeter ? 'Meter berhasil diperbarui' : 'Meter berhasil ditambahkan');
  };

  const handleDeleteMeter = async () => {
    if (!deletingMeter) return;

    try {
      await meterService.deleteMeter(customerId, deletingMeter.id);
      setDeletingMeter(null);
      fetchMeters();
      onMetersUpdated?.();
      toast.success('Meter berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus meter');
    }
  };

  const handleEditMeter = (meter: Meter) => {
    setEditingMeter(meter);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between border-b border-gray-200">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Meter ({meters.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Kelola meteran air untuk pelanggan ini
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMeter(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Tambah Meter
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <MeterForm
            customerId={customerId}
            meter={editingMeter}
            subscriptionTypes={subscriptionTypes}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingMeter(null);
            }}
          />
        </div>
      )}

      {/* Meters List */}
      <div className="overflow-x-auto">
        {meters.length === 0 ? (
          <div className="px-4 py-8 sm:px-6 text-center text-gray-500">
            Belum ada meter. Tambahkan meter pertama untuk pelanggan ini.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nomor Meter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe Langganan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Reading
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Instalasi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meters.map((meter) => (
                <tr key={meter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{meter.meter_number}</div>
                    {meter.brand && (
                      <div className="text-xs text-gray-500">
                        {meter.brand} {meter.model ? `- ${meter.model}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {meter.subscription_type?.name || <span className="text-gray-500">-</span>}
                    </div>
                    {meter.subscription_type_id && (
                      <div className="text-xs text-green-600">Custom rate</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {meter.initial_reading.toFixed(2)} m³
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        meter.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {meter.status === 'active' ? (
                        <>
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="mr-1 h-3 w-3" />
                          {meter.status}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(meter.install_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditMeter(meter)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Edit meter"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingMeter(meter)}
                      className="text-red-600 hover:text-red-900"
                      title="Hapus meter"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMeter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Hapus Meter?
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus meter <strong>{deletingMeter.meter_number}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeletingMeter(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMeter}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
