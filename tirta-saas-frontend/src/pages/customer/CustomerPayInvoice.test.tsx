import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerPayInvoice from './CustomerPayInvoice';

const mockGetCustomerInvoiceById = vi.fn();
const mockSubmitPaymentProof = vi.fn();
const mockNavigate = vi.fn();
const mockShowErrorToast = vi.fn();
const mockShowWarningToast = vi.fn();
const mockShowSuccessToast = vi.fn();

vi.mock('../../services/invoiceService', () => ({
  invoiceService: {
    getCustomerInvoiceById: (...args: unknown[]) => mockGetCustomerInvoiceById(...args),
  },
}));

vi.mock('../../services/paymentProofService', () => ({
  __esModule: true,
  default: {
    submitPaymentProof: (...args: unknown[]) => mockSubmitPaymentProof(...args),
  },
}));

vi.mock('../../components', () => ({
  useToast: () => ({
    error: mockShowErrorToast,
    warning: mockShowWarningToast,
    success: mockShowSuccessToast,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CustomerPayInvoice', () => {
  beforeEach(() => {
    mockGetCustomerInvoiceById.mockReset();
    mockSubmitPaymentProof.mockReset();
    mockNavigate.mockReset();
    mockShowErrorToast.mockReset();
    mockShowWarningToast.mockReset();
    mockShowSuccessToast.mockReset();
  });

  it('renders invoice context for payment confirmation', async () => {
    mockGetCustomerInvoiceById.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      billingPeriod: '2026-05',
      amountDue: 15000,
      totalAmount: 15000,
      penaltyAmount: 0,
    });

    render(
      <MemoryRouter initialEntries={['/customer/pay/inv-1']}>
        <Routes>
          <Route path="/customer/pay/:invoiceId" element={<CustomerPayInvoice />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('INV-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('Anda boleh kirim pembayaran penuh atau partial'))
    ).toBeInTheDocument();
  });

  it('shows warning when submitting without proof image', async () => {
    mockGetCustomerInvoiceById.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      billingPeriod: '2026-05',
      amountDue: 15000,
      totalAmount: 15000,
      penaltyAmount: 0,
    });

    render(
      <MemoryRouter initialEntries={['/customer/pay/inv-1']}>
        <Routes>
          <Route path="/customer/pay/:invoiceId" element={<CustomerPayInvoice />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('INV-001');

    fireEvent.change(screen.getByLabelText((content) => content.includes('Nama Pengirim')), {
      target: { value: 'Budi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim Bukti Pembayaran' }));

    await waitFor(() => {
      expect(mockShowWarningToast).toHaveBeenCalledWith('Silakan upload bukti pembayaran');
      expect(screen.getByText('Silakan upload bukti pembayaran')).toBeInTheDocument();
    });
  });
});
