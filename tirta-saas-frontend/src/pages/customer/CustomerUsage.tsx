import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerWaterUsage } from '../../services/customerPortalService';

const CustomerUsage: React.FC = () => {
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState<CustomerWaterUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadUsage();
  }, [navigate]);

  const loadUsage = async () => {
    try {
      const data = await customerPortalService.getWaterUsage();
      setUsageData(data);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
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

  const totalUsage = usageData.reduce((sum, usage) => sum + usage.usage_amount, 0);
  const averageUsage = usageData.length > 0 ? totalUsage / usageData.length : 0;
  const latestUsage = usageData[0];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pemakaian Bulan Ini</p>
                <p className="text-3xl font-bold text-blue-600">
                  {latestUsage ? latestUsage.usage_amount : 0} m³
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {latestUsage ? `${latestUsage.usage_month} ${latestUsage.usage_year}` : '-'}
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
                  {averageUsage.toFixed(1)} m³
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
                  {totalUsage.toFixed(0)} m³
                </p>
                <p className="text-sm text-gray-500 mt-1">{usageData.length} bulan</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Usage History */}
        {usageData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada data pemakaian air</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Pemakaian</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Catat
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meteran Awal
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meteran Akhir
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pemakaian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usageData.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {usage.usage_month} {usage.usage_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(usage.reading_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {usage.previous_reading} m³
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {usage.current_reading} m³
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {usage.usage_amount} m³
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerUsage;
