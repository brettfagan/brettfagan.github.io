import { execSync } from 'child_process';

try {
  const output = execSync('npx vite build --debug 2>&1', {
    cwd: '/vercel/share/v0-project',
    timeout: 30000,
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('[v0] Build output:', output);
} catch (err) {
  console.log('[v0] Build error exit code:', err.status);
  console.log('[v0] Build stderr:', err.stderr);
  console.log('[v0] Build stdout:', err.stdout);
}
