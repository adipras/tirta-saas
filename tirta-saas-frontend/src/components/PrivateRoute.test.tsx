import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const mockUseAppSelector = vi.fn();
const mockIsAuthenticated = vi.fn();

vi.mock('../hooks/redux', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => mockUseAppSelector(selector),
}));

vi.mock('../services/authService', () => ({
  authService: {
    isAuthenticated: () => mockIsAuthenticated(),
  },
}));

function renderPrivateRoute(requiredRole?: 'admin' | 'customer') {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <PrivateRoute requiredRole={requiredRole}>
              <div>Protected Content</div>
            </PrivateRoute>
          }
        />
        <Route path="/admin/login" element={<div>Admin Login Page</div>} />
        <Route path="/customer/login" element={<div>Customer Login Page</div>} />
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
        <Route path="/customer" element={<div>Customer Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockUseAppSelector.mockReset();
    mockIsAuthenticated.mockReset();
  });

  it('redirects unauthenticated admin requests to admin login', () => {
    mockUseAppSelector.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    mockIsAuthenticated.mockReturnValue(false);

    renderPrivateRoute('admin');

    expect(screen.getByText('Admin Login Page')).toBeInTheDocument();
  });

  it('redirects unauthenticated customer requests to customer login', () => {
    mockUseAppSelector.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    mockIsAuthenticated.mockReturnValue(false);

    renderPrivateRoute('customer');

    expect(screen.getByText('Customer Login Page')).toBeInTheDocument();
  });

  it('allows operational tenant roles to access admin routes', () => {
    mockUseAppSelector.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'finance' },
    });
    mockIsAuthenticated.mockReturnValue(true);

    renderPrivateRoute('admin');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects customer users away from admin routes', () => {
    mockUseAppSelector.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'customer' },
    });
    mockIsAuthenticated.mockReturnValue(true);

    renderPrivateRoute('admin');

    expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
  });
});
