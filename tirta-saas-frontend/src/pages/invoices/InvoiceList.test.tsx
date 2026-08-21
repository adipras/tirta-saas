import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InvoiceList from './InvoiceList';
import type { Invoice, InvoiceListStats } from '../../types/invoice';

const mockGetTagihan = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../services/invoiceService', () => ({
  invoiceService: {
    getTagihan: (...args: unknown[]) => mockGetTagihan(...args),
  },
  default: {
    getTagihan: (...args: unknown[]) => mockGetTagihan(...args),
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
  DashboardStatCard: ({ title, value }: { title: string; value: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
    </div>
  ),
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
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
    data: Invoice[];
    columns: Array<{ key: string; label: string; render?: (value: unknown, item: Invoice) => ReactNode }>;
    actions?: (item: Invoice) => ReactNode;
    loading?: boolean;
    emptyMessage?: string;
  }) => {
    if (loading) return <div>Memuat...</div>;
    if (data.length === 0) return <div>{emptyMessage ?? 'Tidak ada data'}</div>;
    return (
      <div>
        {data.map((item) => (
          <article key={item.id}>
            {columns.map((col) => {
              const raw = item as unknown as Record<string, unknown>;
              const rendered = col.render ? col.render(raw[col.key], item) : String(raw[col.key] ?? '');
              return <div key={col.key}>{rendered}</div>;
            })}
            {actions ? actions(item) : null}
          </article>
        ))}
      </div>
    );
  },
}));

const makeStats = (overrides?: Partial<InvoiceListStats>): InvoiceListStats => ({
  totalInvoices: 2,
  paidCount: 1,
  unpaidCount: 1,
  partialCount: 0,
  overdueCount: 0,
  openCount: 1,
  totalAmount: 250000,
  outstandingAmount: 120000,
  ...overrides,
});

const invoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-202601-0001',
    type: 'monthly',
    customerId: 'cust-1',
    customerName: 'Budi Santoso',
    meterNumber: 'MTR-001',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-31',
    billingPeriod: '2026-01',
    usage: 10,
    amount: 130000,
    totalAmount: 130000,
    amountPaid: 130000,
    amountDue: 0,
    status: 'paid',
    issueDate: '2026-01-15',
    dueDate: '2026-01-25',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-202601-0002',
    type: 'monthly',
    customerId: 'cust-2',
    customerName: 'Siti Rahayu',
    meterNumber: 'MTR-002',
    periodStartDate: '2026-01-01',
    periodEndDate: '2026-01-31',
    billingPeriod: '2026-01',
    usage: 8,
    amount: 120000,
    totalAmount: 120000,
    amountPaid: 0,
    amountDue: 120000,
    status: 'unpaid',
    issueDate: '2026-01-15',
    dueDate: '2026-01-25',
    createdAt: '2026-01-15T00:00:00Z',
  },
];

describe('InvoiceList', () => {
  beforeEach(() => {
    mockGetTagihan.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();

    mockGetTagihan.mockResolvedValue({
      data: invoices,
      stats: makeStats(),
      pagination: { total: 2, page: 1, limit: 100, totalPages: 1, currentPage: 1 },
    });
  });

  it('menampilkan daftar tagihan dan stat cards setelah load', async () => {
    render(<InvoiceList />);

    expect(await screen.findByText('INV-202601-0001')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('INV-202601-0002')).toBeInTheDocument();
    expect(screen.getByText('Siti Rahayu')).toBeInTheDocument();
  });

  it('menampilkan stat card Total Tagihan', async () => {
    render(<InvoiceList />);

    await screen.findByText('INV-202601-0001');
    expect(screen.getByText('Total Tagihan')).toBeInTheDocument();
  });

  it('menampilkan filter status dengan pilihan Lunas dan Belum Bayar', async () => {
    render(<InvoiceList />);

    await screen.findByText('INV-202601-0001');

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects.find((s) => {
      const options = Array.from(s.querySelectorAll('option'));
      return options.some((o) => o.textContent?.includes('Lunas'));
    });
    expect(statusSelect).toBeDefined();

    const optionTexts = Array.from(statusSelect!.querySelectorAll('option')).map((o) => o.textContent);
    expect(optionTexts).toEqual(expect.arrayContaining(['Lunas', 'Belum bayar']));
  });

  it('navigate ke detail saat tombol detail diklik', async () => {
    render(<InvoiceList />);

    await screen.findByText('INV-202601-0001');

    const detailButtons = screen.getAllByRole('button', { name: /detail|lihat/i });
    fireEvent.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('inv-1'));
  });

  it('menampilkan empty state saat tidak ada tagihan', async () => {
    mockGetTagihan.mockResolvedValueOnce({
      data: [],
      stats: makeStats({ totalInvoices: 0, paidCount: 0, unpaidCount: 0, openCount: 0, totalAmount: 0, outstandingAmount: 0 }),
      pagination: { total: 0, page: 1, limit: 100, totalPages: 0, currentPage: 1 },
    });

    render(<InvoiceList />);

    await waitFor(() => {
      expect(mockGetTagihan).toHaveBeenCalledTimes(1);
    });

    // DataTable stub menampilkan emptyMessage ketika data kosong
    expect(screen.queryByText('INV-202601-0001')).not.toBeInTheDocument();
  });
});
