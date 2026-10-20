/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_META_CONVERSIONS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
