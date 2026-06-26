/* Force development mode even when NODE_ENV=production is set globally */
process.env.STACK_DEV = 'true';
process.env.NODE_ENV = 'development';
await import('../server.ts');
