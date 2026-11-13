import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  base: './', // WAJIB untuk cPanel: bekerja di root public_html, subdomain, maupun subfolder
  build: {
    sourcemap: false, // Keamanan produksi: mencegah bocornya kode sumber asli
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});

