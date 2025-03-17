/**
 * Custom Vite plugin to resolve Zod module issues
 * This plugin ensures that all Zod internal imports are properly resolved
 */
export default function zodResolver() {
  return {
    name: 'vite-plugin-zod-resolver',
    resolveId(source, importer) {
      // Handle Zod internal module imports
      if (source === './ZodError' && importer && importer.includes('zod')) {
        return require.resolve('zod/lib/ZodError.js');
      }
      
      // Handle other Zod internal imports as needed
      if (source.startsWith('./') && importer && importer.includes('zod')) {
        try {
          const resolved = source.replace('./', 'zod/lib/');
          return require.resolve(resolved);
        } catch (e) {
          // If resolution fails, let Vite handle it
          return null;
        }
      }
      
      return null;
    }
  };
}
