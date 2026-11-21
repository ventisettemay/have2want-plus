# HAVE2WANT PLUS - API Contracts per AI Studio

**Versione:** 2.0 (BLOCCO 1-5 completati)
**Branch:** `kilo/falling-breeze-kdw`
**Commit:** `80f78bc` (BLOCCO 5)
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

**Errori:** `400` (paymentId non valido), `409` (duplicato), `503` (PI_API_KEY mancante - FAIL-CLOSED), `502` (errore connessione), `429` (rate limit)

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

**Errori:** `400`, `409` (duplicato paymentId/txid, annullato), `503` (FAIL-CLOSED), `502`, `429`

---

### POST `/api/pi/withdraw`
**Scopo:** Prelievo App-to-User (A2U) Pi Network con firma Ed25519/XDR su Horizon.

**Autenticazione:** `Authorization: Bearer <pi_access_token>` (obbligatorio se `PI_API_KEY` configurata)

**Header:** `Idempotency-Key` **obbligatorio**

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

**Response 200 (live):**
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

---

## 4. Wallet Points (Firestore Sync)

### POST `/api/wallet/points`
**Scopo:** Sincronizzazione atomica punti wallet su Firestore (server-authoritative).

**Autenticazione:** `Authorization: Bearer <pi_access_token>` **OR** `X-Firebase-Token: <firebase_id_token>`

**Request:**
```json
{
  "walletId": "pi_piuser_123",
  "pointsDelta": 120,
  "merchantPiDelta": 0,
  "actionType": "REAL_LISTING_VERIFIED",
  "description": "Annuncio reale verificato",
  "txId": "rew_unique_123",
  "piPaymentId": "pay_abc123"
}
```

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

---

## 5. Chat P2P

### POST `/api/chats`
**Scopo:** Crea o recupera chat P2P tra due utenti (ID deterministico ordinato).

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Request:**
```json
{
  "participant2Uid": "PiUser.002",
  "listingId": "item_123"
}
```

**Response 200/201:**
```json
{
  "success": true,
  "chatId": "pi_user_001_pi_user_002",
  "existing": false
}
```

---

### GET `/api/chats`
**Scopo:** Lista chat dell'utente autenticato.

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Response 200:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "pi_user_001_pi_user_002",
      "participant1Uid": "pi_user_001",
      "participant2Uid": "pi_user_002",
      "lastMessageAt": "2026-11-21T10:00:00.000Z",
      "lastMessagePreview": "Ciao, come va?",
      "unreadCount": 2
    }
  ]
}
```

---

### GET `/api/chats/:chatId/messages`
**Scopo:** Recupera messaggi di una chat.

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Response 200:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_123",
      "chatId": "pi_user_001_pi_user_002",
      "senderUid": "pi_user_001",
      "content": "Ciao!",
      "type": "text",
      "timestamp": "2026-11-21T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/chats/:chatId/messages`
**Scopo:** Invia messaggio in chat (testo, nota vocale, sistema).

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Request:**
```json
{
  "content": "Ciao!",
  "type": "voice",
  "voiceNoteUrl": "https://storage.example.com/voice_123.webm",
  "voiceDurationSec": 14
}
```

**Response 201:**
```json
{
  "success": true,
  "messageId": "msg_1234567890"
}
```

---

## 6. WebRTC Videochiamate

### POST `/api/calls`
**Scopo:** Crea una chiamata WebRTC (status: `ringing`).

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Request:**
```json
{
  "calleeUid": "PiUser.002",
  "listingId": "item_123"
}
```

**Response 201:**
```json
{
  "success": true,
  "callId": "call_1234567890_abc123"
}
```

---

### POST `/api/calls/:callId/signal`
**Scopo:** Invia signaling WebRTC (offer, answer, ice-candidate).

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Request:**
```json
{
  "type": "offer",
  "payload": { "sdp": "...", "type": "offer" }
}
```

**Response 201:**
```json
{
  "success": true,
  "signalId": "sig_1234567890"
}
```

---

### GET `/api/calls/:callId/signaling`
**Scopo:** Recupera tutti i messaggi di signaling per una chiamata.

**Response 200:**
```json
{
  "success": true,
  "signals": [
    {
      "id": "sig_123",
      "callId": "call_123",
      "senderUid": "pi_user_001",
      "type": "offer",
      "payload": { "sdp": "...", "type": "offer" },
      "timestamp": "2026-11-21T10:00:00.000Z"
    }
  ]
}
```

---

### PATCH `/api/calls/:callId`
**Scopo:** Aggiorna stato chiamata.

**Request:**
```json
{
  "status": "connected",
  "durationSec": 120
}
```

---

## 7. Salvavatutto Guide

### POST `/api/guides`
**Scopo:** Crea nuova guida Salvavatutto.

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Request:**
```json
{
  "title": "Come riparare una gomma forata",
  "category": "Riparazione & Meccanica",
  "content": "Passaggi dettagliati...",
  "steps": ["Smonta la ruota", "Rimuovi la camera d'aria", "Trova il buco", "Applica la toppa", "Rimonta tutto"],
  "tags": ["bicicletta", "riparazione", "fai-da-te"],
  "author": "Mario Rossi",
  "readTimeMin": 5
}
```

**Response 201:**
```json
{
  "success": true,
  "guideId": "salv-1234567890"
}
```

---

### GET `/api/guides`
**Scopo:** Lista guide pubbliche (ordinate per lastUpdated desc).

**Response 200:**
```json
{
  "success": true,
  "guides": [
    {
      "id": "salv-123",
      "title": "Come riparare una gomma forata",
      "category": "Riparazione & Meccanica",
      "author": "Mario Rossi",
      "upvotes": 5,
      "readTimeMin": 5
    }
  ]
}
```

---

### POST `/api/guides/:guideId/upvote`
**Scopo:** Upvote atomico (+1) su una guida.

**Autenticazione:** `Authorization: Bearer <pi_access_token>`

**Response 200:**
```json
{
  "success": true,
  "upvotes": 6
}
```

**Errori:** `403` (auto-voto), `409` (conflitto, riprova)

---

## 8. Health & Utils

### GET `/api/health`
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
Chiave validazione Pi Network (text/plain, 128 char)

### GET `/api/weather/rainviewer`
Proxy CORS per `https://api.rainviewer.com/public/weather-maps.json` (cache 2 min)

### GET `/api/weather/rainviewer/tile?url=...` | `?path=...`
Proxy tile immagine (solo domini `tilecache.rainviewer.com` / `api.rainviewer.com`)

---

## 6. Variabili d'Ambiente Richieste

| Variabile | Obbligatoria | Descrizione |
|-----------|-------------|-------------|
| `PI_API_KEY` | **SÌ** (pagamenti reali) | Secret key Pi Platform API |
| `PI_WALLET_PUBLIC_KEY` | **SÌ** (per A2U) | Chiave pubblica Stellar/Pi `G...` 56 char |
| `PI_WALLET_SEED` | **SÌ** (per A2U) | Chiave segreta Stellar/Pi `S...` 56 char |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **SÌ** (Auth/Firestore) | JSON completo Service Account Firebase |
| `FIREBASE_WEB_API_KEY` | SÌ (verify Firebase ID token) | Web API Key Firebase project |
| `VITE_PI_SANDBOX` | No (`"true"`/`"false"`) | Modalità Testnet vs Mainnet |
| `ALLOWED_ORIGINS` | No | Origini CORS permesse (comma-separated) |
| `DB` | No (Worker) | Binding Cloudflare D1 per idempotenza globale |

**Senza `PI_API_KEY`:** Tutti `/api/pi/*` → `503`/`501` con `mode: "unconfigured"` (FAIL-CLOSED).
**Senza `FIREBASE_SERVICE_ACCOUNT_JSON`:** `/api/auth/firebase-token` → `503`, `/api/wallet/points` → `503`, nuove API → `503`.

---

## Header Comuni

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

## Contratti di Sicurezza per AI Studio

1. **Non chiamare mai** `/api/pi/approve` o `/api/pi/complete` senza aver prima creato il pagamento via `Pi.createPayment` client-side.
2. **Usare sempre** `Idempotency-Key` univoco (UUID v4) per `/api/pi/withdraw`.
3. **Gestire** `409` (duplicate) e `429` (rate limit) con retry exponential backoff.
4. **Non assumere** successo: verificare sempre `approved: true` / `completed: true` / `success: true`.
5. **In dev senza credenziali:** aspettarsi `503`/`501` con `mode: "unconfigured"` — è fail-closed.
6. **Wallet points:** il frontend **non decide** `pointsDelta` per earn actions; il server usa `SERVER_EARN_ACTION_RATES`.
7. **Chat:** `voiceNoteUrl` deve essere URL esterno (Firebase Storage/S3); backend non gestisce upload.
8. **WebRTC:** Solo STUN attivo; per produzione servono TURN (coturn, Twilio, Metered).
9. **Voice notes:** Frontend registra via MediaRecorder; carica su storage esterno e passa URL a `/api/chats/:chatId/messages`.
10. **Salvavatutto upvote:** Non auto-voto; retry su conflitto 409.

---

## Quota X - Valore Ufficiale
**`QUOTA_X_PERCENT = 0.25` (25% = 0.25π = 250 punti)**
- Frontend: PioneerRewardsHubModal `+250 Punti (~0.25 π)`, BachecaLavoroP2P "Candidati (0.25π)"
- Backend: `ECONOMIC_CONSTANTS.QUOTA_X_PERCENT = 0.25`

---

## Changelog (BLOCCO 1-5)

| Blocco | Modifiche principali |
|--------|---------------------|
| 1 | Pi payments fail-closed, idempotenza, rate limiting, audit logging |
| 2 | Firebase Auth unificato, Firestore rules, Service Account parsing unificato |
| 3 | `pi_payments` recording, formule economiche, merchant credits, community points |
| 4 | OpenAPI 3.0.3, Swagger UI, test contratti automatici (29 test) |
| 5 | Chat P2P, WebRTC signaling, Salvavatutto (guide + upvote), Quota X = 0.25π |

---

*Documento aggiornato al BLOCCO 5 (commit `80f78bc`).*