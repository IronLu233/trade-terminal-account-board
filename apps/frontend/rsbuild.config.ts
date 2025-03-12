import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
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
