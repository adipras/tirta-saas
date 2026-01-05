import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Proof Management</h1>
          <p className="text-gray-600 mt-1">Review and verify customer payment submissions</p>
        </div>
        <button
          onClick={() => navigate('/admin/payment-proofs/submit')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Submit Payment Proof
        </button>
      </div>

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
