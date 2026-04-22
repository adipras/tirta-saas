/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_LOCAL_ORIGIN?: string;
  readonly VITE_API_PUBLIC_ORIGIN?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEV_HOST?: string;
  readonly VITE_DEV_PORT?: string;
  readonly VITE_PRINTER_BRIDGE_URL?: string;
  readonly VITE_PRINTER_BRIDGE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
