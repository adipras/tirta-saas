import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BulkInvoiceGeneration from './BulkInvoiceGeneration';

const mockApiPost = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../../services/apiClient', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

vi.mock('../../../constants/api', () => ({
  API_ENDPOINTS: {
    INVOICES: {
      GENERATE_BULK: '/invoices/bulk-generate',
      PREVIEW_GENERATION: '/invoices/preview-generation',
    },
  },
}));

vi.mock('../../../components', () => ({
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

type PreviewInvoice = {
  invoice_number: string;
  customer_name: string;
  customer_code: string;
  usage_m3: number;
  water_charge: number;
  abonemen: number;
  maintenance_fee: number;
  penalty_amount: number;
  sub_total: number;
  total_amount: number;
};

type GenerationResult = {
  status: string;
  message: string;
  success: number;
  skipped: number;
  failed: number;
  total_amount: number;
  invoices: PreviewInvoice[];
  errors: string[];
  preview_only: boolean;
};

const makePreviewResult = (overrides?: Partial<GenerationResult>): GenerationResult => ({
  status: 'success',
  message: 'Tagihan berhasil dibuat',
  success: 3,
  skipped: 1,
  failed: 0,
  total_amount: 450000,
  invoices: [
    {
      invoice_number: 'INV-202607-0001',
      customer_name: 'Budi Santoso',
      customer_code: 'CUST-001',
      usage_m3: 15.5,
      water_charge: 100000,
      abonemen: 25000,
      maintenance_fee: 25000,
      penalty_amount: 0,
      sub_total: 150000,
      total_amount: 150000,
    },
    {
      invoice_number: 'INV-202607-0002',
      customer_name: 'Siti Rahayu',
      customer_code: 'CUST-002',
      usage_m3: 12.0,
      water_charge: 80000,
      abonemen: 20000,
      maintenance_fee: 20000,
      penalty_amount: 0,
      sub_total: 120000,
      total_amount: 120000,
    },
    {
      invoice_number: 'INV-202607-0003',
      customer_name: 'Agus Setiawan',
      customer_code: 'CUST-003',
      usage_m3: 20.0,
      water_charge: 120000,
      abonemen: 30000,
      maintenance_fee: 30000,
      penalty_amount: 0,
      sub_total: 180000,
      total_amount: 180000,
    },
  ],
  errors: [],
  preview_only: true,
  ...overrides,
});

describe('BulkInvoiceGeneration', () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockShowErrorToast.mockReset();
    mockShowSuccessToast.mockReset();
  });

  it('menampilkan form bulan tagihan dan tombol preview', () => {
    render(<BulkInvoiceGeneration />);

    expect(screen.getByText('Buat Tagihan Massal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
  });

  it('menampilkan hasil preview setelah klik tombol Preview', async () => {
    mockApiPost.mockResolvedValueOnce(makePreviewResult());

    render(<BulkInvoiceGeneration />);

    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/invoices/preview-generation',
        expect.objectContaining({
          customer_ids: [],
        })
      );
    });

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Siti Rahayu')).toBeInTheDocument();
  });

  it('menampilkan toast error jika preview gagal', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('network error'));

    render(<BulkInvoiceGeneration />);

    fireEvent.click(screen.getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith(expect.stringContaining('Gagal preview'));
    });
  });

  it('menampilkan hasil generate dan toast sukses setelah konfirmasi', async () => {
    mockApiPost
      .mockResolvedValueOnce(makePreviewResult()) // preview
      .mockResolvedValueOnce(makePreviewResult({ preview_only: false })); // generate

    render(<BulkInvoiceGeneration />);

    // Step 1: preview
    fireEvent.click(screen.getByRole('button', { name: /preview/i }));
    await screen.findByText('Budi Santoso');

    // Step 2: click generate button to open confirm modal
    const generateBtn = screen.getByRole('button', { name: /buat 3 tagihan/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Step 3: confirm
    const dialog = screen.getByRole('dialog');
    const confirmBtn = dialog.querySelector('button:last-child') as HTMLElement;
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockShowSuccessToast).toHaveBeenCalledWith(expect.stringContaining('tagihan dibuat'));
    });
  });
});
