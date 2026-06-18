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
              exclude: [/node_modules/],
              options: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.4,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                renameGlobals: false,
                selfDefending: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
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
