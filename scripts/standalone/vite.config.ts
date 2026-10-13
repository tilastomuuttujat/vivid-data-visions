import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');

// Builds one self-contained HTML; atlas data stays in separate JSON files loaded at runtime.
export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [
    {
      name: 'external-json',
      enforce: 'pre',
      resolveId(id) {
        const m = id.match(/data\/(atlas|anchors|maakunnat)\.json$/);
        return m ? `\0ext-json:${m[1]}` : null;
      },
      load(id) {
        if (!id.startsWith('\0ext-json:')) return null;
        return `export default window.__ATLAS_DATA__[${JSON.stringify(id.slice(10) + ".json")}];`;
      },
    },
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],
  resolve: { alias: { '@': path.join(root, 'src') }, dedupe: ['react', 'react-dom', '@tanstack/react-router'] },
  build: { outDir: '/tmp/standalone-build', emptyOutDir: true, chunkSizeWarningLimit: 5000 },
});
