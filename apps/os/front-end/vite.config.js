// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { createViteConfig } from '@fuyeor/config/vite.config.js';

/**
 * Vite configuration for the OS front-end application.
 * @type {import('vite').UserConfig}
 */
export default defineConfig(({ mode }) => {
  // loading environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return createViteConfig(
    {
      plugins: [],
      server: {
        host: '0.0.0.0',
        port: 5590,
        allowedHosts: ['webroamer.localhost'],
        proxy: {
          '/v1': {
            target: env.VITE__DEV_API_PROXY_TARGET || 'http://localhost:3000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/v1/, ''),
          },

          '/docs': {
            target: env.VITE__DEV_API_PROXY_TARGET || 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
    },
    import.meta.dirname,
  );
});
