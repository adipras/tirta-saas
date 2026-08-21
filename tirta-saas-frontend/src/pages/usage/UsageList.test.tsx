import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsageList from './UsageList';
import type { WaterPemakaian } from '../../types/usage';
import type { Customer } from '../../types/customer';

const mockGetWaterPemakaians = vi.fn();
const mockDeleteWaterPemakaian = vi.fn();
const mockGetPelanggan = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../services/usageService', () => ({
  usageService: {
    getWaterPemakaians: (...args: unknown[]) => mockGetWaterPemakaians(...args),
    deleteWaterPemakaian: (...args: unknown[]) => mockDeleteWaterPemakaian(...args),
  },
  default: {
    getWaterPemakaians: (...args: unknown[]) => mockGetWaterPemakaians(...args),
    deleteWaterPemakaian: (...args: unknown[]) => mockDeleteWaterPemakaian(...args),
  },
}));

vi.mock('../../services/customerService', () => ({
  customerService: {
    getPelanggan: (...args: unknown[]) => mockGetPelanggan(...args),
  },
  default: {
    getPelanggan: (...args: unknown[]) => mockGetPelanggan(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock('../../components', () => ({
  ActionIconButton: ({
    label,
    onClick,
  }: {
    label: string;
    onClick: (e: React.MouseEvent) => void;
  }) => (
    <button type="button" onClick={onClick as () => void}>
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
        <button type="button" onClick={onClose}>Tutup</button>
        <button type="button" onClick={onConfirm}>{confirmText ?? 'Konfirmasi'}</button>
      </div>
    ) : null,
  useToast: () => ({
    error: mockShowErrorToast,
    success: mockShowSuccessToast,
  }),
}));

const customerInfo: WaterPemakaian['customer'] = {
  id: 'cust-1',
  name: 'Budi Santoso',
  customerId: 'cust-1',
  meterNumber: 'MTR-001',
};

const usageRecords: WaterPemakaian[] = [
  {
    id: 'usage-1',
    customerId: 'cust-1',
    customer: customerInfo,
    usageMonth: '2026-01',
    meterStart: 100,
    meterEnd: 115,
    usageM3: 15,
    amountCalculated: 37500,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'usage-2',
    customerId: 'cust-1',
    customer: customerInfo,
    usageMonth: '2026-02',
    meterStart: 115,
    meterEnd: 128,
    usageM3: 13,
    amountCalculated: 32500,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
  },
];

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '08111',
    address: 'Jl. Mawar 1',
    subscription_id: 'sub-1',
    subscription: {
      id: 'sub-1',
      name: 'Rumah Tangga',
      registration_fee: 500000,
      monthly_fee: 20000,
      maintenance_fee: 5000,
      late_fee_per_day: 1000,
      max_late_fee: 50000,
      created_at: '2026-01-01T00:00:00Z',
    },
    is_active: true,
    tenant_id: 'tenant-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('UsageList', () => {
  beforeEach(() => {
    mockGetWaterPemakaians.mockReset();
    mockDeleteWaterPemakaian.mockReset();
    mockGetPelanggan.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();

    mockGetWaterPemakaians.mockResolvedValue({
      data: usageRecords,
      total: usageRecords.length,
      totalPages: 1,
      page: 1,
    });
    mockGetPelanggan.mockResolvedValue({
      data: mockCustomers,
      pagination: { total: 1, page: 1, limit: 1000, totalPages: 1, currentPage: 1 },
    });
  });

  it('menampilkan data pemakaian air dikelompokkan per pelanggan', async () => {
    render(<UsageList />);

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    // Customer name should be visible in the grouped header
    expect(screen.getAllByText('Budi Santoso').length).toBeGreaterThan(0);
  });

  it('menampilkan stat card Total Pemakaian', async () => {
    render(<UsageList />);

    await screen.findByText('Budi Santoso');
    expect(screen.getByText('Total pemakaian')).toBeInTheDocument();
  });

  it('membuka confirm modal saat tombol hapus diklik', async () => {
    render(<UsageList />);

    await screen.findByText('Budi Santoso');

    const deleteButtons = screen.getAllByRole('button', { name: /hapus/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('memanggil deleteWaterPemakaian saat konfirmasi hapus', async () => {
    mockDeleteWaterPemakaian.mockResolvedValueOnce(undefined);

    render(<UsageList />);

    await screen.findByText('Budi Santoso');

    const deleteButtons = screen.getAllByRole('button', { name: /hapus/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find the confirm button inside the dialog (not the ActionIconButton "Hapus" labels)
    const dialog = screen.getByRole('dialog');
    const confirmBtn = dialog.querySelector('button:last-child') as HTMLElement;
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteWaterPemakaian).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
