import { defineConfig } from 'vite';

// MFE3 is a Web Component bundle. No React, no Module Federation.
// Build one file the host can load via <script src=".../mfe3.js">.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'Mfe3',
      fileName: () => 'mfe3.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'mfe3.js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    strictPort: true,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: {
    port: 4175,
  },
});
