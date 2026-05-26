import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentProofDetailModal from './PaymentProofDetailModal';
import type { PaymentProof } from '../../services/paymentProofService';

const mockVerifyPaymentProof = vi.fn();
const mockRejectPaymentProof = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('../../services/paymentProofService', () => ({
  __esModule: true,
  default: {
    verifyPaymentProof: (...args: unknown[]) => mockVerifyPaymentProof(...args),
    rejectPaymentProof: (...args: unknown[]) => mockRejectPaymentProof(...args),
  },
}));

vi.mock('../../components', () => ({
  useToast: () => ({
    success: mockToastSuccess,
  }),
}));

const baseProof: PaymentProof = {
  id: 'proof-1',
  invoice_id: 'invoice-1',
  invoice_number: 'INV-001',
  customer_id: 'customer-1',
  customer_name: 'Budi Santoso',
  tenant_id: 'tenant-1',
  amount: 150000,
  payment_date: '2026-05-01T00:00:00Z',
  payment_method: 'bank_transfer',
  account_name: 'Budi Santoso',
  account_number: '1234567890',
  reference_number: 'REF-001',
  proof_image_url: 'https://example.com/proof.jpg',
  notes: 'Transfer dari mobile banking',
  snapshot_sub_total: 140000,
  snapshot_penalty_amount: 10000,
  snapshot_total_amount: 150000,
  snapshot_remaining_amount: 150000,
  snapshot_captured_at: '2026-05-01T00:00:00Z',
  status: 'PENDING',
  submitted_at: '2026-05-01T00:00:00Z',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

describe('PaymentProofDetailModal', () => {
  beforeEach(() => {
    mockVerifyPaymentProof.mockReset();
    mockRejectPaymentProof.mockReset();
    mockToastSuccess.mockReset();
  });

  it('verifies a pending payment proof with optional notes', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    mockVerifyPaymentProof.mockResolvedValue(baseProof);

    render(<PaymentProofDetailModal proof={baseProof} onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /verifikasi pembayaran/i }));
    fireEvent.change(screen.getByPlaceholderText(/tambahkan catatan verifikasi/i), {
      target: { value: 'Nominal sesuai mutasi bank' },
    });
    fireEvent.click(screen.getByRole('button', { name: /konfirmasi verifikasi/i }));

    await waitFor(() => {
      expect(mockVerifyPaymentProof).toHaveBeenCalledWith('proof-1', {
        notes: 'Nominal sesuai mutasi bank',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('Pembayaran berhasil diverifikasi!');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('requires rejection reason before rejecting and submits once filled', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    mockRejectPaymentProof.mockResolvedValue(baseProof);

    render(<PaymentProofDetailModal proof={baseProof} onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /tolak pembayaran/i }));

    const confirmButton = screen.getByRole('button', { name: /konfirmasi penolakan/i });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/jelaskan alasan pembayaran ini ditolak/i), {
      target: { value: 'Bukti transfer tidak sesuai nominal tagihan' },
    });

    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRejectPaymentProof).toHaveBeenCalledWith('proof-1', {
        rejection_reason: 'Bukti transfer tidak sesuai nominal tagihan',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('Pembayaran berhasil ditolak');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
