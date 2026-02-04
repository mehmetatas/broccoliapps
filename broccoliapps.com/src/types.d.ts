// CSS module declarations
declare module "*.css" {
  const content: string;
  export default content;
}

// Vite environment variables
// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires interface
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires interface
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
