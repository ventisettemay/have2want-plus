import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import {
  loadTestnetFlatDb,
  parseMultipartTestnetBody,
  publishTestnetRecord,
  queryTestnetProducts,
  TESTNET_UPLOADS_DIR,
} from './server/testnetFlatDb';

// Testnet Dev Server Middleware: delega a server/testnetFlatDb.ts (/api/testnet/query, /api/testnet/publish, /uploads/*)
function testnetDevServerPlugin(): Plugin {
  const UPLOAD_FOLDER = TESTNET_UPLOADS_DIR;

  if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
  }

  return {
    name: 'testnet-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (url === '/validation-key.txt' || url.startsWith('/validation-key.txt?')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.statusCode = 200;
          res.end('41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7');
          return;
        }

        const readJsonBody = (callback: (err: Error | null, data?: any) => void) => {
          const preParsed = (req as any).body;
          if (preParsed !== undefined && preParsed !== null && typeof preParsed === 'object' && !Buffer.isBuffer(preParsed)) {
            callback(null, preParsed);
            return;
          }
          if ((req as any).readableEnded) {
            callback(null, {});
            return;
          }
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              callback(null, bodyStr ? JSON.parse(bodyStr) : {});
            } catch (e: any) {
              callback(e);
            }
          });
        };

        // 1. ENDPOINT /api/testnet/query (GET & POST)
        if (url.startsWith('/api/testnet/query') && req.method === 'GET') {
          try {
            const parsedUrl = new URL(url, 'http://localhost');
            const lat = parsedUrl.searchParams.get('lat');
            const lng = parsedUrl.searchParams.get('lng');
            const q = parsedUrl.searchParams.get('q');
            const category = parsedUrl.searchParams.get('category');
            const data = lat || lng || q || category
              ? queryTestnetProducts({ user_lat: lat, user_lng: lng, q, category })
              : loadTestnetFlatDb();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (url.startsWith('/api/testnet/query') && req.method === 'POST') {
          readJsonBody((parseErr, data) => {
            if (parseErr) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'JSON non valido' }));
              return;
            }
            try {
              const payload = queryTestnetProducts({
                user_lat: data?.user_lat,
                user_lng: data?.user_lng,
                q: data?.q,
                category: data?.category,
              });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(payload));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. ENDPOINT /api/testnet/publish
        if (url.startsWith('/api/testnet/publish') && req.method === 'POST') {
          const contentType = String(req.headers['content-type'] || '');
          const preParsed = (req as any).body;

          if (
            contentType.includes('application/json') &&
            preParsed !== undefined &&
            preParsed !== null &&
            typeof preParsed === 'object' &&
            !Buffer.isBuffer(preParsed)
          ) {
            try {
              const result = publishTestnetRecord(preParsed);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          const chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          });
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const input = contentType.includes('multipart/form-data')
                ? parseMultipartTestnetBody(buffer, contentType, UPLOAD_FOLDER)
                : JSON.parse(buffer.toString('utf-8') || '{}');
              const result = publishTestnetRecord(input);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              const msg = err?.message || 'Errore publish testnet';
              res.statusCode = /estensione|mime|dimensione|payload/i.test(msg) ? 400 : 500;
              res.end(JSON.stringify({ success: false, error: msg }));
            }
          });
          return;
        }

        // 3. STATIC /uploads/<filename>
        if (url.startsWith('/uploads/')) {
          const filename = path.basename(url.split('?')[0]);
          const filePath = path.join(UPLOAD_FOLDER, filename);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.statusCode = 200;
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        next();
      });
    },
  };
}

// Esclude da dist/ solo gli allegati AI Studio non usati dal codice (preserva intatto public/assets/aistudio/)
function excludeUnusedAiStudioAssetsPlugin(): Plugin {
  return {
    name: 'exclude-unused-aistudio-dist',
    closeBundle() {
      const distAiStudioDir = path.resolve(__dirname, 'dist', 'assets', 'aistudio');
      if (fs.existsSync(distAiStudioDir)) {
        fs.rmSync(distAiStudioDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), testnetDevServerPlugin(), excludeUnusedAiStudioAssetsPlugin()],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    worker: {
      format: 'es',
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replace(/\\/g, '/');
            if (!normalized.includes('/node_modules/')) return undefined;
            if (normalized.includes('/node_modules/three/')) return 'vendor-three';
            if (normalized.includes('/node_modules/maplibre-gl/') && !normalized.includes('worker')) {
              return 'vendor-maplibre';
            }
            if (normalized.includes('/node_modules/firebase/') || normalized.includes('/node_modules/@firebase/')) {
              return 'vendor-firebase';
            }
            if (normalized.includes('/node_modules/jspdf/') || normalized.includes('/node_modules/html2canvas/')) {
              return 'vendor-pdf';
            }
            if (normalized.includes('/node_modules/lucide-react/') || normalized.includes('/node_modules/motion/')) {
              return 'vendor-ui';
            }
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
