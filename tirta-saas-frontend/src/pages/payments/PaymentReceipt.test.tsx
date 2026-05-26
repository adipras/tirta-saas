import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentReceipt from './PaymentReceipt';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';

const mockGetReceipt = vi.fn();
const mockGenerateReceipt = vi.fn();
const mockPrintReceipt = vi.fn();
const mockPrintPage = vi.fn();
const mockIsAvailable = vi.fn();
const mockGetPreferredPrinter = vi.fn();
const mockGetStatus = vi.fn();
const mockScanPrinters = vi.fn();
const mockConnectPrinter = vi.fn();
const mockSavePreferredPrinter = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();
const mockPrintHandler = vi.fn();

vi.mock('../../services/paymentService', () => ({
  paymentService: {
    getReceipt: (...args: unknown[]) => mockGetReceipt(...args),
    generateReceipt: (...args: unknown[]) => mockGenerateReceipt(...args),
  },
}));

vi.mock('../../services/thermalPrinterService', () => ({
  thermalPrinterService: {
    printReceipt: (...args: unknown[]) => mockPrintReceipt(...args),
    printPage: (...args: unknown[]) => mockPrintPage(...args),
    isAvailable: (...args: unknown[]) => mockIsAvailable(...args),
    getPreferredPrinter: (...args: unknown[]) => mockGetPreferredPrinter(...args),
    getStatus: (...args: unknown[]) => mockGetStatus(...args),
    scanPrinters: (...args: unknown[]) => mockScanPrinters(...args),
    connectPrinter: (...args: unknown[]) => mockConnectPrinter(...args),
    savePreferredPrinter: (...args: unknown[]) => mockSavePreferredPrinter(...args),
  },
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => mockPrintHandler,
}));

vi.mock('../../components', () => ({
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
    error: mockToastError,
    info: mockToastInfo,
    success: mockToastSuccess,
    warning: mockToastWarning,
  }),
}));

const receipt: PaymentReceiptType = {
  id: 'receipt-1',
  paymentId: 'payment-1',
  receiptNumber: 'RCT-001',
  tenantInfo: {
    companyName: 'PDAM Tirta Uji',
    phone: '021123456',
    footerText: 'Terima kasih atas pembayaran Anda.',
  },
  usageDetails: {
    usageMonth: '2026-05',
    usageM3: 12,
  },
  payment: {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    customerId: 'customer-1',
    customerName: 'Budi Santoso',
    invoiceNumber: 'INV-001',
    amount: 150000,
    paymentMethod: 'cash',
    paymentDate: '2026-05-10T10:00:00Z',
    referenceNumber: 'REF-001',
    notes: 'Pembayaran loket',
    status: 'completed',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-10T10:00:00Z',
  },
  invoiceDetails: {
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-05-01T00:00:00Z',
    dueDate: '2026-05-20T00:00:00Z',
    invoiceType: 'monthly',
    totalAmount: 150000,
    subTotal: 145000,
    penaltyAmount: 5000,
    totalPaidBefore: 0,
    totalPaidAfter: 150000,
    remainingAmount: 0,
    paymentCoverageType: 'full',
    invoicePaymentStatus: 'paid',
  },
  customerDetails: {
    name: 'Budi Santoso',
    address: 'Jl. Melati No. 10',
    meterNumber: 'MTR-001',
  },
  generatedAt: '2026-05-10T10:05:00Z',
};

describe('PaymentReceipt', () => {
  beforeEach(() => {
    mockGetReceipt.mockReset();
    mockGenerateReceipt.mockReset();
    mockPrintReceipt.mockReset();
    mockPrintPage.mockReset();
    mockIsAvailable.mockReset();
    mockGetPreferredPrinter.mockReset();
    mockGetStatus.mockReset();
    mockScanPrinters.mockReset();
    mockConnectPrinter.mockReset();
    mockSavePreferredPrinter.mockReset();
    mockToastError.mockReset();
    mockToastInfo.mockReset();
    mockToastSuccess.mockReset();
    mockToastWarning.mockReset();
    mockPrintHandler.mockReset();

    mockGetReceipt.mockResolvedValue(receipt);
    mockGenerateReceipt.mockResolvedValue(receipt);
    mockIsAvailable.mockResolvedValue(false);
    mockGetPreferredPrinter.mockReturnValue(null);
    mockGetStatus.mockResolvedValue({
      connected: false,
      bridgeAvailable: false,
      bridgeRunning: false,
      message: 'Belum terhubung',
    });
    mockScanPrinters.mockResolvedValue([]);
    mockConnectPrinter.mockResolvedValue(undefined);
  });

  it('loads and renders payment receipt details', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Struk Pembayaran')).toBeInTheDocument();
    expect(screen.getByText('No. Struk RCT-001')).toBeInTheDocument();
    expect(screen.getByText('PDAM Tirta Uji')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Biaya Air Bulanan')).toBeInTheDocument();
    expect(screen.getByText('Lunas')).toBeInTheDocument();
  });

  it('falls back to browser printing when thermal bridge is unavailable', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Struk Pembayaran')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cetak Struk' }));

    await waitFor(() => {
      expect(mockPrintReceipt).not.toHaveBeenCalled();
      expect(mockToastInfo).toHaveBeenCalledWith(
        'Bridge printer thermal tidak aktif. Menggunakan cetak browser sebagai fallback.'
      );
      expect(mockPrintHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('prints through thermal bridge when bridge mode is available', async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockGetStatus.mockResolvedValue({
      connected: true,
      printerName: 'Printer Kasir',
      bridgeAvailable: true,
      bridgeRunning: true,
      message: 'Terhubung',
    });

    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Cetak Thermal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cetak Thermal' }));

    await waitFor(() => {
      expect(mockPrintReceipt).toHaveBeenCalledWith(receipt);
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Perintah cetak ke printer thermal berhasil dikirim'
      );
      expect(mockPrintHandler).not.toHaveBeenCalled();
    });
  });

  it('falls back to browser print when thermal printing fails', async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockGetStatus.mockResolvedValue({
      connected: true,
      printerName: 'Printer Kasir',
      bridgeAvailable: true,
      bridgeRunning: true,
      message: 'Terhubung',
    });
    mockPrintReceipt.mockRejectedValue(new Error('printer down'));

    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Cetak Thermal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cetak Thermal' }));

    await waitFor(() => {
      expect(mockPrintReceipt).toHaveBeenCalledWith(receipt);
      expect(mockToastError).toHaveBeenCalledWith(
        'Gagal mencetak ke printer thermal, gunakan cetak browser sebagai fallback'
      );
      expect(mockToastInfo).toHaveBeenCalledWith(
        'Bridge printer thermal tidak aktif. Menggunakan cetak browser sebagai fallback.'
      );
      expect(mockPrintHandler).toHaveBeenCalledTimes(1);
    });
  });

  it('scans and connects to thermal printers when bridge is available', async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockGetStatus
      .mockResolvedValueOnce({
        connected: false,
        bridgeAvailable: true,
        bridgeRunning: true,
        message: 'Belum terhubung',
      })
      .mockResolvedValueOnce({
        connected: true,
        printerName: 'Printer Kasir',
        bridgeAvailable: true,
        bridgeRunning: true,
        message: 'Terhubung',
      });
    mockScanPrinters.mockResolvedValue([
      {
        id: 'printer-1',
        name: 'Printer Kasir',
        address: '00:11:22:33',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Cari Printer' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cari Printer' }));

    await waitFor(() => {
      expect(mockScanPrinters).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledWith('1 printer thermal ditemukan');
      expect(screen.getByText('Printer Kasir')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hubungkan' }));

    await waitFor(() => {
      expect(mockConnectPrinter).toHaveBeenCalledWith('printer-1');
      expect(mockSavePreferredPrinter).toHaveBeenCalledWith({
        id: 'printer-1',
        name: 'Printer Kasir',
        address: '00:11:22:33',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('Printer Printer Kasir berhasil dihubungkan');
    });
  });

  it('shows warning instead of scanning printers when bridge is unavailable', async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockGetStatus.mockResolvedValue({
      connected: false,
      bridgeAvailable: true,
      bridgeRunning: true,
      message: 'Belum terhubung',
    });

    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Cari Printer' })).toBeInTheDocument();

    mockIsAvailable.mockResolvedValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cari Printer' }));

    await waitFor(() => {
      expect(mockScanPrinters).not.toHaveBeenCalled();
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Bridge printer thermal belum aktif. Buka aplikasi Bridge Printer Thermal lalu coba lagi.'
      );
    });
  });

  it('shows warning instead of connecting printer when bridge is unavailable', async () => {
    mockIsAvailable.mockResolvedValue(true);
    mockGetStatus.mockResolvedValue({
      connected: false,
      bridgeAvailable: true,
      bridgeRunning: true,
      message: 'Belum terhubung',
    });
    mockScanPrinters.mockResolvedValue([
      {
        id: 'printer-1',
        name: 'Printer Kasir',
        address: '00:11:22:33',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin/payments/payment-1/receipt']}>
        <Routes>
          <Route path="/admin/payments/:id/receipt" element={<PaymentReceipt />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Cari Printer' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cari Printer' }));

    await waitFor(() => {
      expect(screen.getByText('Printer Kasir')).toBeInTheDocument();
    });

    mockIsAvailable.mockResolvedValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Hubungkan' }));

    await waitFor(() => {
      expect(mockConnectPrinter).not.toHaveBeenCalled();
      expect(mockToastWarning).toHaveBeenCalledWith(
        'Bridge printer thermal belum aktif. Koneksi printer tidak dapat dilakukan.'
      );
    });
  });
});
