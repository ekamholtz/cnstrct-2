/**
 * Type declaration for the Zod resolver Vite plugin
 */
declare module "./vite-zod-plugin" {
  export default function zodResolver(): {
    name: string;
    resolveId(source: string, importer: string | undefined): string | null;
  };
}
