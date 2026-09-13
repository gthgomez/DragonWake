/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Opt-in flag ("1") for quarantined alpha city raster art. */
  readonly VITE_ALPHA_CITY_ART?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
