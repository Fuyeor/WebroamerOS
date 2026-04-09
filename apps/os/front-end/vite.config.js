// vite.config.ts
import { createViteConfig } from '@fuyeor/config/vite.config.js';

/**
 * @type {import('vite').UserConfig}
 */
export default createViteConfig(
  {
    plugins: [],
    server: {
      host: '0.0.0.0',
      port: 5590,
      allowedHosts: ['webroamer.localhost'],
      proxy: {
        // 代理到后端的生产路径
        '/v1': {
          // target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/v1/, ''),
        },
      },
    },
  },
  import.meta.dirname, // 传入当前目录
);
