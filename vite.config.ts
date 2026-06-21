/* Release */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';
import { defineConfig, type PluginOption } from 'vite';

const require = createRequire(import.meta.url);

function loadObfuscatorPlugins(isProduction: boolean, skipObfuscation: boolean): PluginOption[] {
  if (!isProduction || skipObfuscation) return [];
  try {
    const obfuscator = require('rollup-plugin-obfuscator').default;
    return [
      obfuscator({
        global: false,
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [/node_modules/, /[\\/]i18n\.tsx$/],
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.4,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          renameGlobals: false,
          selfDefending: false,
          stringArray: true,
          stringArrayEncoding: [],
          stringArrayThreshold: 0.6,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        },
      }),
    ];
  } catch {
    console.warn('[vite] rollup-plugin-obfuscator not found — building without obfuscation');
    return [];
  }
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const skipObfuscation = process.env.SKIP_OBFUSCATION === 'true';

  return {
    plugins: [react(), tailwindcss(), ...loadObfuscatorPlugins(isProduction, skipObfuscation)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              return undefined;
            }
            if (id.includes('i18n.tsx')) return 'i18n';
          },
        },
      },
      esbuild: {
        legalComments: 'none',
        drop: isProduction ? ['console', 'debugger'] : [],
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
