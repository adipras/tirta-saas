import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerInvoiceDetail from './CustomerInvoiceDetail';

const mockGetCustomerInvoiceById = vi.fn();
const mockDownloadInvoicePDF = vi.fn();
const mockPrintPage = vi.fn();
const mockShowErrorToast = vi.fn();

vi.mock('../../services/invoiceService', () => ({
  invoiceService: {
    getCustomerInvoiceById: (...args: unknown[]) => mockGetCustomerInvoiceById(...args),
    downloadInvoicePDF: (...args: unknown[]) => mockDownloadInvoicePDF(...args),
  },
}));

vi.mock('../../services/thermalPrinterService', () => ({
  thermalPrinterService: {
    printPage: () => mockPrintPage(),
  },
}));

vi.mock('../../components', () => ({
  CardSkeleton: () => <div>Loading skeleton</div>,
  useToast: () => ({
    error: mockShowErrorToast,
  }),
}));

describe('CustomerInvoiceDetail', () => {
  beforeEach(() => {
    mockGetCustomerInvoiceById.mockReset();
    mockDownloadInvoicePDF.mockReset();
    mockPrintPage.mockReset();
    mockShowErrorToast.mockReset();
  });

  it('shows invalid invoice message when route param is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/customer/invoices']}>
        <Routes>
          <Route path="/customer/invoices" element={<CustomerInvoiceDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('ID tagihan tidak valid.')).toBeInTheDocument();
  });

  it('renders invoice detail actions and triggers download/print', async () => {
    mockGetCustomerInvoiceById.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      status: 'unpaid',
      customer: {
        name: 'Budi',
        customerId: 'CUS-1',
        address: 'Jl. Mawar',
        phone: '08123',
        email: 'budi@example.com',
      },
      customerId: 'CUS-1',
      customerName: 'Budi',
      issueDate: '2026-05-01T00:00:00Z',
      dueDate: '2026-05-20T00:00:00Z',
      billingPeriod: '2026-05',
      usage: 10,
      amount: 20000,
      meterNumber: 'MTR-001',
      meterStart: 100,
      meterEnd: 110,
      pricePerM3: 2000,
      items: [
        {
          description: 'Pemakaian Air',
          quantity: 10,
          unitPrice: 2000,
          amount: 20000,
        },
      ],
      subtotal: 20000,
      totalAmount: 20000,
      amountPaid: 0,
      amountDue: 20000,
      penaltyAmount: 0,
      payments: [],
      notes: 'Catatan invoice',
    });
    mockDownloadInvoicePDF.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/customer/invoices/inv-1']}>
        <Routes>
          <Route path="/customer/invoices/:id" element={<CustomerInvoiceDetail />} />
        </Routes>
      </MemoryRouter>
    );

    const invTexts = await screen.findAllByText('INV-001');
    expect(invTexts.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('link', { name: 'Bayar Sekarang' })).toHaveAttribute('href', '/customer/pay/inv-1');

    fireEvent.click(screen.getByRole('button', { name: 'Unduh PDF' }));
    await waitFor(() => {
      expect(mockDownloadInvoicePDF).toHaveBeenCalledWith('inv-1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cetak' }));
    expect(mockPrintPage).toHaveBeenCalled();
  });
});
