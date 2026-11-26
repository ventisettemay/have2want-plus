import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';

// Testnet Dev Server Middleware: implementa i medesimi endpoint del server Python Flask (/api/testnet/query, /api/testnet/publish, /uploads/*)
function testnetDevServerPlugin(): Plugin {
  const UPLOAD_FOLDER = path.resolve(__dirname, 'uploads');
  const DB_FILE = path.resolve(__dirname, 'flat_database.json');

  if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
  }

  // Calcolo Geospaziale di Prossimità (Formula di Haversine)
  function calculateProximity(userLat: number, userLng: number, partnerLat: number, partnerLng: number): number {
    const R = 6371.0; // Raggio terrestre in km
    const toRad = (deg: number) => (deg * Math.PI) / 180.0;
    const lat1 = toRad(userLat);
    const lon1 = toRad(userLng);
    const lat2 = toRad(partnerLat);
    const lon2 = toRad(partnerLng);
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
  }

  function loadDatabase(): any[] {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('[Vite Testnet DB] Errore lettura flat_database.json:', e);
      }
    }
    return [
      {
        product_id: 'TXT-001',
        product_name: 'BMW X5',
        current_category: 'Varie',
        is_18_plus: true,
        technical_specs: { anno: '2023', chilometraggio: '45.000 km' },
        location: { latitude: 45.4642, longitude: 9.19 },
        image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
      },
      {
        product_id: 'TXT-002',
        product_name: 'Audi Q5',
        current_category: 'Varie',
        is_18_plus: false,
        technical_specs: { anno: '2022', chilometraggio: '30.000 km' },
        location: { latitude: 45.0703, longitude: 7.6869 },
        image_url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
      },
    ];
  }

  function saveDatabase(data: any[]): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Vite Testnet DB] Errore salvataggio flat_database.json:', e);
    }
  }

  // Categorizzazione Automatica a Soglia (> 10)
  function autoCategorization(database: any[], threshold = 10): void {
    const counts: Record<string, number> = {};
    for (const item of database) {
      if (item.current_category === 'Varie') {
        const brand = item.product_name.split(' ')[0];
        counts[brand] = (counts[brand] || 0) + 1;
      }
    }
    let modified = false;
    for (const [brand, count] of Object.entries(counts)) {
      if (count > threshold) {
        for (const item of database) {
          if (item.product_name.startsWith(brand)) {
            item.current_category = `Categoria ${brand}`;
            modified = true;
          }
        }
      }
    }
    if (modified) {
      saveDatabase(database);
    }
  }

  return {
    name: 'testnet-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 0. ENDPOINT /validation-key.txt (Verifica Dominio Pi Network)
        if (url === '/validation-key.txt' || url.startsWith('/validation-key.txt?')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.statusCode = 200;
          res.end('41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7');
          return;
        }

        // 1. ENDPOINT /api/testnet/query
        if (url.startsWith('/api/testnet/query') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              const data = bodyStr ? JSON.parse(bodyStr) : {};
              const userLat = parseFloat(data.user_lat) || 0;
              const userLng = parseFloat(data.user_lng) || 0;

              const db = loadDatabase();
              autoCategorization(db);

              const payload = db.map((p) => {
                const pLat = parseFloat(p.location?.latitude) || 0;
                const pLng = parseFloat(p.location?.longitude) || 0;
                const distance = calculateProximity(userLat, userLng, pLat, pLng);

                return {
                  id: p.product_id,
                  name: p.product_name,
                  category: p.current_category,
                  is_18_plus: Boolean(p.is_18_plus),
                  specs: p.technical_specs || {},
                  image: p.image_url || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
                  distance_km: distance,
                };
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
          const contentType = req.headers['content-type'] || '';
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          });
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              let productName = 'Nuovo Articolo';
              let specsAnno = '2024';
              let userLat = 0;
              let userLng = 0;
              let is18Plus = false;
              let savedImageUrl: string | null = null;

              if (contentType.includes('application/json')) {
                const parsed = JSON.parse(buffer.toString('utf-8'));
                productName = parsed.product_name || productName;
                specsAnno = parsed.specs_anno || specsAnno;
                userLat = parseFloat(parsed.user_lat) || 0;
                userLng = parseFloat(parsed.user_lng) || 0;
                is18Plus = parsed.is_18_plus === true || parsed.is_18_plus === 'true';
                savedImageUrl = parsed.image_url || null;
              } else if (contentType.includes('multipart/form-data')) {
                // Parsing multipart form data semplice
                const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
                if (boundaryMatch) {
                  const boundary = boundaryMatch[1] || boundaryMatch[2];
                  const parts = buffer.toString('binary').split(`--${boundary}`);
                  for (const part of parts) {
                    if (part.includes('name="product_name"')) {
                      const val = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
                      if (val) productName = val.trim();
                    } else if (part.includes('name="specs_anno"')) {
                      const val = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
                      if (val) specsAnno = val.trim();
                    } else if (part.includes('name="user_lat"')) {
                      const val = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
                      if (val) userLat = parseFloat(val) || 0;
                    } else if (part.includes('name="user_lng"')) {
                      const val = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
                      if (val) userLng = parseFloat(val) || 0;
                    } else if (part.includes('name="is_18_plus"')) {
                      const val = part.split('\r\n\r\n')[1]?.split('\r\n')[0];
                      if (val) is18Plus = val.trim().toLowerCase() === 'true';
                    } else if (part.includes('name="image"') && part.includes('filename="')) {
                      const filenameMatch = part.match(/filename="([^"]+)"/);
                      if (filenameMatch && filenameMatch[1]) {
                        const filename = path.basename(filenameMatch[1]).replace(/[^a-zA-Z0-9_.-]/g, '_');
                        const uniqueName = `${Date.now()}_${filename}`;
                        const headerEndIndex = part.indexOf('\r\n\r\n');
                        if (headerEndIndex !== -1) {
                          const fileData = part.substring(headerEndIndex + 4, part.lastIndexOf('\r\n'));
                          const filePath = path.join(UPLOAD_FOLDER, uniqueName);
                          fs.writeFileSync(filePath, Buffer.from(fileData, 'binary'));
                          savedImageUrl = `/uploads/${uniqueName}`;
                        }
                      }
                    }
                  }
                }
              }

              const db = loadDatabase();
              const newProduct = {
                product_id: `TXT-${String(db.length + 1).padStart(3, '0')}`,
                product_name: productName,
                current_category: 'Varie',
                is_18_plus: is18Plus,
                technical_specs: { anno: specsAnno },
                location: { latitude: userLat, longitude: userLng },
                image_url: savedImageUrl,
              };

              db.push(newProduct);
              autoCategorization(db);
              saveDatabase(db);

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  status: 'success',
                  product_id: newProduct.product_id,
                  image_url: savedImageUrl,
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), testnetDevServerPlugin()],
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
      // COOP/COEP richiesti da FFmpeg.wasm (SharedArrayBuffer) nel Video Creator
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
  };
});
