/** PM2 — Option 5: native install on Ubuntu. Requires .env with DB_ENCRYPTION_KEY in project root. */
const path = require('path');
const root = path.join(__dirname, '..');

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'vicariustab-system',
      script: 'dist/server.cjs',
      cwd: root,
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
