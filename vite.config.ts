import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/maps': {
            target: 'https://maps.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/maps/, ''),
          },
            // *** NEW PROXY ENTRY FOR PLACES API (New) ***
          '/placesapi': { // A distinct prefix for the new Places API
            target: 'https://places.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/placesapi/, ''),
          },
        },
      },
    };
});
