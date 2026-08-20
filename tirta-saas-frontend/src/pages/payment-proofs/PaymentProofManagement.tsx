import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import PaymentProofList from './PaymentProofList';
import PaymentProofDetailModal from './PaymentProofDetailModal';
import type { PaymentProof } from '../../services/paymentProofService';

const PaymentProofManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewDetails = (proof: PaymentProof) => {
    setSelectedProof(proof);
  };

  const handleCloseModal = () => {
    setSelectedProof(null);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Payment Proof Management</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Review and verify customer payment submissions.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/payment-proofs/submit')}
          className="btn-primary self-start"
        >
          <PlusIcon className="h-4 w-4" />
          Submit Payment Proof
        </button>
      </div>

      {/* Payment Proof List */}
      <PaymentProofList key={refreshKey} onViewDetails={handleViewDetails} />

      {/* Detail Modal */}
      {selectedProof && (
        <PaymentProofDetailModal
          proof={selectedProof}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default PaymentProofManagement;
