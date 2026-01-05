import React, { useState, useEffect } from 'react';
import paymentProofService from '../../services/paymentProofService';
import type { PaymentProof } from '../../services/paymentProofService';

interface PaymentProofListProps {
  onViewDetails: (proof: PaymentProof) => void;
}

const PaymentProofList: React.FC<PaymentProofListProps> = ({ onViewDetails }) => {
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchPaymentProofs();
  }, [statusFilter]);

  const fetchPaymentProofs = async () => {
    setLoading(true);
    try {
      const response = await paymentProofService.getPaymentProofs({
        status: statusFilter || undefined,
        per_page: 100,
      });
      setPaymentProofs(response.payment_proofs);
      
      // Calculate stats
      const pending = response.payment_proofs.filter(p => p.status === 'PENDING').length;
      const verified = response.payment_proofs.filter(p => p.status === 'VERIFIED').length;
      const rejected = response.payment_proofs.filter(p => p.status === 'REJECTED').length;
      setStats({ pending, verified, rejected });
    } catch (err) {
      console.error('Failed to fetch payment proofs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const filteredProofs = paymentProofs.filter(proof => 
    searchInvoice === '' || proof.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-yellow-600 text-sm font-medium">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 text-sm font-medium">Verified</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{stats.verified}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-red-600 text-sm font-medium">Rejected</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Invoice
            </label>
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="Enter invoice number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Proofs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredProofs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No payment proofs found
                  </td>
                </tr>
              ) : (
                filteredProofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proof.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {proof.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {proof.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proof.payment_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {proof.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(proof.status)}`}>
                        {proof.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proof.submitted_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onViewDetails(proof)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofList;
