import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      // Bundle analyzer - generates stats.html on build
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Enable code splitting for better caching and smaller initial bundle
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React and related libraries
            'react-vendor': ['react', 'react-dom'],
            // State management chunk
            'state': ['zustand'],
            // UI components chunk
            'ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
            // Utility libraries
            'utils': ['fast-deep-equal'],
          },
        },
      },
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Optimize chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
  }
})
