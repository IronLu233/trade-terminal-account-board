import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    writeToDisk: true,
    client: {
      host: '127.0.0.1',
      port: 9000,
    },
  },
  tools: {
    htmlPlugin: {
      filename: 'index.ejs',
    },
  },
});
