import preact from '@preact/preset-vite';
import path from 'path';
import { Plugin, defineConfig } from 'vite';

// Dev-Server gegen ein ECHTES EMS-ESP-Gerät, nur zum Ansehen (read-only):
//   EMSESP_TARGET=http://<device-ip> pnpm exec vite --config vite.live.config.ts
// Geblockt wird alles außer Lesen (GET) und der Anmeldung (POST /rest/signIn).
// Der komplette Pfad /api (Befehle) ist gesperrt. Es kann also nichts an das Gerät
// geschrieben oder ausgelöst werden, auch nicht versehentlich über die Oberfläche.

const TARGET = process.env.EMSESP_TARGET ?? '';

const readOnlyGuard = (): Plugin => ({
  name: 'emsesp-read-only-guard',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? '';
      const method = (req.method ?? 'GET').toUpperCase();
      const isApiOrRest = url.startsWith('/rest') || url.startsWith('/api');
      if (!isApiOrRest) return next();

      const allowedLogin = method === 'POST' && url.startsWith('/rest/signIn');
      const readOnly = method === 'GET' || method === 'HEAD';
      const blockedApi = url.startsWith('/api'); // Befehle über die API
      if (allowedLogin || (readOnly && !blockedApi)) return next();

      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        console.log(
          `[read-only] blockiert: ${method} ${url} ${Buffer.concat(chunks).toString().slice(0, 120)}`
        );
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({ message: 'Read-only Testmodus: Schreiben ist gesperrt.' })
        );
      });
    });
  }
});

export default defineConfig(() => {
  if (!/^https?:\/\/[\w.-]+(:\d+)?$/.test(TARGET)) {
    throw new Error(
      'EMSESP_TARGET fehlt oder ist ungültig, z. B. http://<device-ip>'
    );
  }
  const REACT_SHIM = path.resolve(import.meta.dirname, 'src/preact-react-shim.ts');
  return {
    plugins: [
      preact({
        devToolsEnabled: false,
        prefreshEnabled: false,
        reactAliasesEnabled: false
      }),
      readOnlyGuard()
    ],
    resolve: {
      alias: {
        'react/jsx-runtime': 'preact/jsx-runtime',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        react: REACT_SHIM
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
      tsconfigPaths: true
    },
    server: {
      port: 3100,
      strictPort: true,
      proxy: {
        '/rest': { target: TARGET, changeOrigin: true, secure: false },
        '/api': { target: TARGET, changeOrigin: true, secure: false }
      }
    }
  };
});
