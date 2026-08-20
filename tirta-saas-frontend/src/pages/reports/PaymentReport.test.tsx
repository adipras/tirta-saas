import type { ChangeEvent, ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentReport from './PaymentReport';
import type { PaymentReport as PaymentReportType } from '../../types/report';

const mockGetPaymentReport = vi.fn();
const mockExportToCSV = vi.fn();
const mockExportToExcel = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();

vi.mock('../../services/reportService', () => ({
  reportService: {
    getPaymentReport: (...args: unknown[]) => mockGetPaymentReport(...args),
  },
}));

vi.mock('../../utils/exportUtils', () => ({
  exportToCSV: (...args: unknown[]) => mockExportToCSV(...args),
  exportToExcel: (...args: unknown[]) => mockExportToExcel(...args),
  formatIDR: (value: number) => `Rp ${value.toLocaleString('id-ID')}`,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('startDate=2026-05-01&endDate=2026-05-31')],
  };
});

vi.mock('../../components', () => ({
  DashboardStatCard: ({ title, value }: { title: string; value: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
    </div>
  ),
  DataTable: ({
    data,
    emptyMessage,
  }: {
    data: Array<Record<string, unknown>>;
    emptyMessage?: string;
  }) =>
    data.length ? (
      <div>
        {data.map((row, index) => (
          <div key={index}>{Object.values(row).join(' | ')}</div>
        ))}
      </div>
    ) : (
      <div>{emptyMessage}</div>
    ),
  FormInput: ({
    label,
    value,
    onChange,
    type,
  }: {
    label: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
  }) => (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} />
    </label>
  ),
  PageHeader: ({
    title,
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
  useToast: () => ({
    error: mockShowErrorToast,
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

const reportData: PaymentReportType = {
  totalCollected: 300000,
  totalOutstanding: 120000,
  paymentMethodBreakdown: [
    { method: 'Tunai', amount: 180000, count: 2, percentage: 60 },
    { method: 'Transfer Bank', amount: 120000, count: 1, percentage: 40 },
  ],
  dailyCollection: [
    { date: '2026-05-01', amount: 150000, count: 1 },
    { date: '2026-05-02', amount: 150000, count: 2 },
  ],
  outstandingPembayaran: [
    {
      customerId: 1,
      customerName: 'Budi Santoso',
      invoiceNumber: 'INV-009',
      amount: 120000,
      dueDate: '2026-05-10',
      daysOverdue: 5,
    },
  ],
};

describe('PaymentReport', () => {
  beforeEach(() => {
    mockGetPaymentReport.mockReset();
    mockExportToCSV.mockReset();
    mockExportToExcel.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();

    mockGetPaymentReport.mockResolvedValue(reportData);
  });

  it('loads report data and refetches when the period filter changes', async () => {
    render(<PaymentReport />);

    expect(await screen.findByText('Rp 300.000')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('Budi Santoso') && content.includes('INV-009'))
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tanggal mulai'), {
      target: { value: '2026-05-05' },
    });

    await waitFor(() => {
      expect(mockGetPaymentReport).toHaveBeenLastCalledWith({
        startDate: '2026-05-05',
        endDate: '2026-05-31',
      });
    });
  });

  it('exports payment report to csv and excel with the active period', async () => {
    render(<PaymentReport />);

    expect(await screen.findByText('Rp 300.000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /csv/i }));
    expect(mockExportToCSV).toHaveBeenCalledWith(
      [
        {
          Tanggal: '2026-05-01',
          'Jumlah (IDR)': 150000,
          Jumlah: 'Rp 150.000',
          Transaksi: 1,
        },
        {
          Tanggal: '2026-05-02',
          'Jumlah (IDR)': 150000,
          Jumlah: 'Rp 150.000',
          Transaksi: 2,
        },
      ],
      'laporan_pembayaran_2026-05-01_2026-05-31_daily.csv'
    );

    fireEvent.click(screen.getByRole('button', { name: /excel/i }));
    expect(mockExportToExcel).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ sheetName: 'Penerimaan Harian' }),
        expect.objectContaining({ sheetName: 'Per Metode Pembayaran' }),
        expect.objectContaining({ sheetName: 'Tunggakan' }),
      ]),
      'laporan_pembayaran_2026-05-01_2026-05-31.xlsx'
    );
  });
});
