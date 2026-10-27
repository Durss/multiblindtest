import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './front_src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.vue', '.json']
  },
  css: {
    preprocessorOptions: {
      less: {
        // Only inject mixins and variables (no actual CSS output)
        additionalData: `@import "${path.resolve(import.meta.dirname, 'front_src/less/_mixins.less')}";@import "${path.resolve(import.meta.dirname, 'front_src/less/_variables.less')}";`,
        javascriptEnabled: true
      }
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false, // Avoid minifying to prevent breaking share meta
  },
  server: {
    https: fs.existsSync('./multiblindtest.local-key.pem') ? {
      key: fs.readFileSync('./multiblindtest.local-key.pem'),
      cert: fs.readFileSync('./multiblindtest.local.pem')
    } : undefined,
    host: '127.0.0.1',
    port: 8080,
    strictPort: true,
    hmr: {
      host: 'multiblindtest.local',
      protocol: fs.existsSync('./multiblindtest.local-key.pem') ? 'wss' : 'ws',
      port: 8080
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      'gsap',
      'sockjs-client',
      'tmi.js',
      'fuse.js'
    ],
    exclude: []
  }
});
