import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/content/index.ts'],
  format: ['iife'],
  platform: 'browser',
  outDir: 'dist',
  clean: true,
  minify: false,
});
