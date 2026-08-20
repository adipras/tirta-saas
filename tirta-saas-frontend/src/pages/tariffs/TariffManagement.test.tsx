import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TariffManagement from './TariffManagement';

const mockGetTariffCategories = vi.fn();
const mockGetProgressiveRates = vi.fn();
const mockSimulateBill = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('../../services/tariffService', () => ({
  tariffService: {
    getTariffCategories: (...args: unknown[]) => mockGetTariffCategories(...args),
    getProgressiveRates: (...args: unknown[]) => mockGetProgressiveRates(...args),
    simulateBill: (...args: unknown[]) => mockSimulateBill(...args),
    createTariffCategory: vi.fn(),
    updateTariffCategory: vi.fn(),
    deleteTariffCategory: vi.fn(),
    createProgressiveRate: vi.fn(),
    updateProgressiveRate: vi.fn(),
    deleteProgressiveRate: vi.fn(),
  },
  default: {
    getTariffCategories: (...args: unknown[]) => mockGetTariffCategories(...args),
    getProgressiveRates: (...args: unknown[]) => mockGetProgressiveRates(...args),
    simulateBill: (...args: unknown[]) => mockSimulateBill(...args),
    createTariffCategory: vi.fn(),
    updateTariffCategory: vi.fn(),
    deleteTariffCategory: vi.fn(),
    createProgressiveRate: vi.fn(),
    updateProgressiveRate: vi.fn(),
    deleteProgressiveRate: vi.fn(),
  },
}));

vi.mock('../../components', () => ({
  ActionIconButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  ConfirmModal: () => null,
  DashboardStatCard: ({ title, value }: { title: string; value: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
    </div>
  ),
  DataTable: ({ data, emptyMessage }: { data: Array<Record<string, unknown>>; emptyMessage?: string }) =>
    data.length ? (
      <div>
        {data.map((row, index) => (
          <div key={index}>{Object.values(row).join(' | ')}</div>
        ))}
      </div>
    ) : (
      <div>{emptyMessage}</div>
    ),
  FormCheckbox: ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (event: { target: { checked: boolean } }) => void;
  }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange({ target: { checked: event.target.checked } })}
      />
      {label}
    </label>
  ),
  FormInput: ({
    label,
    value,
    onChange,
    ...props
  }: {
    label?: string;
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    [key: string]: unknown;
  }) => {
    const { fullWidth, helperText, ...inputProps } = props;
    void fullWidth;
    void helperText;

    return (
      <label>
        <span>{label}</span>
        <input
          value={value}
          onChange={(event) => onChange?.({ target: { value: event.target.value } })}
          {...inputProps}
        />
      </label>
    );
  },
  FormSelect: ({
    label,
    value,
    onChange,
    options,
  }: {
    label?: string;
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    options: Array<{ value: string | number; label: string }>;
  }) => (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange?.({ target: { value: event.target.value } })}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
  FormTextarea: ({
    label,
    value,
    onChange,
  }: {
    label?: string;
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
  }) => (
    <label>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange?.({ target: { value: event.target.value } })} />
    </label>
  ),
  PageHeader: ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
  useToast: () => mockToast,
}));

describe('TariffManagement', () => {
  beforeEach(() => {
    mockGetTariffCategories.mockReset();
    mockGetProgressiveRates.mockReset();
    mockSimulateBill.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();

    mockGetTariffCategories.mockResolvedValue([
      {
        id: 'cat-1',
        code: 'RT-A',
        name: 'Rumah Tangga A',
        type: 'residential',
        description: 'Kategori rumah tangga',
        display_order: 1,
        is_active: true,
      },
    ]);

    mockGetProgressiveRates.mockResolvedValue([
      {
        id: 'rate-1',
        category: {
          id: 'cat-1',
          code: 'RT-A',
          name: 'Rumah Tangga A',
          type: 'residential',
          description: 'Kategori rumah tangga',
          display_order: 1,
          is_active: true,
        },
        min_volume: 0,
        max_volume: 10,
        price_per_unit: 2500,
        display_order: 1,
        is_active: true,
      },
    ]);

    mockSimulateBill.mockResolvedValue({
      category: {
        id: 'cat-1',
        code: 'RT-A',
        name: 'Rumah Tangga A',
        type: 'residential',
        description: 'Kategori rumah tangga',
        display_order: 1,
        is_active: true,
      },
      usage_volume: 20,
      total_amount: 50000,
      breakdown: [
        {
          tier_range: '0 - 10 m³',
          volume: 10,
          price_per_unit: 2500,
          amount: 25000,
        },
      ],
    });
  });

  it('loads tariff categories and progressive rates', async () => {
    render(<TariffManagement />);

    expect(await screen.findByText('Tarif Progresif')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetTariffCategories).toHaveBeenCalledTimes(1);
      expect(mockGetProgressiveRates).toHaveBeenCalledWith('cat-1');
    });
    expect(screen.getByText(/Kategori aktif: Rumah Tangga A/)).toBeInTheDocument();
  });

  it('runs bill simulation for the selected category', async () => {
    render(<TariffManagement />);

    expect(await screen.findByText('Tarif Progresif')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Volume pemakaian (m³)'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hitung Simulasi' }));

    await waitFor(() => {
      expect(mockSimulateBill).toHaveBeenCalledWith({
        category_id: 'cat-1',
        usage_volume: 20,
      });
    });

    expect(screen.getByText(/Rp\s?50\.000/)).toBeInTheDocument();
  });
});
