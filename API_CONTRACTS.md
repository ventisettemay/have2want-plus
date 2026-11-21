# HAVE2WANT PLUS - API Contracts per AI Studio

**Versione:** 1.0 (BLOCCO 1 - Sicurezza e Pagamenti Pi Network)
**Branch:** `kilo/falling-breeze-kdw`
**Commit:** `d83bb4c` (precedente) → nuovo commit dopo BLOCCO 1
**Base URL:** `/api` (stesso dominio/origine, CORS configurato via `ALLOWED_ORIGINS`)

---

## 1. Autenticazione e Identità

### POST `/api/auth/firebase-token`
**Scopo:** Scambia un Pi Pioneer `accessToken` per un Firebase Custom Token.

**Autenticazione:** `Authorization: Bearer <pi_access_token>` (obbligatorio)

**Request:**
```json
{}
```

**Response 200:**
```json
{
  "success": true,
  "customToken": "eyJhbGciOiJSUzI1NiIs...",
  "firebaseUid": "piuser_123",
  "piUid": "PiUser.001",
  "username": "marco_pi"
}
```

**Errori:**
- `401` - `accessToken` mancante o non valido (`/v2/me` fallito)
- `503` - `FIREBASE_SERVICE_ACCOUNT` non configurata server-side

**Note:** Richiede `FIREBASE_SERVICE_ACCOUNT_JSON` (o `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`) nelle variabili d'ambiente server.

---

## 2. Configurazione Pi Network

### GET `/api/pi/config`
**Scopo:** Espone lo stato di configurazione Pi lato server (usato dal frontend per decidere modalità).

**Response 200:**
```json
{
  "sandbox": true,
  "serverConfigured": true,
  "mode": "live_pi_api",
  "firebaseCustomAuthConfigured": true,
  "idempotencyScope": "firestore_global",
  "a2uHorizonSigningConfigured": false
}
```

**Campi:**
- `mode`: `"live_pi_api"` | `"structured_fallback"` | `"unconfigured"`
- `idempotencyScope`: `"d1_global"` | `"firestore_global"` | `"local_file"` | `"edge_cache_pop"` | `"in_memory"`

---

## 3. Pagamenti Pi (Server-Side Verification)

### POST `/api/pi/approve`
**Scopo:** Approvazione server-side di un pagamento Pi creato dal client (`Pi.createPayment` → `onReadyForServerApproval`).

**Autenticazione:** Nessuna (usa `PI_API_KEY` server-side)

**Rate Limit:** 30 req/min per IP (header `X-RateLimit-*`)

**Request:**
```json
{
  "paymentId": "pay_abc123"
}
```

**Validazione:** `paymentId` alfanumerico + `_.:-`, 3-128 caratteri.

**Response 200 (live):**
```json
{
  "approved": true,
  "paymentId": "pay_abc123",
  "mode": "live_pi_api",
  "payment": { /* risposta Pi API */ },
  "timestamp": "2026-11-21T10:00:00.000Z"
}
```

**Errori:**
- `400` - `paymentId` mancante/non valido
- `409` - Pagamento già completato (idempotenza `complete_pay:{paymentId}`)
- `503` - `PI_API_KEY` non configurata (**FAIL-CLOSED**, nessun fallback success)
- `502` - Errore connessione Pi Network
- `429` - Rate limit superato

---

### POST `/api/pi/complete`
**Scopo:** Completamento server-side con `txid` blockchain reale (dopo `onReadyForServerCompletion` client-side).

**Autenticazione:** Nessuna (usa `PI_API_KEY` server-side)

**Rate Limit:** 30 req/min per IP

**Request:**
```json
{
  "paymentId": "pay_abc123",
  "txid": "stellar_tx_hash_real"
}
```

**Validazione:** Entrambi campi obbligatori, stesso formato `paymentId`.

**Idempotenza:** Doppia chiave:
- `complete_pay:{paymentId}` - previene doppio completamento stesso pagamento
- `complete_txid:{txid}` - previene riutilizzo stesso `txid`

**Response 200 (live):**
```json
{
  "completed": true,
  "paymentId": "pay_abc123",
  "txid": "stellar_tx_hash_real",
  "mode": "live_pi_api",
  "idempotencyScope": "firestore_global",
  "payment": { /* risposta Pi API */ },
  "timestamp": "2026-11-21T10:00:00.000Z"
}
```

**Errori:**
- `400` - Campi mancanti/non validi
- `409` - Pagamento già completato / `txid` già usato / pagamento annullato su Pi
- `503` - `PI_API_KEY` non configurata (**FAIL-CLOSED**)
- `502` - Errore connessione Pi Network
- `429` - Rate limit superato

---

### POST `/api/pi/withdraw`
**Scopo:** Prelievo App-to-User (A2U) Pi Network con firma Ed25519/XDR su Horizon.

**Autenticazione:** `Authorization: Bearer <pi_access_token>` (obbligatorio se `PI_API_KEY` configurata)

**Header:** `Idempotency-Key` **obbligatorio** (prevent duplicate withdrawals)

**Rate Limit:** 30 req/min per IP

**Request:**
```json
{
  "requestedPi": 5.0,
  "walletAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "pioneerUsername": "@pioneer_name",
  "uid": "PiUser.001",
  "idempotencyKey": "unique_client_generated_key"
}
```

**Validazione:**
- `requestedPi`: 0.50 - 100.00 π
- `walletAddress`: stringa 6-128 caratteri (chiave pubblica Stellar/Pi `G...`)
- `uid`: formato Pi Pioneer valido
- `Idempotency-Key`: header o body, obbligatorio

**Prerequisiti server (LIVE):**
- `PI_API_KEY`
- `PI_WALLET_PUBLIC_KEY` (formato `G...` 56 char)
- `PI_WALLET_SEED` (formato `S...` 56 char)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (per verifica saldo punti)

**Response 200 (live, successo):**
```json
{
  "success": true,
  "completed": true,
  "mode": "live_pi_api",
  "stage": "a2u_completed_on_chain",
  "paymentId": "pay_xyz789",
  "txHash": "real_horizon_txid",
  "ledger": 123456,
  "netPiSent": 4.99,
  "feeDeducted": 0.01,
  "walletAddress": "GXXXX...",
  "timestamp": "2026-11-21T10:00:00.000Z",
  "idempotencyScope": "d1_global"
}
```

**Errori LIVE:**
- `400` - Importo/indirizzo non validi / `Idempotency-Key` mancante
- `401` - `uid`/`accessToken` mancanti o non validi / sessione Pi scaduta
- `403` - `uid` non corrisponde a `/v2/me` (anti-spoofing)
- `409` - `Idempotency-Key` già processata / saldo punti insufficiente
- `501` - `PI_WALLET_SEED`/`PUBLIC_KEY` mancanti (firma Horizon non configurata)
- `502` - Errore Pi Platform API / Horizon
- `503` - `PI_API_KEY` non configurata in produzione
- `429` - Rate limit superato

**Errori DEV (senza PI_API_KEY):**
- `501` - **FAIL-CLOSED**: nessun fallback simulato, errore esplicito

---

## 4. Wallet Points (Firestore Sync)

### POST `/api/wallet/points`
**Scopo:** Sincronizzazione atomica punti wallet su Firestore (server-authoritative).

**Autenticazione:** **Una** delle due:
- `Authorization: Bearer <pi_access_token>` (verifica via Pi `/v2/me`)
- `X-Firebase-Token: <firebase_id_token>` (verifica via Firebase Auth REST)

**Request:**
```json
{
  "walletId": "pi_piuser_123",
  "pointsDelta": 120,
  "merchantPiDelta": 0,
  "actionType": "REAL_LISTING_VERIFIED",
  "description": "Annuncio reale verificato",
  "txId": "rew_unique_123",
  "piPaymentId": "pay_abc123",  // obbligatorio se merchantPiDelta > 0
  "pioneerUsername": "@pioneer",
  "pioneerWalletAddress": "GXXXX..."
}
```

**Validazione server-side (autoritative):**
- `actionType` deve essere in `SERVER_EARN_ACTION_RATES` o azione spend autorizzata
- `pointsDelta` calcolato server-side per earn actions (ignora client)
- `merchantPiDelta > 0` richiede `piPaymentId` verificato in `pi_idempotency`
- `txId` deduplicato via history wallet (nessun doppio accredito)

**Response 200:**
```json
{
  "success": true,
  "synced": true,
  "deduplicated": false,
  "pointsBalance": 240,
  "totalPointsEarned": 240,
  "merchantPiBalance": 0,
  "appliedPointsDelta": 120
}
```

**Errori:**
- `401` - Token mancante/non valido
- `403` - Tentativo modifica wallet altrui
- `400` - Azione non autorizzata / saldo insufficiente / `piPaymentId` mancante
- `503` - `FIREBASE_SERVICE_ACCOUNT_JSON` non configurata
- `502` - Errore Firestore REST API

---

## 5. Health & Utils

### GET `/api/health`
**Response 200:**
```json
{
  "status": "ok",
  "validationKeyAvailable": true,
  "piApiConfigured": true,
  "piMode": "live_pi_api",
  "firebaseCustomAuthConfigured": true,
  "idempotencyScope": "firestore_global",
  "a2uHorizonSigningConfigured": false
}
```

### GET `/validation-key.txt` | `/.well-known/validation-key.txt`
**Response 200:** Chiave di validazione Pi Network (text/plain, 128 char)

### GET `/api/weather/rainviewer`
**Response 200:** Proxy CORS per `https://api.rainviewer.com/public/weather-maps.json` (cache 2 min)

### GET `/api/weather/rainviewer/tile?url=...` | `?path=...`
**Response 200:** Proxy tile immagine (solo domini `tilecache.rainviewer.com` / `api.rainviewer.com`)

---

## 6. Variabili d'Ambiente Richieste (Server/Worker)

| Variabile | Obbligatoria | Descrizione |
|-----------|-------------|-------------|
| `PI_API_KEY` | **SÌ** (per pagamenti reali) | Secret key Pi Platform API (da Developer Portal) |
| `PI_WALLET_PUBLIC_KEY` | **SÌ** (per A2U) | Chiave pubblica Stellar/Pi `G...` 56 char |
| `PI_WALLET_SEED` | **SÌ** (per A2U) | Chiave segreta Stellar/Pi `S...` 56 char |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **SÌ** (per Auth/Firestore) | JSON completo Service Account Firebase |
| `FIREBASE_WEB_API_KEY` | SÌ (per verify Firebase ID token) | Web API Key Firebase project |
| `VITE_PI_SANDBOX` | No (`"true"`/`"false"`) | Modalità Testnet vs Mainnet |
| `ALLOWED_ORIGINS` | No | Origini CORS permesse per API protette (comma-separated) |
| `DB` | No (Worker) | Binding Cloudflare D1 per idempotenza globale |

**Senza `PI_API_KEY`:** Tutti gli endpoint `/api/pi/*` restituiscono `503` (approve/complete) o `501` (withdraw) con `mode: "unconfigured"`. **Nessun fallback success simulato.**

**Senza `FIREBASE_SERVICE_ACCOUNT_JSON`:** `/api/auth/firebase-token` → `503`, `/api/wallet/points` → `503`.

---

## 7. Header Comuni

| Header | Descrizione |
|--------|-------------|
| `Authorization: Bearer <token>` | Pi accessToken o Firebase ID token |
| `Idempotency-Key: <uuid>` | Obbligatorio per `/api/pi/withdraw`, consigliato per operazioni mutanti |
| `X-Firebase-Token: <id_token>` | Alternativa ad Authorization per `/api/wallet/points` |
| `X-RateLimit-Limit` | Limite richieste (default 30) |
| `X-RateLimit-Remaining` | Richieste rimanenti nella finestra |
| `X-RateLimit-Reset` | Unix timestamp reset finestra |
| `Access-Control-Allow-Origin` | Configurato via `ALLOWED_ORIGINS` per API protette |

---

## 8. Contratti di Sicurezza per AI Studio

1. **Non chiamare mai** `/api/pi/approve` o `/api/pi/complete` senza aver prima creato il pagamento via `Pi.createPayment` client-side.
2. **Usare sempre** `Idempotency-Key` univoco (UUID v4) per `/api/pi/withdraw`.
3. **Gestire** `409` (duplicate) e `429` (rate limit) con retry exponential backoff.
4. **Non assumere** successo: verificare sempre `approved: true` / `completed: true` / `success: true` nella response.
5. **In dev senza credenziali:** aspettarsi `503`/`501` con `mode: "unconfigured"` — non è un bug, è fail-closed.
6. **Wallet points:** il frontend **non decide** `pointsDelta` per earn actions; il server usa `SERVER_EARN_ACTION_RATES`.

---

## 9. Changelog BLOCCO 1

| Endpoint | Modifica |
|----------|----------|
| `/api/pi/approve` | Fail-closed 503 senza `PI_API_KEY` (era 200 fallback) |
| `/api/pi/complete` | Fail-closed 503 senza `PI_API_KEY` (era 200 fallback) |
| `/api/pi/withdraw` | Fail-closed 501/503 senza credenziali complete (era 200 fallback dev) |
| Tutti `/api/pi/*` | Rate limiting 30/min/IP + validazione Content-Type |
| Tutti `/api/pi/*` | Audit logging `[AUDIT]` per richieste, successi, errori, duplicati |
| `/api/auth/firebase-token` | Validazione stretta token Pi, 503 senza Firebase SA |
| `/api/wallet/points` | Anti-spoofing UID, punti authoritative server-side |

---

*Documento generato automaticamente dal completamento BLOCCO 1. Aggiornare ad ogni modifica incompatibile.*