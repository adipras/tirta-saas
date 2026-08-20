import { useCallback, useEffect, useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import { DashboardStatCard } from '../../components';
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

  const fetchPaymentProofs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await paymentProofService.getPaymentProofs({
        status: statusFilter || undefined,
        per_page: 100,
      });
      setPaymentProofs(response.payment_proofs);

      const pending = response.payment_proofs.filter((p) => p.status === 'PENDING').length;
      const verified = response.payment_proofs.filter((p) => p.status === 'VERIFIED').length;
      const rejected = response.payment_proofs.filter((p) => p.status === 'REJECTED').length;
      setStats({ pending, verified, rejected });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchPaymentProofs();
  }, [fetchPaymentProofs]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-warning-50 text-warning-700 ring-warning-200/60',
      VERIFIED: 'bg-success-50 text-success-700 ring-success-200/60',
      REJECTED: 'bg-danger-50 text-danger-700 ring-danger-200/60',
    };
    return badges[status] || 'bg-surface-50 text-surface-500 ring-surface-200/60';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'VERIFIED':
        return 'Terverifikasi';
      case 'REJECTED':
        return 'Ditolak';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Transfer bank';
      case 'e_wallet':
        return 'E-wallet';
      case 'cash':
        return 'Tunai';
      default:
        return method.replace('_', ' ');
    }
  };

  const filteredProofs = paymentProofs.filter(
    (proof) =>
      searchInvoice === '' ||
      proof.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase())
  );

  const columns: Column<PaymentProof>[] = [
    {
      key: 'invoice_number',
      label: 'Tagihan',
      sortable: true,
      render: (_value, proof) => (
        <span className="font-medium text-surface-800">{proof.invoice_number}</span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Pelanggan',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      render: (_value, proof) => (
        <span className="font-semibold text-brand-600">
          Rp {proof.amount.toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'payment_date',
      label: 'Tanggal Pembayaran',
      sortable: true,
      render: (_value, proof) => (
        <span className="text-surface-400">
          {new Date(proof.payment_date).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: 'Metode',
      render: (_value, proof) => (
        <span className="text-surface-600">{getPaymentMethodLabel(proof.payment_method)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value, proof) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${getStatusBadge(proof.status)}`}
        >
          {getStatusLabel(proof.status)}
        </span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Dikirim',
      sortable: true,
      render: (_value, proof) => (
        <span className="text-surface-400">
          {new Date(proof.submitted_at).toLocaleDateString('id-ID')}
        </span>
      ),
    },
  ];

  const actions = (proof: PaymentProof) => (
    <button
      onClick={() => onViewDetails(proof)}
      className="inline-flex items-center justify-center rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50"
      title="Lihat detail"
      aria-label="Lihat detail"
    >
      <EyeIcon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Menunggu Verifikasi"
          value={loading ? '...' : stats.pending.toLocaleString('id-ID')}
          subtitle="Perlu ditinjau"
          icon={EyeIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terverifikasi"
          value={loading ? '...' : stats.verified.toLocaleString('id-ID')}
          subtitle="Sah diterima"
          icon={EyeIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Ditolak"
          value={loading ? '...' : stats.rejected.toLocaleString('id-ID')}
          subtitle="Perlu follow-up"
          icon={EyeIcon}
          tone="red"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label-base">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base mt-1.5"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
          <div>
            <label className="label-base">Cari berdasarkan tagihan</label>
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="Masukkan nomor tagihan..."
              className="input-base mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          data={filteredProofs}
          columns={columns}
          actions={actions}
          searchable={false}
          loading={loading}
          emptyMessage="Belum ada bukti pembayaran"
        />
      </div>
    </div>
  );
}

export default PaymentProofList;
