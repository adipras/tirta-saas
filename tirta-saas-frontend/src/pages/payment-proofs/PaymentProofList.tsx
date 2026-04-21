import { useState, useEffect } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import paymentProofService from '../../services/paymentProofService';
import type { PaymentProof } from '../../services/paymentProofService';

interface PaymentProofListProps {
  onViewDetails: (proof: PaymentProof) => void;
}

function PaymentProofList({ onViewDetails }: PaymentProofListProps) {
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

  const columns: Column<PaymentProof>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice',
      sortable: true,
    },
    {
      key: 'customer_name',
      label: 'Customer',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (_value, proof) => `Rp ${proof.amount.toLocaleString('id-ID')}`,
    },
    {
      key: 'payment_date',
      label: 'Payment Date',
      sortable: true,
      render: (_value, proof) => new Date(proof.payment_date).toLocaleDateString('id-ID'),
    },
    {
      key: 'payment_method',
      label: 'Method',
      render: (_value, proof) => proof.payment_method.replace('_', ' '),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value, proof) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(proof.status)}`}>
          {proof.status}
        </span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      sortable: true,
      render: (_value, proof) => new Date(proof.submitted_at).toLocaleDateString('id-ID'),
    },
  ];

  const actions = (proof: PaymentProof) => (
    <button
      onClick={() => onViewDetails(proof)}
      className="inline-flex items-center justify-center rounded-md p-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-900"
      title="Lihat detail"
      aria-label="Lihat detail"
    >
      <EyeIcon className="h-5 w-5" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <DataTable
          data={filteredProofs}
          columns={columns}
          actions={actions}
          searchable={false}
          loading={loading}
          emptyMessage="No payment proofs found"
        />
      </div>
    </div>
  );
}

export default PaymentProofList;
