/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
const config: import('vite').UserConfig & { test: import('vitest').InlineConfig } = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2023',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-router')) return 'react-vendor'
          if (id.match(/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/)) return 'react-vendor'
          if (id.includes('react-markdown') || id.includes('rehype-') || id.includes('remark-') || id.includes('unified') || id.includes('unist-') || id.includes('mdast-') || id.includes('hast-') || id.includes('micromark')) return 'markdown-vendor'
          if (id.includes('@supabase')) return 'supabase-vendor'
          if (id.includes('lucide-react')) return 'icons-vendor'
          if (id.includes('@radix-ui')) return 'radix-vendor'
          return 'vendor'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/features/foundry/ai/evals/*.eval.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '_archive/**',
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/integrations/supabase/types.ts',
        'src/integrations/supabase/db-rows.ts',
        'src/lib/education/demo-data.ts',
        '**/*.test.{ts,tsx}',
        '**/test/**',
        'src/env.d.ts',
        'vite.config.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
    },
  },
}

export default defineConfig(config)
