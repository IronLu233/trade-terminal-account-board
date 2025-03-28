import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

export default defineConfig({
  plugins: [pluginReact(), pluginNodePolyfill()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  html: {
    title: 'TT Account Manager',
  },
  dev: {
    writeToDisk: true,
  },
  server: {
    port: 9000,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
