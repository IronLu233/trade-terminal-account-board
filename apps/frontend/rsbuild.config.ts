import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  dev: {
    writeToDisk: true,
  },
  tools: {
    htmlPlugin: {
      filename:
        process.env.NODE_ENV === 'production' ? 'index.ejs' : 'index.html',
    },
  },

  server: {
    port: 9000,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
