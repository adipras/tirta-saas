import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { RateHistory } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function RateHistory() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [history, setHistory] = useState<RateHistory[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await waterRateService.getRateHistory(
        selectedSubscription || undefined,
        currentPage,
        20
      );
      setHistory(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch rate history',
      }));
      console.error('Error fetching rate history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedSubscription, dispatch]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchSubscriptionTypes();
  }, [fetchSubscriptionTypes]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'subscriptionName',
      label: 'Subscription Type',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Rate per m³',
      render: (row: RateHistory) => formatCurrency(row.amount),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (row: RateHistory) => formatDate(row.effectiveDate),
      sortable: true,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (row: RateHistory) => formatDateTime(row.createdAt),
      sortable: true,
    },
    {
      key: 'active',
      label: 'Status',
      render: (row: RateHistory) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.active ? (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircleIcon className="w-4 h-4 mr-1" />
              Inactive
            </>
          )}
        </span>
      ),
      align: 'center' as const,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/water-rates')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Water Rates
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Rate History</h1>
        <p className="mt-2 text-sm text-gray-700">
          View historical water rate changes over time
        </p>
      </div>

      {/* Filter */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Subscription Type
            </label>
            <select
              value={selectedSubscription}
              onChange={(e) => {
                setSelectedSubscription(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Subscription Types</option>
              {subscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Changes Timeline</h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.slice(0, 5).map((rate, index) => (
              <div key={rate.id} className="flex items-start">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      rate.active ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {rate.active ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {rate.subscriptionName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(rate.effectiveDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(rate.amount)}
                      </p>
                      <p className="text-xs text-gray-500">per m³</p>
                    </div>
                  </div>
                </div>
                {index < 4 && history.length > 1 && (
                  <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No rate history available
          </p>
        )}
      </div>

      {/* Full History Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Complete History</h3>
        </div>
        <DataTable
          columns={columns}
          data={history}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
