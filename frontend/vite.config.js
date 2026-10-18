import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls are proxied to the backend, so the browser sees one origin (no CORS needed)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: { proxy: { '/api': env.VITE_API_URL || 'http://localhost:4000' } },
  };
});
