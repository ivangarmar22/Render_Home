import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                     // rutas relativas: la carpeta dist se puede subir a cualquier hosting
  server: { open: true },
  build: { chunkSizeWarningLimit: 1500 },
});
