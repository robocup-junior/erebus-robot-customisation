import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Relative paths so the build can be hosted from any directory.
  base: './',
  build: {
    outDir: 'dist/robot-customisation',
    chunkSizeWarningLimit: 1024,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
