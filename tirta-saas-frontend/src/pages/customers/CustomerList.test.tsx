import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerList from './CustomerList';
import type { Customer, SubscriptionType } from '../../types/customer';

const mockGetPelanggan = vi.fn();
const mockGetSubscriptionTypes = vi.fn();
const mockActivateCustomer = vi.fn();
const mockDeactivateCustomer = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../services/customerService', () => ({
  default: {
    getPelanggan: (...args: unknown[]) => mockGetPelanggan(...args),
    getSubscriptionTypes: (...args: unknown[]) => mockGetSubscriptionTypes(...args),
    activateCustomer: (...args: unknown[]) => mockActivateCustomer(...args),
    deactivateCustomer: (...args: unknown[]) => mockDeactivateCustomer(...args),
    exportPelanggan: vi.fn().mockResolvedValue(new Blob()),
  },
  customerService: {
    getPelanggan: (...args: unknown[]) => mockGetPelanggan(...args),
    getSubscriptionTypes: (...args: unknown[]) => mockGetSubscriptionTypes(...args),
    activateCustomer: (...args: unknown[]) => mockActivateCustomer(...args),
    deactivateCustomer: (...args: unknown[]) => mockDeactivateCustomer(...args),
    exportPelanggan: vi.fn().mockResolvedValue(new Blob()),
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
    data: Customer[];
    columns: Array<{ key: string; label: string; render?: (value: unknown, item: Customer) => ReactNode }>;
    actions?: (item: Customer) => ReactNode;
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

const subscription: SubscriptionType = {
  id: 'sub-1',
  name: 'Rumah Tangga',
  registration_fee: 500000,
  monthly_fee: 20000,
  maintenance_fee: 5000,
  late_fee_per_day: 1000,
  max_late_fee: 50000,
  created_at: '2026-01-01T00:00:00Z',
};

const customers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '08111',
    address: 'Jl. Mawar 1',
    subscription_id: 'sub-1',
    subscription,
    is_active: true,
    tenant_id: 'tenant-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cust-2',
    name: 'Siti Rahayu',
    email: 'siti@example.com',
    phone: '08222',
    address: 'Jl. Melati 2',
    subscription_id: 'sub-1',
    subscription,
    is_active: false,
    tenant_id: 'tenant-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('CustomerList', () => {
  beforeEach(() => {
    mockGetPelanggan.mockReset();
    mockGetSubscriptionTypes.mockReset();
    mockActivateCustomer.mockReset();
    mockDeactivateCustomer.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();

    mockGetPelanggan.mockResolvedValue({
      data: customers,
      pagination: { total: 2, page: 1, limit: 1000, totalPages: 1, currentPage: 1 },
    });
    mockGetSubscriptionTypes.mockResolvedValue([subscription]);
  });

  it('menampilkan daftar pelanggan setelah load', async () => {
    render(<CustomerList />);

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Siti Rahayu')).toBeInTheDocument();
  });

  it('menampilkan stat card Total Pelanggan', async () => {
    render(<CustomerList />);

    await screen.findByText('Budi Santoso');
    expect(screen.getByText('Total Pelanggan')).toBeInTheDocument();
  });

  it('filter pencarian menyaring daftar pelanggan di client-side', async () => {
    render(<CustomerList />);

    await screen.findByText('Budi Santoso');

    const searchInput = screen.getByPlaceholderText(/nama, email/i);
    fireEvent.change(searchInput, { target: { value: 'Budi' } });

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    });
    expect(screen.queryByText('Siti Rahayu')).not.toBeInTheDocument();
  });

  it('navigate ke detail saat tombol lihat detail diklik', async () => {
    render(<CustomerList />);

    await screen.findByText('Budi Santoso');

    const detailButtons = screen.getAllByRole('button', { name: /lihat detail pelanggan Budi/i });
    fireEvent.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('cust-1'));
  });
});
