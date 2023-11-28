/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/image/client" />


// docs
interface ImportMetaEnv {
    readonly GITHUB_TOKEN: string | undefined
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  