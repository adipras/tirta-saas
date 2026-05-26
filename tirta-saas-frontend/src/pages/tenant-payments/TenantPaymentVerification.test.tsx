import type { ChangeEvent, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantPaymentVerification from './TenantPaymentVerification';
import type { PaymentProof } from '../../services/paymentProofService';

const mockGetPaymentProofs = vi.fn();
const mockVerifyPaymentProof = vi.fn();
const mockRejectPaymentProof = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../services/paymentProofService', () => ({
  __esModule: true,
  default: {
    getPaymentProofs: (...args: unknown[]) => mockGetPaymentProofs(...args),
    verifyPaymentProof: (...args: unknown[]) => mockVerifyPaymentProof(...args),
    rejectPaymentProof: (...args: unknown[]) => mockRejectPaymentProof(...args),
  },
}));

vi.mock('../../components', () => ({
  DashboardStatCard: ({ title, value }: { title: string; value: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
    </div>
  ),
  FormTextarea: ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
  }) => (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  ),
  Modal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    children: ReactNode;
  }) => (isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null),
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

const paymentProofs: PaymentProof[] = [
  {
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
  },
  {
    id: 'proof-2',
    invoice_id: 'invoice-2',
    customer_id: 'customer-2',
    invoice_number: 'INV-002',
    customer_name: 'Siti Aminah',
    tenant_id: 'tenant-1',
    amount: 90000,
    payment_date: '2026-05-03T00:00:00Z',
    payment_method: 'cash',
    account_name: 'Siti Aminah',
    account_number: '',
    reference_number: '',
    proof_image_url: 'https://example.com/proof-2.jpg',
    snapshot_sub_total: 90000,
    snapshot_penalty_amount: 0,
    snapshot_total_amount: 90000,
    snapshot_remaining_amount: 90000,
    snapshot_captured_at: '2026-05-03T00:00:00Z',
    status: 'VERIFIED',
    submitted_at: '2026-05-03T00:00:00Z',
    created_at: '2026-05-03T00:00:00Z',
    updated_at: '2026-05-03T00:00:00Z',
  },
];

describe('TenantPaymentVerification', () => {
  beforeEach(() => {
    mockGetPaymentProofs.mockReset();
    mockVerifyPaymentProof.mockReset();
    mockRejectPaymentProof.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();

    mockGetPaymentProofs.mockResolvedValue({
      payment_proofs: paymentProofs,
      total: paymentProofs.length,
      page: 1,
      per_page: 10,
    });
  });

  it('loads payment proofs and filters the table by customer or invoice', async () => {
    render(<TenantPaymentVerification />);

    expect((await screen.findAllByText('INV-001')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Siti Aminah').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText(/cari berdasarkan nama pelanggan atau nomor invoice/i), {
      target: { value: 'siti' },
    });

    expect(screen.queryAllByText('INV-001')).toHaveLength(0);
    expect(screen.getAllByText('INV-002').length).toBeGreaterThan(0);
  });

  it('verifies a pending payment from the modal flow', async () => {
    mockVerifyPaymentProof.mockResolvedValue(paymentProofs[0]);

    render(<TenantPaymentVerification />);

    expect((await screen.findAllByText('INV-001')).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Verifikasi pembayaran' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Verifikasi Pembayaran' });
    fireEvent.change(within(dialog).getByLabelText('Catatan verifikasi'), {
      target: { value: 'Mutasi bank sudah sesuai' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Verifikasi Pembayaran' }));

    await waitFor(() => {
      expect(mockVerifyPaymentProof).toHaveBeenCalledWith('proof-1', {
        notes: 'Mutasi bank sudah sesuai',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('Pembayaran berhasil diverifikasi.');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
