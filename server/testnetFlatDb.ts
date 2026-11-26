import fs from 'fs';
import path from 'path';

export interface FlatTestnetRecord {
  product_id: string;
  product_name: string;
  current_category: string;
  is_18_plus: boolean;
  technical_specs: Record<string, unknown>;
  location: {
    latitude: number;
    longitude: number;
  };
  image_url: string | null;
  type?: string;
}

export const TESTNET_DB_PATH = path.resolve(process.cwd(), 'flat_database.json');
export const TESTNET_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80';

const DEFAULT_RECORDS: FlatTestnetRecord[] = [
  {
    product_id: 'TXT-001',
    product_name: 'BMW X5',
    current_category: 'Varie',
    is_18_plus: true,
    technical_specs: { anno: '2023', chilometraggio: '45.000 km' },
    location: { latitude: 45.4642, longitude: 9.19 },
    image_url: DEFAULT_FALLBACK_IMAGE,
  },
  {
    product_id: 'TXT-002',
    product_name: 'Audi Q5',
    current_category: 'Varie',
    is_18_plus: false,
    technical_specs: { anno: '2022', chilometraggio: '30.000 km' },
    location: { latitude: 45.0703, longitude: 7.6869 },
    image_url:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
  },
];

export function calculateTestnetProximityKm(
  userLat: number,
  userLng: number,
  partnerLat: number,
  partnerLng: number
): number {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const lat1 = toRad(userLat);
  const lon1 = toRad(userLng);
  const lat2 = toRad(partnerLat);
  const lon2 = toRad(partnerLng);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
}

export function loadTestnetFlatDb(dbPath = TESTNET_DB_PATH): FlatTestnetRecord[] {
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        const merged = [
          ...(Array.isArray(parsed.listings) ? parsed.listings : []),
          ...(Array.isArray(parsed.shops) ? parsed.shops : []),
        ];
        if (merged.length > 0) return merged;
      }
    } catch (err) {
      console.warn('[Server Testnet DB] Errore lettura flat_database.json:', err);
    }
  }
  return DEFAULT_RECORDS.map((r) => ({ ...r, technical_specs: { ...r.technical_specs }, location: { ...r.location } }));
}

export function saveTestnetFlatDb(records: FlatTestnetRecord[], dbPath = TESTNET_DB_PATH): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${dbPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(records, null, 2), 'utf-8');
  fs.renameSync(tmpPath, dbPath);
}

export function applyAutoCategorization(database: FlatTestnetRecord[], threshold = 10): boolean {
  const counts: Record<string, number> = {};
  for (const item of database) {
    if (item.current_category === 'Varie' && typeof item.product_name === 'string') {
      const brand = item.product_name.split(' ')[0];
      if (brand) counts[brand] = (counts[brand] || 0) + 1;
    }
  }
  let modified = false;
  for (const [brand, count] of Object.entries(counts)) {
    if (count > threshold) {
      for (const item of database) {
        if (typeof item.product_name === 'string' && item.product_name.startsWith(brand)) {
          item.current_category = `Categoria ${brand}`;
          modified = true;
        }
      }
    }
  }
  return modified;
}

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const FORBIDDEN_UPLOAD_MIME_PATTERNS = [/html/i, /svg/i, /javascript/i, /ecmascript/i, /xml/i, /php/i, /x-sh/i];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_PARTS = 24;

export function queryTestnetProducts(
  params: { user_lat?: unknown; user_lng?: unknown; q?: unknown; category?: unknown },
  dbPath = TESTNET_DB_PATH
) {
  const userLat = parseFloat(String(params?.user_lat ?? 0)) || 0;
  const userLng = parseFloat(String(params?.user_lng ?? 0)) || 0;
  const queryText = typeof params?.q === 'string' ? params.q.trim().toLowerCase() : '';
  const categoryFilter = typeof params?.category === 'string' ? params.category.trim().toLowerCase() : '';

  const db = loadTestnetFlatDb(dbPath);
  if (applyAutoCategorization(db)) {
    saveTestnetFlatDb(db, dbPath);
  }
  return db
    .filter((p) => {
      if (categoryFilter && (p.current_category || 'varie').toLowerCase() !== categoryFilter) {
        return false;
      }
      if (queryText) {
        const hay = `${p.product_name || ''} ${p.current_category || ''} ${JSON.stringify(p.technical_specs || {})}`.toLowerCase();
        if (!hay.includes(queryText)) return false;
      }
      return true;
    })
    .map((p) => {
      const pLat = parseFloat(String(p.location?.latitude ?? 0)) || 0;
      const pLng = parseFloat(String(p.location?.longitude ?? 0)) || 0;
      return {
        id: p.product_id,
        name: p.product_name,
        category: p.current_category || 'Varie',
        is_18_plus: Boolean(p.is_18_plus),
        specs: p.technical_specs || {},
        image: p.image_url || DEFAULT_FALLBACK_IMAGE,
        distance_km: calculateTestnetProximityKm(userLat, userLng, pLat, pLng),
      };
    });
}

export function parseMultipartTestnetBody(
  buffer: Buffer,
  contentType: string,
  uploadsDir = TESTNET_UPLOADS_DIR
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (buffer.length > MAX_UPLOAD_BYTES + 1024 * 1024) {
    throw new Error('Payload multipart troppo grande (max 6 MB).');
  }
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return out;

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const parts = buffer.toString('binary').split(`--${boundary}`).slice(0, MAX_MULTIPART_PARTS);
  for (const part of parts) {
    const headerEndIndex = part.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;
    const headersText = part.substring(0, headerEndIndex);
    const bodyEndIndex = part.lastIndexOf('\r\n');
    const bodyRaw = bodyEndIndex >= headerEndIndex + 4
      ? part.substring(headerEndIndex + 4, bodyEndIndex)
      : part.substring(headerEndIndex + 4);

    const nameMatch = headersText.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];

    const filenameMatch = headersText.match(/filename="([^"]+)"/);
    if (filenameMatch && filenameMatch[1]) {
      const baseName = path.basename(filenameMatch[1]);
      const ext = path.extname(baseName).toLowerCase();
      if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
        throw new Error(`Estensione file non consentita (${ext || 'sconosciuta'}). Ammesse solo: .jpg, .jpeg, .png, .webp, .gif`);
      }

      const ctMatch = headersText.match(/Content-Type:\s*([^\r\n;]+)/i);
      const partMime = (ctMatch?.[1] || '').trim().toLowerCase();
      if (partMime) {
        if (!partMime.startsWith('image/') || FORBIDDEN_UPLOAD_MIME_PATTERNS.some((rx) => rx.test(partMime))) {
          throw new Error(`MIME type non consentito per upload immagine: ${partMime}`);
        }
      }

      const fileBuf = Buffer.from(bodyRaw, 'binary');
      if (fileBuf.length === 0 || fileBuf.length > MAX_UPLOAD_BYTES) {
        throw new Error('Dimensione file immagine non valida (consentito 1 B – 5 MB).');
      }

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeFilename = baseName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueName = `${Date.now()}_${safeFilename}`;
      fs.writeFileSync(path.join(uploadsDir, uniqueName), fileBuf);
      out.image_url = `/uploads/${uniqueName}`;
    } else {
      out[fieldName] = bodyRaw.trim();
    }
  }
  return out;
}

export function publishTestnetRecord(
  input: Record<string, any>,
  dbPath = TESTNET_DB_PATH
): {
  status: 'success';
  success: true;
  product_id: string;
  image_url: string | null;
  stored: FlatTestnetRecord;
} {
  const db = loadTestnetFlatDb(dbPath);
  const productName = String(
    input?.product_name || input?.title || input?.name || 'Nuovo Articolo'
  ).trim();
  const specsAnno = String(input?.specs_anno || input?.year || '2024').trim();
  const userLat = parseFloat(String(input?.user_lat ?? input?.lat ?? 0)) || 0;
  const userLng = parseFloat(String(input?.user_lng ?? input?.lng ?? 0)) || 0;
  const is18Plus = input?.is_18_plus === true || String(input?.is_18_plus).toLowerCase() === 'true';
  const savedImageUrl =
    typeof input?.image_url === 'string' && input.image_url.trim() ? input.image_url.trim() : null;

  const newProduct: FlatTestnetRecord = {
    product_id: `TXT-${String(db.length + 1).padStart(3, '0')}`,
    product_name: productName,
    current_category: String(input?.current_category || input?.category || 'Varie'),
    is_18_plus: is18Plus,
    technical_specs: { anno: specsAnno },
    location: { latitude: userLat, longitude: userLng },
    image_url: savedImageUrl,
    ...(input?.type ? { type: String(input.type) } : {}),
  };

  db.push(newProduct);
  applyAutoCategorization(db);
  saveTestnetFlatDb(db, dbPath);

  return {
    status: 'success',
    success: true,
    product_id: newProduct.product_id,
    image_url: savedImageUrl,
    stored: newProduct,
  };
}
