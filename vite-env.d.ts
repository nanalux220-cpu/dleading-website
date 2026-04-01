/// <reference types="vite/client" />

declare const __BASE_PATH__: string;
declare const __IS_PREVIEW__: boolean;

interface ImportMetaEnv {
  readonly VITE_FORM_CONTACT_URL?: string;
  readonly VITE_FORM_LEAD_POPUP_URL?: string;
  readonly VITE_FORM_WEBSITE_AUDIT_URL?: string;
  readonly VITE_FORM_PPC_PRICING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}