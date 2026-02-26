import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentProofList from './PaymentProofList';
import PaymentProofDetailModal from './PaymentProofDetailModal';
import type { PaymentProof } from '../../services/paymentProofService';
import { PageHeader } from '../../components';

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
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Proof Management"
        subtitle="Review and verify customer payment submissions"
        actions={
          <button
            onClick={() => navigate('/admin/payment-proofs/submit')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Submit Payment Proof
          </button>
        }
      />

      {/* Payment Proof List */}
      <PaymentProofList 
        key={refreshKey} 
        onViewDetails={handleViewDetails} 
      />

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
