import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Output of a git command, or an empty string where git or the repository is missing. */
function git(args: string) {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const buildInfo = {
  commit: git('rev-parse HEAD'),
  commitDate: git('log -1 --format=%cI'),
  branch: git('rev-parse --abbrev-ref HEAD'),
  dirty: git('status --porcelain --untracked-files=no') !== '',
  builtAt: new Date().toISOString(),
};

export default defineConfig({
  plugins: [react()],
  // Relative paths so the build can be hosted from any directory.
  base: './',
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  build: {
    outDir: 'dist/robot-customisation',
    chunkSizeWarningLimit: 1024,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
