import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  tools: {
    htmlPlugin: {
      filename: 'index.ejs',
    },
  },
  dev: {
    writeToDisk: true,
    client: {
      port: 9000,
    },
  },
  server: {
    port: 9000,
    proxy: {
      '*': 'http://127.0.0.1:3000',
    },
  },
});
