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
