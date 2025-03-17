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
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      // Make sure zod is properly bundled
      onwarn(warning, warn) {
        // Suppress warnings about zod imports
        if (warning.code === 'UNRESOLVED_IMPORT' && 
            typeof warning.message === 'string' && 
            warning.message.includes('zod')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: ['zod']
  }
}));
