/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_STORYQUEST_BASE_URL?: string
  readonly VITE_WS_HOST?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
