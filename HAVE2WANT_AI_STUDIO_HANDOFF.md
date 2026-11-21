# HAVE2WANT PLUS — HANDOFF PER AI STUDIO

**Data:** 21/11/2026
**Repository ufficiale:** https://github.com/ventisettemay/have2want-plus.git
**Branch di lavoro:** `kilo/turbo-lark-8wz`
**Commit precedenti:** `058f4ce` — `feat: consolida il progetto sul territorio 3D e attiva economia e servizi reali`
**Merge:** `8e8c827` — integra il commit remoto `573004a` (rinomina `SalvavatuttoArchive`, `SATELLITE_TO_CHANNEL`)
**Blocco pagamenti:** `c1d7266` — pagamenti Pi fail-closed, prelievo su conferma server
**Blocco meteo:** `74134f7` — meteo reale nel canale METEO_SAT, nessun fallback simulato
**Blocco satelliti:** `9823477` — collega gli 8 satelliti ai rispettivi servizi
**Blocco KM0:** `cb81525` — completa le schede esercente con contatti, posizione, prodotti e navigazione
**Blocco marketplace:** `0340cb9` — marketplace interno con ordini, regali e distinzione prodotti esterni
**Blocco VIEW/webcam:** `64f76fb` — completa VIEW/webcam e meteo lungo il percorso
**HEAD del branch:** `64f76fb`
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

**Esito verifiche del commit `64f76fb`:**

- `bun run build` → **OK** (`dist/server.cjs` generato).
- `npx tsc --noEmit` → **0 errori**.
- Test unitari → **71/71 passati** su 12 file. `tests/app_render.test.tsx` non è eseguibile in sandbox per **OOM del worker** (limite noto, non regressione). `tests/unified_system_and_radar.test.ts` può andare in OOM se eseguito in parallelo; eseguire singolarmente per confermare.
- Nota ambiente: in sandbox la suite completa può andare in OOM per memoria non sufficiente; gli stessi file passano se eseguiti singolarmente.

---

## 2. File modificati in questo intervento (da `058f4ce` a `64f76fb`)

| File | Modifica |
|---|---|
| `server.ts` | `/api/pi/approve` e `/api/pi/complete`: 503 senza `PI_API_KEY`; `/api/pi/withdraw`: 503 senza chiave, 401 senza `uid`, nessun `txHash` inventato |
| `src/lib/piSdkService.ts` | Rimossi i fallback `success:true`; il completamento è confermato solo se il server risponde OK |
| `src/lib/communityRewardsService.ts` | `executePiWithdrawal` scala punti solo dopo conferma del server |
| `src/lib/weatherService.js` | `getRealtimeWeather` restituisce `null` senza rete: nessun dato meteo simulato |
| `src/components/have2want/OrbitalSatellitesHub.tsx` | Canale METEO con `LiveWeatherModal` (Open-Meteo + RainViewer, fonte e orario); ON/OFF `METEO_SAT`; mappatura nuovi canali `WEBCAM` e `METEO_ROUTE` |
| `src/components/have2want/MapView3DContainer.jsx` | Canali `WEBCAM` (LiveWebcamModal) e `METEO_ROUTE` (MeteoNavigazioneModal); globo mostra solo annunci interni |
| `src/components/have2want/LiveWebcamModal.tsx` | **Nuovo** — catalogo webcam pubbliche/turistiche/commerciali/traffico con filtri, cache, dettaglio fullscreen |
| `src/components/have2want/MeteoNavigazioneModal.tsx` | **Nuovo** — meteo lungo percorso OSRM (auto/bici/piedi), campionamento punti, dati Open-Meteo reali |
| `src/components/have2want/MarketplaceOrderModal.tsx` | **Nuovo** — acquisto per sé o regalo con messaggio, pagamento via Pi SDK |
| `src/components/have2want/MarketplaceOrdersModal.tsx` | **Nuovo** — cronologia ordini (acquirente/venditore), riprova pagamento, annulla |
| `src/components/have2want/ListingDetailModal.tsx` | Pulsanti Acquista/Regala per annunci VENDO interni con prezzo Pi; `originType`, `intent` |
| `src/components/have2want/MerchantDetailModal.tsx` | Telefono e sito cliccabili, indirizzo, coordinate su OpenStreetMap, indicazioni stradali, sezione Prodotti & Servizi |
| `src/components/have2want/VetrinaKmZero.tsx` | Coordinate reali per i prodotti, navigazione al produttore (Urbano 3D o OSM) |
| `src/components/have2want/GlobalMarketplaceView.tsx` | Etichetta 'Esterno · Affiliazione', link tracciati visibili, distinzione acquisti interni/esterni |
| `src/components/have2want/Globo3D.jsx` | Nessun pianeta/sistema solare; 10 satelliti operativi |
| `src/lib/satelliteModularEngine.ts` | Aggiunti `WEBCAM` (CAMSAT-OBS) e `METEO_ROUTE` (WX-NAV-SAT) = 10 satelliti; preset `SOLO_TERRITORIO` a 5 satelliti |
| `src/lib/marketplaceOrdersService.ts` | **Nuovo** — ordini P2P in Pi (pending/paid/cancelled), regali verso altri Pioneer |
| `src/lib/routingService.ts` | OSRM reale, profili driving/walking/cycling, passi in italiano |
| `tests/pi_sdk_auth_payments.test.ts` | Aggiornati i test pagamenti al comportamento fail-closed |
| `tests/rewards_and_listings.test.ts` | Test prelievo: solo conferma server, nessun addebito senza conferma |
| `tests/routing_and_weather.test.ts` | Test meteo: `null` senza rete e parsing corretto dei dati reali Open-Meteo |
| `tests/marketplace_orders.test.ts` | **Nuovo** — 7 test ordini e regali marketplace interno |
| `tests/live_webcam.test.ts` | **Nuovo** — 4 test catalogo webcam |
| `tests/meteo_navigazione.test.ts` | **Nuovo** — 3 test meteo lungo percorso |
| `tests/satellite_modular_fleet.test.ts` | Aggiornati: 10 satelliti, preset SOLO_TERRITORIO 5 satelliti |

---

## 3. Componenti e servizi già presenti da riutilizzare

### 3.1 Cuore territoriale
- `src/components/have2want/Globo3D.jsx` — globo Three.js, orbite, 10 satelliti, marker, meteo 3D.
- `src/components/have2want/Urbano3D.jsx` — mappa MapLibre, marker, percorso, meteo.
- `src/components/have2want/MapView3DContainer.jsx` — orchestratore delle viste e delle modali (GLOBO/URBANO_3D/BACHECA + 8 canali territoriali + WEBCAM + METEO_ROUTE).
- `src/lib/territoryHierarchy.ts` — gerarchia Mondo → Stato → Regione → Provincia → Comune.
- `src/lib/geoPrivacy.js` — centroide comunale, raggio 2,0–2,5 km, `filterVisibleListings`.
- `src/components/have2want/WorldNavigatorModal.jsx` — ricerca globale di luoghi via Nominatim.

### 3.2 Servizi reali
- `src/lib/routingService.ts` — `calculateRealRoute` OSRM, profili `driving` / `walking` / `cycling`, passi in italiano, fallback geodetico.
- `src/lib/weatherService.js` — Open-Meteo + RainViewer radar; `null` se la rete non è disponibile (nessun fallback simulato).
- `src/components/have2want/StreetView360Modal.tsx` — Panoramax 360°, Nominatim reverse geocoding, navigazione a piedi/auto.
- `src/lib/globalProductsCatalog.ts` — 14 prodotti affiliati (7 eBay + 7 AliExpress), wallet configurabile.
- `src/components/have2want/GlobalMarketplaceView.tsx` — marketplace esterno, distinto dal globo commerciale.
- `src/components/have2want/MerchantDetailModal.tsx` — scheda esercente con pin `DOUBLE_RING` / `PI_ACCEPTED` / `AD_ONLY`, contatti, posizione, prodotti, navigazione.
- `src/lib/merchantPinClassifier.ts` — classificazione dei pin.

### 3.3 Economia
- `src/lib/communityRewardsService.ts` — punti, premi, prelievi, credito esercente, `adStreamEnabled`.
- `src/lib/h2wContext.tsx` — listino 20/120/475 π, sconto 50% (10/60/237,5), `spendMerchantPi`.
- `src/lib/countryAdvertisingPricing.ts` — listino 11 Stati, prezzo per viste.
- `src/lib/piRealPriceService.ts` — prezzo Pi di riferimento, cache browser, `PI_REAL_PRICE_EUR`.
- `src/lib/piSdkService.ts` — SDK Pi, pagamenti fail-closed senza fallback simulato.
- `src/lib/marketplaceOrdersService.ts` — ordini P2P in Pi (pending/paid/cancelled), regali verso altri Pioneer.

### 3.4 Interfaccia
- `src/components/have2want/OrbitalSatellitesHub.tsx` — canali territoriali + ON/OFF 10 satelliti + preset.
- `src/components/have2want/SpacecraftInspectorModal.tsx` — ispezione 3D e controlli flotta.
- `src/components/have2want/PioneerRewardsHubModal.tsx` — premi, prelievo, ricarica esercente.
- `src/components/have2want/BusinessSponsorModal.jsx` — vetrina pubblicitaria a pagamento.
- `src/components/have2want/VetrinaKmZero.tsx`, `BachecaLavoroP2P.tsx`, `VetrinaAgenziePaywall.tsx`.
- `src/components/have2want/LiveWeatherModal.jsx` — meteo reale con fonte e orario.
- `src/components/have2want/LiveWebcamModal.tsx` — webcam pubbliche con filtri e dettaglio.
- `src/components/have2want/MeteoNavigazioneModal.tsx` — meteo lungo percorso.
- `src/components/have2want/MarketplaceOrderModal.tsx` — acquisto/regalo in Pi.
- `src/components/have2want/MarketplaceOrdersModal.tsx` — cronologia ordini.
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
2. **Satelliti** — 10 ID reali, ON/OFF persistente, preset, avvio canali, badge meteo sincronizzato.
3. **Vetrina sponsorizzata** — addebito effettivo di `currentPricePi` dal credito esercente; blocco con saldo insufficiente; scadenza 7 giorni applicata.
4. **Credito esercente** — ricarica dall'Hub Ricompense (1.000 punti = 1 π).
5. **Premi annuncio** — `REAL_LISTING_BASIC` accreditato alla pubblicazione reale.
6. **Costo pubblicazione** — 2 punti nel modulo principale e nel secondo modulo bacheca.
7. **Prezzo Pi** — unica fonte `PI_REAL_PRICE_EUR`, nessun valore duplicato.
8. **Navigatore** — Auto / Piedi / Bici con OSRM reale.
9. **Canale Agenzie** — `VetrinaAgenziePaywall` raggiungibile dai Canali Territoriali.
10. **Conteggio prodotti** — 14, derivato dal catalogo.
11. **Pagamenti Pi fail-closed** — senza `PI_API_KEY` gli endpoint `/api/pi/*` rispondono 503; nessun pagamento o prelievo dichiarato riuscito senza conferma del server.
12. **Prelievo Pi** — scala punti solo dopo conferma del server; senza conferma non addebita nulla.
13. **Meteo reale** — canale METEO con dati Open-Meteo + radar RainViewer, fonte e orario visibili; nessun dato simulato quando la rete non è disponibile.
14. **Schede esercente complete** — telefono/email cliccabili, indirizzo, coordinate su OpenStreetMap, indicazioni stradali, prodotti & servizi.
15. **Marketplace interno** — ordini P2P in Pi (pending/paid/cancelled), regali verso altri Pioneer con messaggio, cronologia ordini per acquirente e venditore, riprova pagamento.
16. **Marketplace esterno** — 14 prodotti affiliati (eBay/AliExpress), link tracciati visibili, distinzione chiara da prodotti interni HAVE2WANT.
17. **Globo commerciale** — mostra esclusivamente prodotti e attività interne HAVE2WANT (no portali esterni).
18. **VIEW/webcam** — catalogo webcam pubbliche/turistiche/commerciali/traffico con filtri, cache, dettaglio fullscreen, fonte indicata.
19. **Meteo lungo il percorso** — campionamento punti su OSRM, meteo Open-Meteo reale per ogni punto, selezione profilo auto/bici/piedi.

---

## 6. Funzioni ancora da implementare

| # | Funzione | Stato | File di riferimento |
|---|---|---|---|
| 1 | **Pi Ads ufficiali** (`Pi.Ads`, interstitial, rewarded) | assente | `src/components/have2want/AdRewardHub.jsx`, `PioneerRewardsHubModal.tsx` |
| 2 | **Verifica pagamenti server-side** con autenticazione e chiave API | endpoint fail-closed (503 senza `PI_API_KEY`, 401 senza `uid`); manca solo `PI_API_KEY` per la verifica end-to-end | `server.ts`, `src/lib/piSdkService.ts` |
| 3 | **Firebase Auth e regole per-utente** | regole aperte in lettura | `firestore.rules`, `src/lib/firebase.ts` |
| 4 | **Gemini server-side** | 0 import di `@google/genai` | `metadata.json`, `src/lib/testnetEngine.ts` |
| 5 | **Stella delle Possibilità** | assente | `src/components/DiscreetAIAssistant.tsx` |
| 6 | **Salvavatutto con ricerca semantica** | presente solo `SalvavatuttoArchive` con ricerca testuale | `src/components/SalvavatuttoArchive.tsx` |
| 7 | **Scadenza annunci 30 giorni** | `ListingExpiryManager` 0 importatori, lifecycle simulato | `src/components/ListingExpiryManager.tsx` |
| 8 | **Ricerca globale unificata** | `GlobalSearchBar.tsx` 0 importatori | `src/components/GlobalSearchBar.tsx` |
| 9 | **Traffico e ricalcolo percorso** | routing base, nessun traffico reale | `src/lib/routingService.ts` |
| 10 | **Eco-fee / Pro-Tools / badge** | assenti | `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md:202–219` |
| 11 | **Donazioni "Pasto Sospeso"** | assente | `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md:216` |
| 12 | **Contabilità commissioni USDT** | assente | `src/lib/globalProductsCatalog.ts` |

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
│   │   ├── OrbitalSatellitesHub.tsx  (canali + ON/OFF 10 satelliti)
│   │   ├── SpacecraftInspectorModal.tsx
│   │   ├── BusinessSponsorModal.jsx  (vetrina a pagamento)
│   │   ├── PioneerRewardsHubModal.tsx(prelievi + ricarica esercente)
│   │   ├── VetrinaKmZero.tsx / BachecaLavoroP2P.tsx / VetrinaAgenziePaywall.tsx
│   │   ├── GlobalMarketplaceView.tsx (14 prodotti affiliati)
│   │   ├── StreetView360Modal.tsx    (Panoramax + OSRM)
│   │   ├── LiveWeatherModal.jsx      (Open-Meteo + RainViewer)
│   │   ├── LiveWebcamModal.tsx       (catalogo webcam pubbliche)
│   │   ├── MeteoNavigazioneModal.tsx (meteo lungo percorso OSRM)
│   │   ├── MarketplaceOrderModal.tsx (acquisto/regalo in Pi)
│   │   ├── MarketplaceOrdersModal.tsx(cronologia ordini)
│   │   ├── MerchantDetailModal.tsx   (scheda esercente completa)
│   │   └── ...
│   ├── HomeFeedView.tsx              (bacheca, ricerca, creazione annunci, ordini)
│   ├── CreateListingModal.tsx        (pubblicazione a punti)
│   ├── DiscreetAIAssistant.tsx       (assistente locale)
│   ├── LegalWelcomeShield.tsx        (consenso 5 clausole)
│   └── AbuseReportModal.tsx
├── lib/
│   ├── h2wContext.tsx                (punti, listino, credito esercente)
│   ├── communityRewardsService.ts    (premi, prelievi, adStreamEnabled)
│   ├── countryAdvertisingPricing.ts  (listino pubblicitario)
│   ├── piRealPriceService.ts         (prezzo Pi, cache)
│   ├── piSdkService.ts               (SDK Pi, fail-closed)
│   ├── routingService.ts             (OSRM auto/piedi/bici)
│   ├── weatherService.js             (Open-Meteo + RainViewer, null senza rete)
│   ├── geoPrivacy.js                 (centroide, 2,0–2,5 km)
│   ├── territoryHierarchy.ts         (5 livelli)
│   ├── globalProductsCatalog.ts      (14 prodotti affiliati)
│   ├── satelliteModularEngine.ts     (10 satelliti + 7 preset)
│   ├── marketplaceOrdersService.ts   (ordini P2P, regali)
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
5. **Conservare** le funzioni già complete (globo, mappa, bacheca, satelliti, routing, meteo, vetrine, ricompense, marketplace interno/esterno, VIEW/webcam, meteo percorso).
6. **Completare** solo le voci del §6, nell'ordine di priorità:
   - Pi Ads reali e verifica pagamenti;
   - Firebase Auth + regole;
   - Gemini server-side;
   - Stella delle Possibilità;
   - Salvavatutto semantico;
   - scadenza annunci;
   - traffico reale;
   - eco-fee / Pro-Tools / badge / donazioni;
   - contabilità USDT.
7. **Non sostituire funzioni reali con simulazioni.** Se un servizio esterno non è disponibile, dichiararlo nell'interfaccia invece di mostrare dati finti come reali.
8. **Verifiche minime prima di ogni consegna:**
   ```
   bun run build
   npx tsc --noEmit
   node ./node_modules/vitest/vitest.mjs run --pool=forks --no-file-parallelism
   ```
   Nota: `tests/app_render.test.tsx` può andare in OOM in ambienti con poca memoria; non è un errore del codice. `tests/unified_system_and_radar.test.ts` può andare in OOM se eseguito in parallelo; eseguire singolarmente per confermare.
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
- Commit HEAD: `64f76fb`
- Documenti di specifica nel repository: `HAVE2WANT_MASTER_SPECIFICATION_v1.0.md`, `specifiche_tecniche_progetto.md`, `CERTIFICATE_OF_AUTHORSHIP.md`.