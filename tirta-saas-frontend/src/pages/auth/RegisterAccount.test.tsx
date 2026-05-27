import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterAccount from './RegisterAccount';

const mockNavigate = vi.fn();
const mockFetch = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterAccount', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  it('redirects to admin login with username as identifier after successful registration', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok' }),
    });

    render(
      <MemoryRouter>
        <RegisterAccount />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap'), {
      target: { value: 'Admin Tirta' },
    });
    fireEvent.change(screen.getByPlaceholderText('minimal 3 karakter'), {
      target: { value: 'admin.tirta' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minimal 6 karakter'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ulangi password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register-account'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin Tirta',
          username: 'admin.tirta',
          email: '',
          password: 'password123',
        }),
      })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login', {
        state: {
          message: 'Akun berhasil dibuat! Silakan login untuk melanjutkan setup tenant.',
          identifier: 'admin.tirta',
        },
      });
    });
  });

  it('shows inline username error when backend rejects duplicate username', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Username already exists' }),
    });

    render(
      <MemoryRouter>
        <RegisterAccount />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap'), {
      target: { value: 'Admin Tirta' },
    });
    fireEvent.change(screen.getByPlaceholderText('minimal 3 karakter'), {
      target: { value: 'admin.tirta' },
    });
    fireEvent.change(screen.getByPlaceholderText('Minimal 6 karakter'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ulangi password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));

    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
