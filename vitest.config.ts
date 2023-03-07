import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    mockReset: true,
  },
  define: {
    __LIB_VERSION__: JSON.stringify('test'),
    __LIB_REPO_URL__: JSON.stringify('test url'),
  },
});
