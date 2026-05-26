import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentList from './PaymentList';
import type { Payment } from '../../types/payment';

const mockGetPembayaran = vi.fn();
const mockVoidPayment = vi.fn();
const mockExportPembayaran = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../services/paymentService', () => ({
  paymentService: {
    getPembayaran: (...args: unknown[]) => mockGetPembayaran(...args),
    voidPayment: (...args: unknown[]) => mockVoidPayment(...args),
    exportPembayaran: (...args: unknown[]) => mockExportPembayaran(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../components', () => ({
  ActionIconButton: ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  ConfirmModal: ({
    isOpen,
    title,
    message,
    confirmText,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button type="button" onClick={onClose}>
          Tutup
        </button>
        <button type="button" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    ) : null,
  DashboardStatCard: ({ title, value }: { title: string; value: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
    </div>
  ),
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  useToast: () => ({
    error: mockShowErrorToast,
    success: mockShowSuccessToast,
  }),
}));

vi.mock('../../components/DataTable', () => ({
  DataTable: ({
    data,
    columns,
    actions,
    loading,
    emptyMessage,
  }: {
    data: Payment[];
    columns: Array<{ key: string; label: string; render?: (value: unknown, item: Payment) => ReactNode }>;
    actions?: (item: Payment) => ReactNode;
    loading?: boolean;
    emptyMessage?: string;
  }) => {
    if (loading) {
      return <div>Memuat tabel pembayaran...</div>;
    }

    if (data.length === 0) {
      return <div>{emptyMessage}</div>;
    }

    return (
      <div>
        {data.map((item) => (
          <article key={item.id}>
            {columns.map((column) => {
              const rawItem = item as unknown as Record<string, unknown>;
              const value = rawItem[column.key];
              const rendered = column.render ? column.render(value, item) : String(value ?? '');

              return <div key={column.key}>{rendered}</div>;
            })}
            {actions ? actions(item) : null}
          </article>
        ))}
      </div>
    );
  },
}));

const payments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    customerId: 'customer-1',
    customerName: 'Budi Santoso',
    invoiceNumber: 'INV-001',
    amount: 150000,
    paymentMethod: 'cash',
    paymentDate: '2026-05-01T00:00:00Z',
    referenceNumber: 'REF-001',
    status: 'completed',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    customerId: 'customer-2',
    customerName: 'Siti Aminah',
    invoiceNumber: 'INV-002',
    amount: 80000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-05-02T00:00:00Z',
    referenceNumber: 'REF-002',
    status: 'pending',
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
  },
];

describe('PaymentList', () => {
  beforeEach(() => {
    mockGetPembayaran.mockReset();
    mockVoidPayment.mockReset();
    mockExportPembayaran.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();

    mockGetPembayaran.mockResolvedValue({
      data: payments,
      pagination: {
        total: payments.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        currentPage: 1,
      },
    });
  });

  it('loads payments and reapplies fetch when status filter changes', async () => {
    render(<PaymentList />);

    expect(await screen.findByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mockGetPembayaran).toHaveBeenLastCalledWith(1, 10, {
        status: 'completed',
        search: undefined,
      });
    });

    expect(screen.getByText('Filter aktif')).toBeInTheDocument();
  });

  it('voids a completed payment from the confirmation flow', async () => {
    mockVoidPayment.mockResolvedValue({ ...payments[0], status: 'voided' });

    render(<PaymentList />);

    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Batalkan pembayaran' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ya, batalkan' }));

    await waitFor(() => {
      expect(mockVoidPayment).toHaveBeenCalledWith('payment-1');
      expect(mockShowSuccessToast).toHaveBeenCalledWith('Pembayaran berhasil dibatalkan');
      expect(mockGetPembayaran).toHaveBeenCalledTimes(2);
    });
  });
});
