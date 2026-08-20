import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPaymentHistory from './CustomerPaymentHistory';
import type { Payment } from '../../types/payment';

const mockGetCustomerPembayaran = vi.fn();
const mockShowError = vi.fn();

vi.mock('../../services/paymentService', () => ({
  paymentService: {
    getCustomerPembayaran: (...args: unknown[]) => mockGetCustomerPembayaran(...args),
  },
}));

vi.mock('../../components', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  DashboardStatCard: ({ title, value }: { title: string; value: string | number }) => (
    <div>
      <p>{title}</p>
      <p>{String(value)}</p>
    </div>
  ),
  useToast: () => ({
    error: mockShowError,
  }),
}));

const payments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    customerId: 'customer-1',
    customerName: 'Budi Santoso',
    invoiceNumber: 'INV-001',
    amount: 150000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-05-10T10:00:00Z',
    referenceNumber: 'REF-001',
    status: 'completed',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    customerId: 'customer-1',
    customerName: 'Budi Santoso',
    invoiceNumber: 'INV-002',
    amount: 50000,
    paymentMethod: 'cash',
    paymentDate: '2026-05-11T10:00:00Z',
    referenceNumber: '',
    status: 'pending',
    createdAt: '2026-05-11T10:00:00Z',
    updatedAt: '2026-05-11T10:00:00Z',
  },
];

describe('CustomerPaymentHistory', () => {
  beforeEach(() => {
    mockGetCustomerPembayaran.mockReset();
    mockShowError.mockReset();
  });

  it('renders empty state when there is no payment history', async () => {
    mockGetCustomerPembayaran.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CustomerPaymentHistory />
      </MemoryRouter>
    );

    expect(await screen.findByText('Belum ada riwayat pembayaran')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat Tagihan' })).toHaveAttribute(
      'href',
      '/customer/invoices'
    );
  });

  it('renders payment history rows with status and invoice links', async () => {
    mockGetCustomerPembayaran.mockResolvedValue(payments);

    render(
      <MemoryRouter>
        <CustomerPaymentHistory />
      </MemoryRouter>
    );

    expect(await screen.findByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Transfer Bank')).toBeInTheDocument();
    expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument();
    expect(screen.getByText('2 pembayaran ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'INV-001' })).toHaveAttribute(
      'href',
      '/customer/invoices/invoice-1'
    );
  });

  it('shows toast when payment history cannot be loaded', async () => {
    mockGetCustomerPembayaran.mockRejectedValue(new Error('server down'));

    render(
      <MemoryRouter>
        <CustomerPaymentHistory />
      </MemoryRouter>
    );

    expect(await screen.findByText('Belum ada riwayat pembayaran')).toBeInTheDocument();
    expect(mockShowError).toHaveBeenCalledWith('server down');
  });
});
