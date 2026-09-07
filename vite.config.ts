import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // This app is served through the Express middleware server. The preview
      // proxy does not forward Vite's HMR WebSocket, so the injected client
      // repeatedly reports "WebSocket closed without opened".
      hmr: false,
      watch: null,
    },
  };
});
