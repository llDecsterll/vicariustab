/* Release */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import obfuscator from 'rollup-plugin-obfuscator';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const skipObfuscation = process.env.SKIP_OBFUSCATION === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isProduction && !skipObfuscation
        ? [
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
          ]
        : []),
    ],
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
