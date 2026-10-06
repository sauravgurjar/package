import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
      cssFileName: 'style',
    },
    sourcemap: true,
    rolldownOptions: {
      external: (id) => /^(react|react-dom|@mui\/material|@emotion\/react|@emotion\/styled)(\/.*)?$/.test(id),
    },
  },
});
