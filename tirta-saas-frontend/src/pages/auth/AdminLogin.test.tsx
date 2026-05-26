import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLogin from './AdminLogin';

const mockUseAppDispatch = vi.fn();
const mockUseAppSelector = vi.fn();
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('../../hooks/redux', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
  useAppSelector: (selector: (state: unknown) => unknown) => mockUseAppSelector(selector),
}));

vi.mock('../../store/slices/authSlice', () => ({
  loginAsync: (credentials: unknown) => ({ type: 'auth/login', payload: credentials }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin', () => {
  beforeEach(() => {
    mockUseAppDispatch.mockReset();
    mockUseAppSelector.mockReset();
    mockNavigate.mockReset();
    mockDispatch.mockReset();

    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockReturnValue({
      isLoading: false,
      error: null,
    });
  });

  it('redirects tenant users without tenant_id to setup tenant flow', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          user: {
            role: 'tenant_admin',
            tenant_id: null,
          },
        }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Masukkan email Anda'), {
      target: { value: 'admin@contoh.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Masukkan kata sandi Anda'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/setup-tenant');
    });
  });

  it('keeps platform owner without tenant_id on admin dashboard', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          user: {
            role: 'platform_owner',
            tenant_id: null,
          },
        }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Masukkan email Anda'), {
      target: { value: 'owner@contoh.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Masukkan kata sandi Anda'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows trial expired modal when tenant status is expired', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          user: {
            role: 'tenant_admin',
            tenant_id: 'tenant-123',
            tenant_status: 'EXPIRED',
          },
        }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Masukkan email Anda'), {
      target: { value: 'admin@contoh.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Masukkan kata sandi Anda'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByText('Masa Trial Anda Telah Habis')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/admin');
  });
});
