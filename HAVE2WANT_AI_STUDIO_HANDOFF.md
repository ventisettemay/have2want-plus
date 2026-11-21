# HAVE2WANT PLUS — HANDOFF PER AI STUDIO

**Data:** 21/11/2026
**Repository ufficiale:** https://github.com/ventisettemay/have2want-plus.git
**Branch di lavoro:** `kilo/turbo-lark-8wz`
**Commit codice:** `058f4ce` — `feat: consolida il progetto sul territorio 3D e attiva economia e servizi reali`
**Merge:** `8e8c827` — integra il commit remoto `573004a` (rinomina `SalvavatuttoArchive`, `SATELLITE_TO_CHANNEL`)
**HEAD del branch:** `8e8c827`
**Branch base:** `kilo/turbo-lark-8wz` (non creare repository paralleli)

> **Istruzione operativa per AI Studio:** aggiornare il progetto esistente a partire da questo repository GitHub. **Non ricaricare, duplicare o ricreare file già presenti.** Importare solo ciò che manca, lavorando su un branch dedicato e aprendo una PR verso `kilo/turbo-lark-8wz`.

---

## 1. Stato del repository

| Voce | Valore |
|---|---|
| Cartella progetto | `/workspace/app` |
| Stack | React 19, Vite 6, TypeScript, Three.js, MapLibre GL |
| Entry point | `src/main.tsx` → `src/App.jsx` |
| Backend | `server.ts` (Express), build `dist/server.cjs` |
| Database | Firestore (`firebase.ts`, `firestoreService.ts`, `firestore.rules`) + `flat_database.json` |
| Vista iniziale | `GLOBO` (`App.jsx:334–343`) |
| Tre viste | `GLOBO` · `URBANO_3D` · `BACHECA` |
| Comandi | `bun run build` · `npx tsc --noEmit` · `node ./node_modules/vitest/vitest.mjs run --pool=forks --no-file-parallelism` |

**Esito verifiche del commit `058f4ce`:**

- `bun run build` → **OK** (2427 moduli, `dist/server.cjs` generato).
- `npx tsc --noEmit` → **0 errori**.
- Test unitari → **60/60 passati**, 9 file su 10. `tests/app_render.test.tsx` non è eseguibile in sandbox per **OOM del worker** (limite noto, non regressione).

---

## 2. File modificati in questo intervento

| File | Modifica |
|---|---|
| `src/types.ts` | Rimossi `planetId` e `satelliteId` dal listing |
| `src/data.ts` | Rimossi 50 righe con riferimenti a pianeti/satelliti |
| `src/App.jsx` | Navigazione dell'assistente verso viste territoriali; ricerca globale propagata alla bacheca |
| `src/components/DiscreetAIAssistant.tsx` | `onNavigateToPlanet` → `onNavigate`; target `bacheca`/`mappa`/`salvavatutto`/`pi-hub` |
| `src/components/CreateListingModal.tsx` | Rimossi campi cosmici; premio `REAL_LISTING_BASIC` per annunci reali |
| `src/components/HomeFeedView.tsx` | Rimossi campi cosmici; ricerca globale; costo 2 punti; premio `REAL_LISTING_BASIC`; conteggio prodotti dinamico; prezzo Pi da fonte unica |
| `src/components/have2want/Globo3D.jsx` | Corretto `setSatelliteState` → `setSatelliteActive`; id satellite |
| `src/components/have2want/OrbitalSatellitesHub.tsx` | Collegato al motore satelliti: ON/OFF reali per 8 satelliti, badge meteo, avvio canali, nuovo canale Agenzie |
| `src/components/have2want/MapView3DContainer.jsx` | Scadenza automatica delle vetrine sponsorizzate; prezzo Pi da fonte unica |
| `src/components/have2want/BusinessSponsorModal.jsx` | Addebito reale del prezzo pubblicitario dal credito esercente |
| `src/components/have2want/PioneerRewardsHubModal.tsx` | Ricarica del credito esercente (Punti → π) |
| `src/components/have2want/VetrinaKmZero.tsx` | Corretto il bypass del saldo: niente pubblicazione gratuita |
| `src/components/have2want/Urbano3D.jsx` | Selettore Auto/Piedi/Bici; prezzo Pi da fonte unica |
| `src/components/have2want/ListingDetailModal.tsx` | Prezzo Pi da fonte unica |
| `src/components/have2want/LocalCurrencyModal.jsx` | Prezzo Pi da fonte unica |
| `src/components/have2want/WorldNavigatorModal.jsx` | Prezzo Pi da fonte unica |
| `src/lib/h2wContext.tsx` | Aggiunto `spendMerchantPi` per spese dal saldo esercente |
| `src/lib/worldAtlas.ts` | Prezzo Pi da fonte unica (8 occorrenze) |
| `src/components/PiPaymentModal.tsx` | Testo "Pianeta Vita" → "bacheca territoriale" |
| `src/components/have2want/AppTutorModal.tsx` | Testo "pianeta" → "territorio" |
| `src/components/MicroWorldModal.tsx` | **Eliminato** (643 righe, 0 importatori, conteneva "Albero Millenario della Vita") |
| `src/components/SalvavatuttoPlanet.tsx` → `SalvavatuttoArchive.tsx` | Rinomina da integrare dal commit remoto `573004a` (archivio territoriale, non pianeta) |

---

## 3. Componenti e servizi già presenti da riutilizzare

### 3.1 Cuore territoriale
- `src/components/have2want/Globo3D.jsx` — globo Three.js, orbite, 8 satelliti, marker, meteo 3D.
- `src/components/have2want/Urbano3D.jsx` — mappa MapLibre, marker, percorso, meteo.
- `src/components/have2want/MapView3DContainer.jsx` — orchestratore delle viste e delle modali.
- `src/lib/territoryHierarchy.ts` — gerarchia Mondo → Stato → Regione → Provincia → Comune.
- `src/lib/geoPrivacy.js` — centroide comunale, raggio 2,0–2,5 km, `filterVisibleListings`.
- `src/components/have2want/WorldNavigatorModal.jsx` — ricerca globale di luoghi via Nominatim.

### 3.2 Servizi reali
- `src/lib/routingService.ts` — `calculateRealRoute` OSRM, profili `driving` / `walking` / `cycling`, passi in italiano, fallback geodetico.
- `src/lib/weatherService.js` — Open-Meteo + RainViewer radar.
- `src/components/have2want/StreetView360Modal.tsx` — Panoramax 360°, Nominatim reverse geocoding, navigazione a piedi/auto.
- `src/lib/globalProductsCatalog.ts` — 14 prodotti affiliati (7 eBay + 7 AliExpress), wallet configurabile.
- `src/components/have2want/GlobalMarketplaceView.tsx` — marketplace esterno, distinto dal globo commerciale.
- `src/components/have2want/MerchantDetailModal.tsx` — scheda esercente con pin `DOUBLE_RING` / `PI_ACCEPTED` / `AD_ONLY`.
- `src/lib/merchantPinClassifier.ts` — classificazione dei pin.

### 3.3 Economia
- `src/lib/communityRewardsService.ts` — punti, premi, prelievi, credito esercente, `adStreamEnabled`.
- `src/lib/h2wContext.tsx` — listino 20/120/475 π, sconto 50% (10/60/237,5), `spendMerchantPi`.
- `src/lib/countryAdvertisingPricing.ts` — listino 11 Stati, prezzo per viste.
- `src/lib/piRealPriceService.ts` — prezzo Pi di riferimento, cache browser, `PI_REAL_PRICE_EUR`.
- `src/lib/piSdkService.ts` — SDK Pi + fallback web.
- `server.ts` — endpoint `/api/pi/approve`, `/api/pi/complete`, `/api/pi/withdraw`.

### 3.4 Interfaccia
- `src/components/have2want/OrbitalSatellitesHub.tsx` — canali territoriali + ON/OFF 8 satelliti.
- `src/components/have2want/SpacecraftInspectorModal.tsx` — ispezione 3D e controlli flotta.
- `src/components/have2want/PioneerRewardsHubModal.tsx` — premi, prelievo, ricarica esercente.
- `src/components/have2want/BusinessSponsorModal.jsx` — vetrina pubblicitaria a pagamento.
- `src/components/have2want/VetrinaKmZero.tsx`, `BachecaLavoroP2P.tsx`, `VetrinaAgenziePaywall.tsx`.
- `src/components/LegalWelcomeShield.tsx` — consenso legale a 5 clausole.
- `src/components/AbuseReportModal.tsx` — segnalazione abusi.

---

## 4. Componenti eliminati da NON ricreare

Questi elementi facevano parte del vecchio sistema cosmologico o di moduli mai collegati. **Non vanno reintrodotti.**

- `RealisticCosmicUniverse`, `VitaPlanet`, `PossibilitaPlanet`, `SalvavatuttoPlanet` (versione pianeta), `TreeOfLifeExplorer`, `CosmicExpeditionHub`
- `LivingCityExplorer`, `VisualVillageView`, `VillageBuildingView`
- `GeographicMapBridge`, `PiOfficialBridge`
- `AdStreamManager` (pubblicità automatica mai collegata)
- `PrivacyGate` (sostituito da `LegalWelcomeShield`)
- `LegalShieldAndModeration` (sostituito da `AbuseReportModal`)
- `SupermarketGlobaleH2W`, `SupermarketMondo`
- `AdPublishModal`, `EmergencyBeacon`, `BazaarInteriorView`
- `base44` / `base44Client`
- `DigitalHandshakeModal` (sostituito da `StrettaDiMano`)
- `MicroWorldModal` (eliminato in questo intervento)

**Il centro del progetto è il Globo 3D territoriale. Non reintrodurre pianeti, soli o alberi.**

---

## 5. Funzioni completate

1. **Ricerca globale** — l'header alimenta sia la mappa sia la bacheca (`HomeFeedView` riceve `globalSearchQuery`).
2. **Satelliti** — 8 ID reali, ON/OFF persistente, preset, avvio canali, badge meteo sincronizzato.
3. **Vetrina sponsorizzata** — addebito effettivo di `currentPricePi` dal credito esercente; blocco con saldo insufficiente; scadenza 7 giorni applicata.
4. **Credito esercente** — ricarica dall'Hub Ricompense (1.000 punti = 1 π).
5. **Premi annuncio** — `REAL_LISTING_BASIC` accreditato alla pubblicazione reale.
6. **Costo pubblicazione** — 2 punti nel modulo principale e nel secondo modulo bacheca.
7. **Prezzo Pi** — unica fonte `PI_REAL_PRICE_EUR`, nessun valore duplicato.
8. **Navigatore** — Auto / Piedi / Bici con OSRM reale.
9. **Canale Agenzie** — `VetrinaAgenziePaywall` raggiungibile dai Canali Territoriali.
10. **Conteggio prodotti** — 14, derivato dal catalogo.

---

## 6. Funzioni ancora da implementare

| # | Funzione | Stato | File di riferimento |
|---|---|---|---|
| 1 | **Pi Ads ufficiali** (`Pi.Ads`, interstitial, rewarded) | assente | `src/components/have2want/AdRewardHub.jsx`, `PioneerRewardsHubModal.tsx` |
| 2 | **Verifica pagamenti server-side** con autenticazione e chiave API | endpoint senza auth, fallback `success:true` | `server.ts:110–303`, `src/lib/piSdkService.ts:237–250` |
| 3 | **Firebase Auth e regole per-utente** | regole aperte in lettura | `firestore.rules`, `src/lib/firebase.ts` |
| 4 | **Gemini server-side** | 0 import di `@google/genai` | `metadata.json`, `src/lib/testnetEngine.ts` |
| 5 | **Stella delle Possibilità** | assente | `src/components/DiscreetAIAssistant.tsx` |
| 6 | **Salvavatutto con ricerca semantica** | presente solo `SalvavatuttoArchive` con ricerca testuale | `src/components/SalvavatuttoArchive.tsx` |
| 7 | **Scadenza annunci 30 giorni** | `ListingExpiryManager` 0 importatori, lifecycle simulato | `src/components/ListingExpiryManager.tsx` |
| 8 | **Ricerca globale unificata** | `GlobalSearchBar.tsx` 0 importatori | `src/components/GlobalSearchBar.tsx` |
| 9 | **Webcam pubbliche in VIEW** | presente Panoramax 360°, manca catalogo webcam | `src/components/have2want/StreetView360Modal.tsx` |
| 10 | **Traffico e ricalcolo percorso** | routing base, nessun traffico | `src/lib/routingService.ts` |
| 11 | **Meteo lungo il percorso** | meteo separato, non integrato nel navigatore | `src/lib/weatherService.js` |
| 12 | **Eco-fee / Pro-Tools / badge** | assenti | `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md:202–219` |
| 13 | **Donazioni "Pasto Sospeso"** | assente | `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md:216` |
| 14 | **Contabilità commissioni USDT** | assente | `src/lib/globalProductsCatalog.ts` |

---

## 7. Architettura e dipendenze effettive

```
src/
├── main.tsx                  → H2WProvider + App
├── App.jsx                   → stato globale, viste GLOBO / URBANO_3D / BACHECA
├── components/
│   ├── have2want/
│   │   ├── Globo3D.jsx               (Three.js, satelliti, meteo 3D)
│   │   ├── Urbano3D.jsx              (MapLibre, percorso, meteo)
│   │   ├── MapView3DContainer.jsx    (orchestratore + modali)
│   │   ├── OrbitalSatellitesHub.tsx  (canali + ON/OFF 8 satelliti)
│   │   ├── SpacecraftInspectorModal.tsx
│   │   ├── BusinessSponsorModal.jsx  (vetrina a pagamento)
│   │   ├── PioneerRewardsHubModal.tsx(prelievi + ricarica esercente)
│   │   ├── VetrinaKmZero.tsx / BachecaLavoroP2P.tsx / VetrinaAgenziePaywall.tsx
│   │   ├── GlobalMarketplaceView.tsx (14 prodotti affiliati)
│   │   ├── StreetView360Modal.tsx    (Panoramax + OSRM)
│   │   └── ...
│   ├── HomeFeedView.tsx              (bacheca, ricerca, creazione annunci)
│   ├── CreateListingModal.tsx        (pubblicazione a punti)
│   ├── DiscreetAIAssistant.tsx       (assistente locale)
│   ├── LegalWelcomeShield.tsx        (consenso 5 clausole)
│   └── AbuseReportModal.tsx
├── lib/
│   ├── h2wContext.tsx                (punti, listino, credito esercente)
│   ├── communityRewardsService.ts    (premi, prelievi, adStreamEnabled)
│   ├── countryAdvertisingPricing.ts  (listino pubblicitario)
│   ├── piRealPriceService.ts         (prezzo Pi, cache)
│   ├── piSdkService.ts               (SDK Pi + fallback)
│   ├── routingService.ts             (OSRM auto/piedi/bici)
│   ├── weatherService.js             (Open-Meteo + RainViewer)
│   ├── geoPrivacy.js                 (centroide, 2,0–2,5 km)
│   ├── territoryHierarchy.ts         (5 livelli)
│   ├── globalProductsCatalog.ts      (14 prodotti)
│   ├── satelliteModularEngine.ts     (8 satelliti + 7 preset)
│   └── ...
├── data.ts / categories.ts           (listing demo, 9 categorie)
└── types.ts                          (3 intenti, listing, pioniere)
server.ts                             (Express: /api/pi/*, /api/health)
firestore.rules                       (regole Firestore)
```

**Dipendenze esterne usate a runtime:** OSRM (`router.project-osrm.org`), Open-Meteo, RainViewer, Nominatim, Panoramax, Pi SDK, Firestore. Nessuna chiave privata nel repository.

---

## 8. Istruzioni precise per AI Studio

1. **Partire dal repository ufficiale**, branch `kilo/turbo-lark-8wz` (o da un branch derivato).
2. **Non creare un nuovo progetto e non ricaricare file già presenti.** Usare GitHub come unica fonte.
3. **Non reintrodurre** i componenti elencati al §4.
4. **Non modificare** le specifiche economiche decise: listino 20/120/475 π, sconto 50% se accetta Pi, Quota X 0,15 π, punti 1.000:1, min prelievo 0,50 π, fee 0,01 π.
5. **Conservare** le funzioni già complete (globo, mappa, bacheca, satelliti, routing, meteo, vetrine, ricompense).
6. **Completare** solo le voci del §6, nell'ordine di priorità:
   - Pi Ads reali e verifica pagamenti;
   - Firebase Auth + regole;
   - Gemini server-side;
   - Stella delle Possibilità;
   - Salvavatutto semantico;
   - scadenza annunci;
   - webcam e traffico;
   - eco-fee / Pro-Tools / badge / donazioni;
   - contabilità USDT.
7. **Non sostituire funzioni reali con simulazioni.** Se un servizio esterno non è disponibile, dichiararlo nell'interfaccia invece di mostrare dati finti come reali.
8. **Verifiche minime prima di ogni consegna:**
   ```
   bun run build
   npx tsc --noEmit
   node ./node_modules/vitest/vitest.mjs run --pool=forks --no-file-parallelism
   ```
   Nota: `tests/app_render.test.tsx` può andare in OOM in ambienti con poca memoria; non è un errore del codice.
9. **Commit chiari** e PR verso `kilo/turbo-lark-8wz`.

---

## 9. Cosa NON fare

- Non creare repository paralleli o copie di `have2want-plus`.
- Non reintrodurre il sistema Sole / Pianeti / Albero della Vita.
- Non aggiungere commissioni, prezzi, abbonamenti o valute non previste.
- Non dichiarare funzionante una funzione non verificata.
- Non sovrascrivere le modifiche di Kilo senza confrontarle con il codice.
- Non inserire chiavi API nel repository.

---

## 10. Riferimenti

- Repository: https://github.com/ventisettemay/have2want-plus.git
- Branch: `kilo/turbo-lark-8wz`
- Commit codice: `058f4ce`
- Merge: `8e8c827` (HEAD del branch)
- Documenti di specifica nel repository: `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md`, `specifiche_tecniche_progetto.md`, `CERTIFICATE_OF_AUTHORSHIP.md`.
- Report di verifica (solo lettura): `/artifacts/HAVE2WANT_FOTOGRAFIA_FEDELE.md`.