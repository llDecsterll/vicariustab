/** PM2 — Вариант 5: нативная установка на Ubuntu */
module.exports = {
  apps: [
    {
      name: 'uvwstack',
      script: 'dist/server.cjs',
      cwd: __dirname.replace(/[/\\]deploy$/, ''),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '8080',
        TRUST_PROXY: 'false',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '8080',
      },
    },
  ],
};
