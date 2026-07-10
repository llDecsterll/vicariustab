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
    const obfuscatorReq = require('rollup-plugin-obfuscator');
    const obfuscator = obfuscatorReq.default || obfuscatorReq;
    return [
      obfuscator({
        global: false,
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [/node_modules/, /[\\/]i18n\.tsx$/, /View\.tsx$/, /App\.tsx$/, /DetailModal\.tsx$/],
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
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              return undefined;
            }
            if (id.includes('i18n.tsx')) return 'i18n';
            if (id.includes('warehouseExcel.ts')) return 'util-warehouse-excel';
            if (id.includes('SettingsView.tsx')) return 'view-settings';
            if (id.includes('DashboardView.tsx')) return 'view-dashboard';
            if (id.includes('WarehouseView.tsx')) return 'view-warehouse';
            if (id.includes('SecurityView.tsx')) return 'view-security';
            if (id.includes('ReportsView.tsx')) return 'view-reports';
            if (id.includes('ComputersView.tsx')) return 'view-computers';
            if (id.includes('SoftwareView.tsx')) return 'view-software';
            if (id.includes('EmployeesView.tsx')) return 'view-employees';
            if (id.includes('NetworkView.tsx')) return 'view-network';
            if (id.includes('ObjectsView.tsx')) return 'view-objects';
            if (id.includes('AuditsView.tsx')) return 'view-audits';
            if (id.includes('WarrantiesView.tsx')) return 'view-warranties';
            if (id.includes('ActivityLogView.tsx')) return 'view-activity-log';
            if (id.includes('DetailModal.tsx')) return 'view-detail-modal';
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
