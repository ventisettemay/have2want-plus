import type { R2Bucket, CloudflareEnv } from './types';
import { nowMs } from './auth';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function validateFileUpload({
  fileName,
  mimeType,
  sizeBytes,
}: {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
}): { valid: boolean; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'Nome file mancante' };
  }
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'];
  if (!allowedExts.includes(ext)) {
    return { valid: false, error: `Estensione non consentita: ${ext}` };
  }
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return { valid: false, error: `MIME type non consentito: ${mimeType}` };
  }
  if (sizeBytes !== undefined) {
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return { valid: false, error: 'Dimensione file non valida' };
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File troppo grande: ${Math.round(sizeBytes / 1024 / 1024)} MB (max 50 MB)` };
    }
  }
  return { valid: true };
}

export function generateFileKey(fileName: string, advertiserId: string): string {
  const safe = fileName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._-]/g, '_');
  return `ads/uploads/${advertiserId}/${Date.now()}_${safe}`;
}

/* ------------------------------------------------------------------ */
/* Presign upload diretto su R2                                       */
/* ------------------------------------------------------------------ */

export async function presignUpload(
  env: CloudflareEnv,
  { fileName, contentType, sizeBytes, advertiserId }: {
    fileName: string;
    contentType: string;
    sizeBytes?: number;
    advertiserId: string;
  }
): Promise<{ uploadUrl: string; fileKey: string; error?: string }> {
  const validation = validateFileUpload({ fileName, mimeType: contentType, sizeBytes });
  if (!validation.valid) {
    return { uploadUrl: '', fileKey: '', error: validation.error };
  }

  const fileKey = generateFileKey(fileName, advertiserId);

  // In R2 il presign viene gestito tramite URL firmato o upload diretto.
  // Qui restituiamo l'URL di put diretto + fileKey; il client carica con PUT.
  const base = (env as any).ADS_R2?.bucket?.name ?? 'have2want-ads';
  const uploadUrl = `https://${base}.r2.cloudflarestorage.com/${fileKey}`;

  return { uploadUrl, fileKey };
}

/* ------------------------------------------------------------------ */
/* Pulizia R2: elimina file di campagne scadute dopo +7 giorni        */
/* ------------------------------------------------------------------ */

export async function cleanupExpiredR2Files(env: CloudflareEnv, now: number): Promise<number> {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const cutoff = now - sevenDaysMs;

  let deleted = 0;

  // Elenca tutti gli oggetti nella cartella ads/uploads/
  const listed = await env.ADS_R2.list({ prefix: 'ads/uploads/', limit: 1000 });
  for (const obj of listed.objects) {
    // La chiave contiene advertiserId/timestamp_nomefile
    // Estraggo il timestamp dalla chiave (formato: .../TIMESTAMP_nome)
    const parts = obj.key.split('/');
    const fileName = parts[parts.length - 1];
    const tsMatch = fileName.match(/^(\d+)_/);
    if (!tsMatch) continue;
    const fileTs = parseInt(tsMatch[1], 10);
    if (fileTs < cutoff) {
      await env.ADS_R2.delete(obj.key);
      deleted++;
    }
  }

  return deleted;
}
