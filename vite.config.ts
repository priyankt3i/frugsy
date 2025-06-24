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
        },
      },
    };
});
