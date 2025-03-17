import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['zod'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Ensure these modules are properly bundled and not treated as external
      external: [],
    }
  },
  optimizeDeps: {
    include: ['zod', '@hookform/resolvers/zod'],
    force: true
  },
  // Add a define section to ensure environment variables are properly replaced
  define: {
    // Replace process.env for libraries that might use it
    'process.env': {},
    // Ensure import.meta.env is properly handled
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV),
  }
}));
