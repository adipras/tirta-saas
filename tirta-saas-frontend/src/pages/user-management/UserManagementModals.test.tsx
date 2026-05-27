import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockGetAvailableRoles = vi.fn();
const mockCreateTenantUser = vi.fn();
const mockUpdateTenantUser = vi.fn();

vi.mock('../../components', () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../services/tenantUserService', () => ({
  tenantUserService: {
    getAvailableRoles: (...args: unknown[]) => mockGetAvailableRoles(...args),
    createTenantUser: (...args: unknown[]) => mockCreateTenantUser(...args),
    updateTenantUser: (...args: unknown[]) => mockUpdateTenantUser(...args),
    generatePassword: vi.fn(() => 'GeneratedPass123!'),
  },
}));

describe('User management username validation', () => {
  beforeEach(() => {
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
    mockGetAvailableRoles.mockReset();
    mockCreateTenantUser.mockReset();
    mockUpdateTenantUser.mockReset();

    mockGetAvailableRoles.mockResolvedValue([
      { value: 'finance', label: 'Finance' },
      { value: 'service', label: 'Service' },
    ]);
  });

  it('shows inline username error in create modal when username already exists', async () => {
    mockCreateTenantUser.mockRejectedValue(new Error('Username already registered'));

    render(<CreateUserModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    await screen.findByRole('option', { name: 'Finance' });

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Operator Tirta' },
    });
    fireEvent.change(screen.getByLabelText(/^username/i), {
      target: { value: 'operator.tirta' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /buat pengguna/i }));

    expect(await screen.findByText('Username already registered')).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith('Username already registered');
  });

  it('shows inline username error in edit modal when username already exists', async () => {
    mockUpdateTenantUser.mockRejectedValue(new Error('Username already registered'));

    render(
      <EditUserModal
        user={{
          id: 'user-1',
          name: 'Operator Lama',
          username: 'operator.lama',
          email: 'operator@test.id',
          role: 'finance',
        }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await screen.findByRole('option', { name: 'Finance' });

    fireEvent.change(screen.getByLabelText(/^username/i), {
      target: { value: 'operator.baru' },
    });
    fireEvent.click(screen.getByRole('button', { name: /perbarui pengguna/i }));

    expect(await screen.findByText('Username already registered')).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledWith('Username already registered');
  });
});
