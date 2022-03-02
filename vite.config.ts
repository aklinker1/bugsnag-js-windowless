import { execSync } from 'child_process';
import { defineConfig, Plugin } from 'vite';
import pkg from './package.json';

function tsc(): Plugin {
  let isDevServer = false;
  let hasRan = false;

  return {
    name: 'tsc',
    config(_, { command }) {
      isDevServer = command === 'serve';
    },
    watchChange() {
      hasRan = false;
    },
    writeBundle() {
      if (isDevServer || hasRan) return;

      console.log('\x1b[0m\x1b[2m[tsc] Compiling\x1b[0m');
      execSync('tsc', { stdio: 'inherit' });
      hasRan = true;
    },
    closeBundle() {
      if (isDevServer) return;

      const logFile = (filename: string) =>
        console.log(`\x1b[0m\x1b[2mdist/\x1b[0m\x1b[93m${filename}\x1b[0m`);
      logFile('index.d.ts');
      logFile('index.d.ts.map');
    },
  };
}

export default defineConfig({
  plugins: [tsc()],
  build: {
    lib: {
      entry: 'lib/index.ts',
      name: 'bugsnag-js-service-worker',
      fileName: 'index',
    },
    sourcemap: true,
  },
  define: {
    __LIB_VERSION__: `"${pkg.version}"`,
    __LIB_REPO_URL__: `"${pkg.repository}"`,
  },
});
