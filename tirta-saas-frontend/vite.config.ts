import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function resolveDevHost(value?: string): string | true {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === 'localhost') {
    return 'localhost';
  }

  if (normalized === '0.0.0.0' || normalized === 'true' || normalized === 'all') {
    return true;
  }

  return value!.trim();
}

function resolvePort(fallback: number, value?: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = resolveDevHost(env.VITE_DEV_HOST);
  const port = resolvePort(5174, env.VITE_DEV_PORT);

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (normalizedId.includes('/src/pages/reports/')) {
              return 'reports-pages';
            }

            if (normalizedId.includes('/src/pages/platform/') || normalizedId.includes('/src/pages/platform-payments/')) {
              return 'platform-pages';
            }

            if (normalizedId.includes('/src/pages/settings/')) {
              return 'settings-pages';
            }

            if (
              normalizedId.includes('/src/pages/payments/') ||
              normalizedId.includes('/src/pages/payment-proofs/') ||
              normalizedId.includes('/src/pages/customer-payments/')
            ) {
              return 'payment-pages';
            }

            if (
              normalizedId.includes('/src/pages/customer/') ||
              normalizedId.includes('/src/pages/customer-invoices/') ||
              normalizedId.includes('/src/pages/customer-profile/') ||
              normalizedId.includes('/src/pages/customer-usage/')
            ) {
              return 'customer-pages';
            }

            if (
              normalizedId.includes('/src/pages/customers/') ||
              normalizedId.includes('/src/pages/invoices/') ||
              normalizedId.includes('/src/pages/usage/') ||
              normalizedId.includes('/src/pages/water-rates/') ||
              normalizedId.includes('/src/pages/subscriptions/') ||
              normalizedId.includes('/src/pages/user-management/')
            ) {
              return 'admin-pages';
            }

            if (!normalizedId.includes('node_modules')) {
              return;
            }

            if (
              normalizedId.includes('/node_modules/react/') ||
              normalizedId.includes('/node_modules/react-dom/') ||
              normalizedId.includes('/node_modules/scheduler/')
            ) {
              return 'app-vendor';
            }

            if (normalizedId.includes('framer-motion') || normalizedId.includes('lucide-react')) {
              return 'animation-vendor';
            }

            if (normalizedId.includes('recharts') || normalizedId.includes('d3-')) {
              return 'charts-vendor';
            }

            if (normalizedId.includes('xlsx') || normalizedId.includes('react-to-print')) {
              return 'export-vendor';
            }

            if (
              normalizedId.includes('@headlessui') ||
              normalizedId.includes('@heroicons') ||
              normalizedId.includes('react-image-crop')
            ) {
              return 'ui-vendor';
            }

            if (
              normalizedId.includes('react-router') ||
              normalizedId.includes('react-redux') ||
              normalizedId.includes('@reduxjs/toolkit') ||
              normalizedId.includes('redux-persist')
            ) {
              return 'app-vendor';
            }

            if (
              normalizedId.includes('axios') ||
              normalizedId.includes('date-fns') ||
              normalizedId.includes('react-hook-form') ||
              normalizedId.includes('@hookform') ||
              normalizedId.includes('yup')
            ) {
              return 'data-vendor';
            }
          },
        },
      },
    },
    server: {
      host,
      port,
      strictPort: true,
    },
    preview: {
      host,
      port,
      strictPort: true,
    },
  };
})
