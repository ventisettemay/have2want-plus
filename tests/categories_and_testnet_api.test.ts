import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { CATEGORY_FALLBACK_IMAGE, REAL_CATEGORIES_MATRIX } from '../src/categories';
import {
  loadTestnetFlatDb,
  parseMultipartTestnetBody,
  publishTestnetRecord,
  queryTestnetProducts,
} from '../server/testnetFlatDb';

describe('Categorie Fallback Image & Testnet Flat DB Server Helpers', () => {
  it('Sostituisce la thumbnail rotta di src/categories.ts con CATEGORY_FALLBACK_IMAGE valida', () => {
    expect(CATEGORY_FALLBACK_IMAGE).toBe(
      'https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=600&auto=format&fit=crop&q=80'
    );
    const vehiclesCat = REAL_CATEGORIES_MATRIX.find((c) => c.key === 'auto_moto_veicoli');
    expect(vehiclesCat).toBeDefined();
    expect(vehiclesCat?.realImage).toBe(CATEGORY_FALLBACK_IMAGE);
    expect(JSON.stringify(REAL_CATEGORIES_MATRIX)).not.toContain('photo-1486006920555-c77dce18193b');
  });

  it('publishTestnetRecord e queryTestnetProducts leggono/scrivono flat_database.json con distanze Haversine e multipart upload', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2w-testnet-'));
    try {
      const dbPath = path.join(tmpDir, 'flat_database.json');
      const uploadsDir = path.join(tmpDir, 'uploads');

      const initial = loadTestnetFlatDb(dbPath);
      expect(initial.length).toBeGreaterThanOrEqual(2);

      const pubRes = publishTestnetRecord(
        {
          type: 'listing',
          product_name: 'Fiat Panda 4x4',
          specs_anno: '2021',
          user_lat: 41.8902,
          user_lng: 12.4922,
          is_18_plus: false,
        },
        dbPath
      );
      expect(pubRes.success).toBe(true);
      expect(pubRes.product_id).toBe('TXT-003');
      expect(fs.existsSync(dbPath)).toBe(true);

      const queried = queryTestnetProducts({ user_lat: 41.8902, user_lng: 12.4922 }, dbPath);
      const panda = queried.find((item) => item.id === 'TXT-003');
      expect(panda).toBeDefined();
      expect(panda?.name).toBe('Fiat Panda 4x4');
      expect(panda?.distance_km).toBe(0);

      const boundary = '----TestBoundary123';
      const rawMultipart =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="product_name"\r\n\r\n` +
        `Bicicletta Elettrica\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="image"; filename="bike.png"\r\n` +
        `Content-Type: image/png\r\n\r\n` +
        `PNGDATA\r\n` +
        `--${boundary}--\r\n`;

      const parsed = parseMultipartTestnetBody(
        Buffer.from(rawMultipart, 'binary'),
        `multipart/form-data; boundary=${boundary}`,
        uploadsDir
      );
      expect(parsed.product_name).toBe('Bicicletta Elettrica');
      expect(parsed.image_url).toMatch(/^\/uploads\/\d+_bike\.png$/);
      expect(fs.existsSync(path.join(uploadsDir, path.basename(parsed.image_url!)))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
