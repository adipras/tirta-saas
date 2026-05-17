import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerWaterPemakaian } from '../../services/customerPortalService';

const CustomerPemakaian: React.FC = () => {
  const navigate = useNavigate();
  const [usageData, setPemakaianData] = useState<CustomerWaterPemakaian[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadPemakaian();
  }, [navigate]);

  const loadPemakaian = async () => {
    try {
      const data = await customerPortalService.getWaterPemakaian();
      setPemakaianData(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalPemakaian = usageData.reduce((sum, usage) => sum + usage.usage_amount, 0);
  const averagePemakaian = usageData.length > 0 ? totalPemakaian / usageData.length : 0;
  const latestPemakaian = usageData[0];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/customer/dashboard" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pemakaian Air</h1>
              <p className="text-sm text-gray-600">Riwayat penggunaan air bulanan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pemakaian Bulan Ini</p>
                <p className="text-3xl font-bold text-blue-600">
                  {latestPemakaian ? latestPemakaian.usage_amount : 0} m³
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {latestPemakaian ? `${latestPemakaian.usage_month} ${latestPemakaian.usage_year}` : '-'}
                </p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata Pemakaian</p>
                <p className="text-3xl font-bold text-green-600">
                  {averagePemakaian.toFixed(1)} m³
                </p>
                <p className="text-sm text-gray-500 mt-1">Per bulan</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pemakaian</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {totalPemakaian.toFixed(0)} m³
                </p>
                <p className="text-sm text-gray-500 mt-1">{usageData.length} bulan</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Pemakaian History */}
        {usageData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada data pemakaian air</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Pemakaian</h3>
            </div>
            <div className="space-y-3 p-4 sm:p-6">
              {usageData.map((usage) => (
                <div key={usage.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {usage.usage_month} {usage.usage_year}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(usage.reading_date)}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      {usage.usage_amount} m³
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Meteran Awal</span>
                      <span className="font-medium text-gray-900">{usage.previous_reading} m³</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Meteran Akhir</span>
                      <span className="font-medium text-gray-900">{usage.current_reading} m³</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPemakaian;
