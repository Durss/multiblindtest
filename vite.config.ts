import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createVuePlugin({
      jsx: false,
      vueTemplateOptions: {}
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './front_src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.vue', '.json']
  },
  css: {
    preprocessorOptions: {
      less: {
        // Only inject mixins and variables (no actual CSS output)
        additionalData: `@import "${path.resolve(__dirname, 'front_src/less/_mixins.less')}";@import "${path.resolve(__dirname, 'front_src/less/_variables.less')}";`,
        javascriptEnabled: true
      }
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false, // Avoid minifying to prevent breaking share meta
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
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
      'vuex',
      'vue-i18n',
      'gsap',
      'sockjs-client',
      'tmi.js',
      'fuse.js'
    ],
    exclude: []
  }
});
