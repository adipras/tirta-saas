import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerLogin from './CustomerLogin';

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

describe('CustomerLogin', () => {
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

  it('navigates to customer dashboard after successful login', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });

    render(
      <MemoryRouter>
        <CustomerLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Nomor Meter atau Email'), {
      target: { value: 'customer@contoh.com' },
    });
    fireEvent.change(screen.getByLabelText('Kata Sandi'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/customer');
    });
  });

  it('keeps the user on the login page when login fails', async () => {
    mockDispatch.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Login gagal')),
    });

    render(
      <MemoryRouter>
        <CustomerLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Nomor Meter atau Email'), {
      target: { value: 'customer@contoh.com' },
    });
    fireEvent.change(screen.getByLabelText('Kata Sandi'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows auth error from redux state', () => {
    mockUseAppSelector.mockReturnValue({
      isLoading: false,
      error: 'Email atau password salah',
    });

    render(
      <MemoryRouter>
        <CustomerLogin />
      </MemoryRouter>
    );

    expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
  });
});
