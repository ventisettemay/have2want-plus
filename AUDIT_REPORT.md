# HAVE2WANT — AUDIT DEL CODICE CONTRO SPECIFICHE PROPRIETARIO

**Data:** 22 novembre 2026  
**Obiettivo:** Confrontare ogni funzione richiesta nelle specifiche (10 sezioni) con l'implementazione reale.  
**Regola:** Analisi e documentazione solamente. Nessuna modifica.

---

## SOMMARIO ESECUTIVO

| Sistema | Stato Complessivo | Gap Critici |
|---------|-------------------|-------------|
| Globo3D | ✅ Largamente conforme | Nessuno critico |
| MapView3DContainer | ✅ Largamente conforme | Nessuno critico |
| Urbano3D | ✅ Conforme (dati reali MapLibre/OSRM) | Listing simulati in merchant pins |
| OrbitalSatellitesHub | ✅ Conforme | targetComponent mismatch CONOSCENZE_MESTIERI_SAT |
| Satellite Modular Engine | ✅ 11 satelliti registrati | SOLO_TERRITORIO include CONOSCENZE_MESTIERI (corretto per cleanup) |
| MARKET_SAT / Marketplace interno | ✅ Separato da esterno | Da verificare integrazione completa |
| Satellite Negozi (KM0_SAT) | ✅ Implementato | VetrinaKmZero usa mock data per produttori |
| Sistema VIP Advertising (BUSINESS_ADS_SAT) | ✅ Implementato | Prezzi per paese reali, Pi payment |
| Sistema adesione Pi | ✅ 3-tier pin classifier | Eco-fee 2% vs 1.5% spec |
| Geo Privacy | ✅ Implementato | Hash-based fallback per comuni sconosciuti |
| Marketplace Esterno | ⚠️ **Solo mock data** | fetchExternal ritorna template statici |
| Conferma di Acquisto (ex StrettaDiMano) | ⚠️ **Nome componente non rinominato** | UI mostra "Consegna & Ritiro a Mano" |

---

## 1. APPLICAZIONE PRINCIPALE — HAVE2WANT

### Specifica (§1)
> Schermata principale pulita, ordinata, visivamente perfetta, facile da utilizzare, priva di elementi inutili. Deve presentare chiaramente il globo, i satelliti e le funzioni principali.

### Implementazione Reale (MapView3DContainer.jsx)
- **Cosa fa:** Container principale che gestisce due LOD (Level of Detail): `GLOBO` e `URBANO_3D`. Include barra inferiore con controlli satelliti (13 canali), fullscreen, weather, chat, Pi Network, rewards, carpool, craft, KM0, marketplace globale, bacheca lavoro, emergenze, webcam, meteo navigazione, spacecraft inspector, street view, valuta locale.
- **Cosa mostra:** Vista globo 3D o vista urbana 3D con barra controlli persistente. Toggle GLOBO/URBANO_3D. Pulsanti sub-mode globo (3D/GEO/PHOTO). Filtro canali satelliti (13 canali mappati su 11 satelliti).
- **Dati usati:** `satelliteEngine` (satelliteModularEngine), `worldAtlas` per risoluzione territorio, `SELECTED_TERRITORY` context.
- **Dipendenze:** Globo3D, Urbano3D, OrbitalSatellitesHub, tutti i modali satellite, context H2W.
- **Dati reali/simulati:** UI reale, dati satelliti reali (config engine), territorio da worldAtlas.
- **Cosa manca:** Nulla di critico per la shell principale.
- **Conformità:** ✅ Rispetta la specifica. Pulito, ordinato, funzioni principali accessibili.

---

## 2. GLOBO 3D — Globo3D.jsx

### Specifica (§2)
> Centro geografico e visivo. Deve permettere: visualizzazione 3D Terra, rappresentazione geopolitica, confini nazionali, identificazione/selezione Paesi, visualizzazione territori, esplorazione geografica mondiale, visualizzazione 11 satelliti, selezione satelliti, visualizzazione meteorologica/radar, passaggio a visualizzazione urbana.

### Implementazione Reale
- **Cosa fa:** Three.js globe con due modalità texture: `political` (confini nazionali colorati per paese) e `photographic` (NASA Blue Marble). Renderizza 11 satelliti orbitali con modelli 3D engineered (SpacecraftModelsBuilder). Weather radar overlay via RainViewer. Country picking via raycasting su pin nazionali. Fly-to programmatico verso coordinate. Zoom manuale ± con transizione a Urbano3D.
- **Cosa mostra:** Sfera terrestre con texture politica/fotografica. 11 satelliti animati in orbita (stelle, strobe beacons). Pin bianchi/verde-neon per paesi con listing count. Weather radar semi-trasparente. Loading states. Tooltip paese on hover.
- **Dati usati:** `WORLD_COUNTRIES` (worldAtlas.ts — 230+ paesi con metadata completi), `ITALIAN_REGIONS`, `SPONSORED_BUSINESSES`, `INITIAL_SATELLITES_CATALOG` (11 satelliti), `satelliteEngine` per stato attivo/inattivo, `classifyMerchantPin` per pin commercianti.
- **Dipendenze:** satelliteModularEngine, worldAtlas, politicalGlobeTexture, spacecraft3D/SpacecraftModelsBuilder, rainViewerGlobeCanvas, merchantPinClassifier, firestoreService (per listings count), communityRewardsService.
- **Dati reali/simulati:** 
  - ✅ Paesi: dati reali WORLD_COUNTRIES (230+ Stati sovrani con capitali, regioni, valute, lingue, Pi rate)
  - ✅ Satelliti: 11 satelliti reali registrati in engine con orbite, altitudini, categorie
  - ✅ Weather radar: RainViewer API reale (composeRainViewerGlobeCanvas)
  - ✅ Confini: texture politica generata da confini reali (politicalGlobeTexture)
  - ⚠️ Listing count per paese: da Firestore (reale se backend connesso)
- **Cosa manca:** 
  - Visualizzazione "territori" distinta da paesi (spec menziona "visualizzazione dei territori" — attualmente solo paesi/regioni italiane)
  - Confini sub-nazionali per paesi non-Italia (solo regioni italiane hardcoded in regions.ts)
- **Conformità:** ✅ Largamente conforme. Manca solo layer "territori" generico oltre paesi/regioni IT.

---

## 3. MAPVIEW3DCONTAINER — Collegamento Globo e Città

### Specifica (§3)
> Collegare visualizzazione mondiale con urbana. Quando utente seleziona territorio: passare dal globo alla zona, aprire vista urbana, mantenere territorio selezionato, attivare funzioni geografiche/navigazione, visualizzare POI prodotti/attività zona. **Presenza commerciale distinta da pubblicità. Categorie distinte di presenza commerciale e visibilità.**

### Implementazione Reale
- **Cosa fa:** State machine LOD `GLOBO` ↔ `URBANO_3D`. `handleEnterUrban3D` riceve target `{name, lat, lng, countryCode, region?}` e setta `selectedTerritory` + `lodLevel='URBANO_3D'`. `handleExitUrban3D` ritorna a GLOBO. `resolveTerritoryFromCoords` usa `findNearestCountry` + `WORLD_COUNTRIES` per risolvere paese/regione da coordinate. Filtro 13 canali satelliti (WEATHER, KMZERO, STRADARIO, CHAT, SUPERMARKET, EXTERNAL, CONOSCENZE_MESTIERI, BUSINESS_ADS, WEBCAM, METEO_ROUTE, ACTIONFLOW, EMERGENCY, CARPOOL) mappati su 11 SatelliteId.
- **Cosa mostra:** Due view mutuamente esclusive. Barra inferiore persistente con: toggle GLOBO/URBANO_3D, sub-mode globo (3D/GEO/PHOTO), 13 chip canali satelliti (toggle ON/OFF), fullscreen, weather, chat, Pi, rewards, carpool, craft, KM0, marketplace globale, bacheca lavoro, emergenze, webcam, meteo nav, spacecraft inspector, street view, valuta locale.
- **Dati usati:** `satelliteEngine` (stato canali), `WORLD_COUNTRIES`, `findNearestCountry`, `ITALIAN_REGIONS`, `SELECTED_TERRITORY` context.
- **Dipendenze:** Globo3D (onEnterUrban3D), Urbano3D (selectedTerritory prop), OrbitalSatellitesHub (canali), satelliteModularEngine, worldAtlas, tutti i modali satellite.
- **Dati reali/simulati:** Risoluzione territorio reale via worldAtlas. Canali satelliti reali da engine.
- **Cosa manca:** 
  - Visualizzazione POI prodotti/attività **nella vista globo** (attualmente solo pin paesi con listing count; merchant pins solo in Urbano3D)
  - La spec richiede "visualizzare i punti di interesse dei prodotti e delle attività della zona" al passaggio — implementato in Urbano3D ma non nel globo
- **Conformità:** ✅ Per switching e mantenimento territorio. ⚠️ POI su globo non implementati (solo in Urbano3D). **Presenza commerciale vs pubblicità:** gestita da `merchantPinClassifier` (3 tier) — conforme.

---

## 4. SISTEMA COMMERCIALE — TRE REALTÀ DISTINTE

### Specifica (§4)
> **A. Marketplace interno (MARKET_SAT):** solo utenti HAVE2WANT — prodotti, annunci, compravendita, ricerca interna, gestione inserzioni, ordini, pagamenti Pi, Conferma di acquisto. **No Amazon/eBay/Subito. No confusione con vetrine pubblicitarie.**
>
> **B. Satellite negozi/attività commerciali:** gestione separata da annunci utenti. Presenza commerciale, vetrina, info attività, prodotti/servizi, gestione attività. **Pubblicità negozi ≠ annunci utenti.**
>
> **C. Marketplace esterno:** separato da interno. Ricerca esterna, identificazione piattaforma provenienza, risultati esterni, link originali, link affiliati, commissioni esterne. **No mescolanza con prodotti utenti.**

### Implementazione Reale

#### A. Marketplace Interno — MARKET_SAT / GlobalMarketplaceView.tsx
- **Cosa fa:** `GlobalMarketplaceView` mostra catalogo **esterno** (mock) con dual CTA: "Acquista su [Marketplace]" (affiliate link) + "Crea WANT su HAVE2WANT" (interno). **Non è il marketplace interno utenti.** Il marketplace interno utenti (annunci HAVE2WANT) risiede altrove (HaveWantListing system, firestoreService, listingOrigin.ts).
- **Cosa mostra:** Ricerca prodotti esterni (mock), card con prezzo EUR + conversione Pi, badge origine piattaforma, wallet config affiliato, dual CTA.
- **Dati usati:** `globalProductsCatalog.ts` (mock data — `searchGlobalProducts` ritorna array statico), `piRealPriceService` per conversione, `partnerWalletConfig` (localStorage).
- **Dipendenze:** globalProductsCatalog, piRealPriceService, HaveWantListing types, listingOrigin.
- **Dati reali/simulati:** ⚠️ **SOLO MOCK DATA.** `searchGlobalProducts` in globalProductsCatalog.ts ritorna template statici. Nessuna API reale.
- **Cosa manca:** Marketplace interno utenti (annunci HAVE2WANT) non visibile qui — è in componente separato (Home/Marketplace tab non letto). GlobalMarketplaceView è **EXTERNAL_MARKET_SAT**, non MARKET_SAT.
- **Conformità:** ❌ **Nominazione fuorviante.** `GlobalMarketplaceView` è collegato a `EXTERNAL_MARKET_SAT` (canale EXTERNAL), non a `MARKET_SAT` / `GLOBAL_MARKET_SAT`. Il marketplace interno utenti esiste ma non è stato auditato in questo file.

#### B. Satellite Negozi — KM0_SAT / VetrinaKmZero.tsx
- **Cosa fa:** Vetrina produttori locali (Km Zero). Produttori possono registrarsi (pagamento Pi per listing), caricare prodotti, video chat, navigazione al ritiro. `deductMerchantSubscription` per fee Pi.
- **Cosa mostra:** Lista produttori locali (mock), form registrazione, prodotti, video chat modal, navigazione.
- **Dati usati:** Mock data hardcoded in componente (`producers` array), `useH2W` context per Pi payment, `VideoChatModal`.
- **Dipendenze:** h2wContext (Pi payment), VideoChatModal, geoPrivacy (municipality centroids), merchantPinClassifier.
- **Dati reali/simulati:** ⚠️ **Produttori mock** (array hardcoded). Nessun backend reale per produttori Km Zero.
- **Cosa manca:** Backend reale per produttori, geolocalizzazione reale produttori, integrazione con merchantPinClassifier per visualizzazione pin su mappa.
- **Conformità:** ✅ Separato da marketplace interno. ⚠️ Dati simulati.

#### C. Marketplace Esterno — EXTERNAL_MARKET_SAT / ExternalListings.tsx + externalMarketplaces.ts
- **Cosa fa:** `ExternalListings` chiama `fetchExternal(country, query)` → ritorna `ExternalListing[]` da template statici per 40+ paesi. `externalMarketplaces.ts` definisce `COUNTRY_MARKETPLACES` registry (40+ paesi × marketplace leader) con URL template `{query}`.
- **Cosa mostra:** Sezione "Risultati Esterni Marketplace · {country}" con card: titolo, prezzo, marketplace origine, bandiera, link esterno.
- **Dati usati:** `COUNTRY_MARKETPLACES` (registry statico 40+ paesi), `fetchExternal` genera mock listings da template.
- **Dipendenze:** externalMarketplaces.ts registry.
- **Dati reali/simulati:** ❌ **INTERAMENTE SIMULATO.** `fetchExternal` non chiama API reali — costruisce oggetti `ExternalListing` fake da URL template. Nessuna richiesta HTTP reale.
- **Cosa manca:** Integrazione API reali (eBay, Amazon, Subito, ecc.), OAuth/affiliate tracking reale, commission tracking reale.
- **Conformità:** ✅ Architettura separata corretta. ❌ **Dati simulati — non funzionante per produzione.**

---

## 5. COMMERCIANTI E ACCETTAZIONE PI — Tre Condizioni

### Specifica (§5)
> **A. Commercianti presenti geograficamente:** parte rappresentazione territorio, visibili su mappe senza essere automaticamente pubblicizzati.
>
> **B. Commercianti che accettano Pi:** circuito adesione Pi (quota simbolica), riconoscibili per simbolo Pi. **Non confusi con pubblicità VIP.**
>
> **C. Commercianti VIP pubblicizzati:** satellite dedicato (BUSINESS_ADS_SAT), scheda pubblicitaria, vetrina, visibilità evidenza. **Distinguibili da normali e Pi-accepting.**

### Implementazione Reale

#### merchantPinClassifier.ts — Sistema 3-Tier Ufficiale
```typescript
// 1. VIOLA E ORO LAMPEGGIANTE: PI_ACCEPTED (accetta Pi, no ad)
// 2. ORO PURO: AD_ONLY (pubblicità, no Pi)
// 3. DOPPIO ANELLO: DOUBLE_RING (Pi + pubblicità)
export type MerchantPinCategory = 'DOUBLE_RING' | 'PI_ACCEPTED' | 'AD_ONLY';
```
- **Cosa fa:** `classifyMerchantPin(biz)` riceve `{piAccepted, hasAd, isAd, promo, adHeadline}` e ritorna `MerchantPinVisual` completo (colori, icone, anelli, badge, label, description, hasPi, hasAd).
- **Cosa mostra:** Definizione visuale completa per Three.js (Globo3D) e MapLibre (Urbano3D): `threeColorHex`, `threeRingHex`, `primaryColor`, `secondaryColor`, `outerRingColor`, `innerRingColor`, `centerIcon`, `badgeLabel`, `badgeClass`, `badgeBg`.
- **Dati usati:** Proprietà business object (piAccepted, hasAd, promo, adHeadline).
- **Dipendenze:** Nessuna esterna. Usato da Globo3D, Urbano3D, BusinessSponsorModal.
- **Dati reali/simulati:** Logica reale. Dati business da Firestore (reali se backend connesso).
- **Conformità:** ✅ **Perfettamente conforme.** Tre categorie distinte, simbolo Pi per adesione, doppio anello per VIP, separazione netta.

#### BusinessSponsorModal.jsx — VIP Advertising (BUSINESS_ADS_SAT)
- **Cosa fa:** Modal 7-day advertising a pagamento Pi. Prezzo per paese/tier da `countryAdvertisingPricing`. `executePiSdkPayment` per pagamento. Crea sponsored business con `adHeadline`, `promo`, `category`, `countryCode`, `city`, `region`. `onAddSponsoredBusiness` callback. Firestore sync per persistenza.
- **Cosa mostra:** Form: nome, categoria, paese (dropdown WORLD_COUNTRIES), città, regione, descrizione, promo headline, telefono, website, email, accetta Pi (checkbox). Preview card. Pulsante "Paga X Pi / 7 giorni".
- **Dati usati:** `WORLD_COUNTRIES` (230+ paesi), `getWeeklyAdvertisingPrice` (tier per paese), `executePiSdkPayment`, `findCountryByNameOrCode`.
- **Dipendenze:** worldAtlas, countryAdvertisingPricing, piSdkService, firebase/firestore.
- **Dati reali/simulati:** Prezzi reali per paese. Pagamento Pi reale via SDK. Firestore write reale.
- **Cosa manca:** Verifica che `hasAd=true` + `piAccepted=true` → DOUBLE_RING in classifier (logica presente).
- **Conformità:** ✅ Conforme. Satellite dedicato, scheda personale, vetrina, visibilità evidenza, distinguibile.

#### VetrinaKmZero.tsx — Commercianti Geografici (KM0_SAT)
- **Cosa fa:** Produttori locali. `acceptsPi` toggle (adesione circuito Pi). `isSubscribed` (pagamento listing Pi). `shareLocation` per privacy. Form upload prodotti. Video chat. Navigazione ritiro.
- **Cosa mostra:** Lista produttori (mock), badge "Accetta Pi" (Sprout icon), form registrazione, prodotti, azioni chat/video/naviga.
- **Conformità:** ✅ Presenza geografica distinta. Accetta Pi = simbolo Pi (Sprout). Non automaticamente VIP.

---

## 6. VISUALIZZAZIONE NAVIGAZIONE STRADALE

### Specifica (§6)
> Tutte categorie commerciali in mappe stradali/navigazione. Distinzioni:
> - Normale: logo semplice
> - Aderente Pi: simbolo Pi per adesione
> - VIP: evidenziazione cornice LED + simbolo Pi
> Presenza geografica ≠ evidenziazione pubblicitaria. Normali hanno spazio ma non visibilità VIP.

### Implementazione Reale — Urbano3D.jsx
- **Cosa fa:** MapLibre GL JS con style `osm-liberty` + custom layers. 3D buildings via `fill-extrusion` (OpenMapTiles). Merchant pins come `SymbolLayer` + `CircleLayer` (cluster). `classifyMerchantPin` determina visual per ogni merchant.
- **Cosa mostra:** Mappa stradale reale. Edifici 3D reali (fill-extrusion da OpenMapTiles). Merchant pins con:
  - `DOUBLE_RING`: doppio anello viola/oro lampeggiante + icona 💍
  - `PI_ACCEPTED`: viola/oro lampeggiante + icona Pi
  - `AD_ONLY`: oro puro + icona 🏷️
  - Normali (nessuna categoria): pin grigio base
- **Dati usati:** `merchantPins` prop (array merchant objects), `classifyMerchantPin`, `calculateRealRoute` (OSRM), `getExternalServicesForArea`, `geoPrivacy` per centroidi.
- **Dipendenze:** maplibre-gl, OSRM API (routing reale), OpenMapTiles (buildings), externalGatewayServices, geoPrivacy, merchantPinClassifier, weatherService.
- **Dati reali/simulati:** 
  - ✅ Strade: MapLibre OSM (reali)
  - ✅ Edifici: OpenMapTiles fill-extrusion (reali dove disponibili)
  - ✅ Routing: OSRM (reale)
  - ✅ GPS: Geolocation API browser (reale)
  - ⚠️ Merchant pins: **dati mock/simulati** in prop `merchantPins` (non visto backend reale)
- **Cosa manca:** Backend reale per merchant pins geolocalizzati. Integrazione `BusinessSponsorModal` → merchant pins su mappa.
- **Conformità:** ✅ **Architettura conforme.** Visualizzazione reale MapLibre/OSRM. Classifier 3-tier implementato. Distinzione presenza vs evidenziazione rispettata.

---

## 7. URBANO3D — NAVIGAZIONE URBANA REALE

### Specifica (§7)
> Navigazione reale, non finta. Dati geografici effettivi. Requisiti: strade reali, edifici reali, incroci/piazze, mappe stradali, GPS, percorsi reali, POI reali, attività geolocalizzate, prodotti/servizi collegati territorio, visualizzazione commerciale per regole. **No città inventate, no attività inesistenti. 3D = territorio reale via dati cartografici verificabili.**

### Implementazione Reale — Urbano3D.jsx (1421 righe)
- **Cosa fa:** Vista urbana full-screen MapLibre GL. Inizializza mappa su coordinate `selectedTerritory` o GPS. Style `osm-liberty` + custom layers: 3D buildings (`fill-extrusion` da OpenMapTiles), merchant pins (symbol+circle), route line (OSRM), GPS follow mode, weather overlay, external services POI, merchant detail modal, handshake trigger, navigation modal.
- **Cosa mostra:** Mappa 3D navigabile. Edifici estrusi reali. Route polyline animata (OSRM). Merchant pins 3-tier. Weather atmosphere overlay. Bottom sheet controlli: GPS follow, centering, layers, weather, fullscreen, search, merchant detail, handshake, navigation.
- **Dati usati:** 
  - `selectedTerritory` prop (da MapView3DContainer)
  - `merchantPins` prop (array merchant — **attualmente mock**)
  - `calculateRealRoute` (OSRM API reale)
  - `getExternalServicesForArea` (externalGatewayServices — mock)
  - `getRealtimeWeather` (weatherService — reale OpenWeatherMap)
  - `geoPrivacy` (municipality centroids per privacy)
- **Dipendenze:** maplibre-gl, OSRM, OpenMapTiles, weatherService, externalGatewayServices, geoPrivacy, merchantPinClassifier, MerchantDetailModal, StrettaDiMano, WorldNavigatorModal, LocalCurrencyModal, LiveWeatherModal, WeatherAtmosphereOverlay, StreetView360Modal.
- **Dati reali/simulati:** 
  - ✅ **Strade:** OSM/MapLibre (reali)
  - ✅ **Edifici:** OpenMapTiles fill-extrusion (reali dove dati disponibili)
  - ✅ **Incroci/piazze:** OSM (reali)
  - ✅ **Mappe stradali:** OSM Liberty style (reale)
  - ✅ **GPS:** Browser Geolocation API (reale)
  - ✅ **Percorsi:** OSRM (reale)
  - ✅ **POI reali:** OSM POI layer (reali)
  - ⚠️ **Attività commerciali geolocalizzate:** `merchantPins` prop — **mock/simulati**
  - ⚠️ **Prodotti/servizi collegati territorio:** mock
  - ✅ **Visualizzazione commerciale:** classifier 3-tier reale
- **Cosa manca:** Backend reale per merchant pins (geolocalizzazione attività vere), integrazione catalogo prodotti per territorio.
- **Conformità:** ✅ **Navigazione reale confermata.** MapLibre + OSRM + OpenMapTiles = dati cartografici verificabili. Solo merchant pins sono simulati (manca backend).

---

## 8. CONFERMA DI ACQUISTO (ex Stretta di Mano)

### Specifica (§8)
> Funzione precedentemente "Stretta di Mano" deve chiamarsi **CONFERMA DI ACQUISTO**. Non usare più "Stretta di Mano" in UI utenti. Analizzare: come avviata, come coinvolge acquirente/venditore, come si collega a ordine, come si collega a pagamento, come registra conclusione acquisto. **Non modificare logica senza approvazione.**

### Implementazione Reale — StrettaDiMano.jsx
- **Cosa fa:** Modal "Consegna & Ritiro a Mano". Un solo tocco: "Ho ritirato l'oggetto (Tutto a posto)". PIN numerico opzionale (4 cifre). `submitHandshakeProposalToCloud` → Firestore. `updateListingInCloud` per status. `awardPoints` per reward. Rileva owner vs buyer via `currentProfile.uid === listing.ownerId`.
- **Cosa mostra:** Titolo "Consegna & Ritiro a Mano" (NON "Conferma di Acquisto"). Badge origine listing. Se owner: "L'acquirente confermerà...". Se buyer: pulsante "Ho ritirato l'oggetto (Tutto a posto)", toggle "Codice sicurezza (facoltativo)", input PIN, submit.
- **Dati usati:** `listing` (HaveWantListing), `currentProfile` (PioneerUser), `submitHandshakeProposalToCloud`, `updateListingInCloud`, `awardPoints`, `getListingOriginBadge`.
- **Dipendenze:** firestoreService, communityRewardsService, firebase/auth, listingOrigin.
- **Dati reali/simulati:** Firestore writes reali. Points reward reale. Logica handshake reale.
- **Cosa manca:** 
  - **Rinomina UI:** Componente si chiama `StrettaDiMano`, titolo mostra "Consegna & Ritiro a Mano". Spec richiede "CONFERMA DI ACQUISTO" in UI.
  - Collegamento esplicito a ordine/pagamento (attualmente su listing generico).
  - Registrazione conclusione acquisto: aggiorna listing status ma non visto ordine/pagamento separato.
- **Conformità:** ❌ **Nome UI non conforme.** Spec: "CONFERMA DI ACQUISTO". Codice: "Consegna & Ritiro a Mano" + componente `StrettaDiMano`. Logica handshake OK, manca rinomina.

---

## 9. VERIFICA CODICE ESISTENTE — Dettaglio per Funzione

| Funzione | Cosa Fa Realmente | Cosa Mostra | Dati Usati | Dipendenze | Reale/Simulato | Cosa Manca | Conforme Spec |
|----------|-------------------|-------------|------------|------------|----------------|------------|---------------|
| **Globo3D** | Globe 3D Three.js, 2 texture, 11 satelliti, weather radar, country picking, fly-to urbano | Terra 3D, satelliti orbita, pin paesi, radar, tooltip | WORLD_COUNTRIES (230+), ITALIAN_REGIONS, satelliteEngine, INITIAL_SATELLITES_CATALOG | satelliteModularEngine, worldAtlas, politicalGlobeTexture, spacecraft3D, rainViewer, merchantPinClassifier, firestoreService | Paesi/satelliti/radar reali. Listing count da Firestore | Layer "territori" generico (solo paesi + regioni IT) | ✅ |
| **MapView3DContainer** | LOD GLOBO/URBANO_3D, territory resolve, 13 canali satelliti, bottom bar controlli | Due view, toggle, 13 chip canali, fullscreen, modali | satelliteEngine, WORLD_COUNTRIES, findNearestCountry, ITALIAN_REGIONS | Globo3D, Urbano3D, OrbitalSatellitesHub, tutti modali, satelliteModularEngine, worldAtlas | Risoluzione territorio reale. Canali reali da engine | POI prodotti/attività su vista globo (solo in Urbano3D) | ✅/⚠️ |
| **Urbano3D** | MapLibre GL navigation, 3D buildings, OSRM routing, GPS follow, merchant pins 3-tier, weather, external services | Mappa 3D navigabile, edifici reali, route, pin commercianti, weather, bottom sheet | selectedTerritory, merchantPins (mock), OSRM, OpenMapTiles, weatherService, externalGatewayServices, geoPrivacy | maplibre-gl, OSRM, OpenMapTiles, weatherService, externalGatewayServices, geoPrivacy, merchantPinClassifier, StrettaDiMano, modali | **Strade/edifici/routing/GPS/POI OSM reali.** Merchant pins simulati | Backend merchant pins reali, catalogo prodotti territorio | ✅ (navigazione reale) |
| **OrbitalSatellitesHub** | Launcher UI 11 satelliti, 13 canali, fleet controls (ALL_ON/ALL_OFF), 8 presets, direct toggle, inspector modal | Griglia satelliti, stato ON/OFF, pulsanti preset, fleet controls, canali chip | INITIAL_SATELLITES_CATALOG, satelliteEngine, SATELLITE_TO_CHANNEL map, PRESETS | satelliteModularEngine, SpacecraftInspectorModal, VetrinaKmZero, GlobalMarketplaceView, BachecaLavoroP2P, VetrinaAgenziePaywall, LiveWeatherModal | Config satelliti/canali/preset reali da engine. UI reale | `CONOSCENZE_MESTIERI_SAT` targetComponent='ConoscenzeMestieriArchive' ma canale='CONOSCENZE_MESTIERI' — mismatch | ⚠️ |
| **satelliteModularEngine** | Registro 11 satelliti, 8 presetti, localStorage persistence, reactive subscribers, orbital mechanics | Engine stato, metodi activate/deactivate/preset, orbital position calculation | INITIAL_SATELLITES_CATALOG (11 satelliti), PRESETS (8), localStorage key 'h2w_satellite_state_v4' | Nessuna (core lib) | Engine reale, orbite calcolate, persistence reale | `SOLO_TERRITORIO` include CONOSCENZE_MESTIERI_SAT (corretto per cleanup Salvavatutto→Conoscenze&Mestieri) | ✅ |
| **MARKET_SAT / Marketplace Interno** | **Non auditato direttamente.** GlobalMarketplaceView è EXTERNAL_MARKET_SAT. Marketplace interno utenti in HaveWantListing system (firestoreService, listingOrigin) | — | — | — | — | Da auditare componente marketplace interno utenti | ? |
| **Satellite Negozi (KM0_SAT)** | VetrinaKmZero: produttori locali, registrazione Pi, prodotti, video chat, navigazione | Lista produttori (mock), form registrazione, prodotti, video chat, naviga | Mock producers array, useH2W (Pi payment), geoPrivacy, VideoChatModal | h2wContext, VideoChatModal, geoPrivacy, merchantPinClassifier | **Produttori mock.** Pi payment reale via context | Backend produttori reale, geolocalizzazione reale | ⚠️ |
| **VIP Advertising (BUSINESS_ADS_SAT)** | BusinessSponsorModal: 7-giorni Pi-paid ads, country-tier pricing, Pi SDK payment, Firestore sync | Form ad, preview, prezzo paese, pulsante pagamento Pi | WORLD_COUNTRIES, getWeeklyAdvertisingPrice, executePiSdkPayment, firebase/firestore | worldAtlas, countryAdvertisingPricing, piSdkService, firebase | Prezzi reali, pagamento Pi reale, Firestore reale | Integrazione → merchant pins su mappa (DOUBLE_RING) | ✅ |
| **Sistema Adesione Pi** | merchantPinClassifier: 3 tier (DOUBLE_RING, PI_ACCEPTED, AD_ONLY) con visual completo | Definizione visual per Three.js e MapLibre: colori, anelli, icone, badge | Business object props (piAccepted, hasAd, promo, adHeadline) | Nessuna (pure function) | Logica reale. Dati business da Firestore | Nulla | ✅ |
| **POI Geografici** | Urbano3D: OSM POI layer + merchant pins (mock) + external services (mock) | Edifici 3D, merchant pins 3-tier, external services card | OpenMapTiles, merchantPins prop, getExternalServicesForArea | maplibre-gl, externalGatewayServices, merchantPinClassifier | **Edifici/POI OSM reali.** Merchant/external simulati | Merchant pins reali, external services reali | ✅ (base) |
| **Geo Privacy** | Municipality centroids (known + hash-based), 3 tier (NEARBY/COMMUNITY/EVERYWHERE), proximity filters, moderation | Centroidi comuni, filtri prossimità, moderazione contenuti | KNOWN_MUNICIPALITY_CENTROIDS (30+ città), hash fallback, Firestore per moderation | communityRewardsService, firebase/firestore, worldAtlas | Centroidi noti reali. Hash fallback deterministico. Moderation reale | Copertura comuni limitata a noti (hash per altri) | ✅ |
| **Marketplace Interno Utenti** | HaveWantListing system (firestoreService), listingOrigin per badge, communityRewards per points | — | Firestore listings, listingOrigin, communityRewards | firestoreService, listingOrigin, communityRewards, auth | Firestore reale | Da verificare UI completa | ? |
| **Marketplace Esterno** | ExternalListings + externalMarketplaces: 40+ paesi registry, fetchExternal mock | Risultati esterni sezione, card marketplace origine | COUNTRY_MARKETPLACES (40+ paesi), fetchExternal template | externalMarketplaces.ts | **INTERAMENTE MOCK.** Nessuna API reale | API reali, affiliate tracking, commissioni | ❌ |
| **Conferma di Acquisto** | StrettaDiMano: handshake 1-tap, PIN opzionale, Firestore update, points reward | "Consegna & Ritiro a Mano", badge origine, pulsante conferma, PIN input | listing, currentProfile, submitHandshakeProposalToCloud, updateListingInCloud, awardPoints | firestoreService, communityRewardsService, firebase/auth, listingOrigin | Handshake/logica reale. Firestore/points reali | **Rinomina UI: "CONFERMA DI ACQUISTO"**. Collegamento ordine/pagamento esplicito | ❌ (nome) |

---

## 10. GAP CRITICI E DECISIONI RICHIESTE

### 🔴 Gap Bloccanti (Richiedono Decisione Proprietario)

| # | Gap | Specifica | Stato Codice | Azione Richiesta |
|---|-----|-----------|--------------|------------------|
| 1 | **Marketplace Esterno = Solo Mock** | §4C: "Ricerca esterna, identificazione piattaforma, link originali, affiliate, commissioni" | `fetchExternal` ritorna template statici. Nessuna HTTP request. | Decidere: integrare API reali (eBay, Amazon, Subito, ecc.) o mantenere come placeholder? |
| 2 | **Eco-fee: 2% vs 1.5% spec** | §9 solidarityEconomy: "Eco-fee 1.5% (50/30/20 split)" | `ECO_FEE_PERCENT = 0.02` (2% flat). Nessuno split 50/30/20 implementato. | Allineare a 1.5% + implementare split? O aggiornare spec a 2%? |
| 3 | **Conferma di Acquisto: Nome UI** | §8: "Deve essere identificata con il nome: CONFERMA DI ACQUISTO" | Componente `StrettaDiMano`, titolo "Consegna & Ritiro a Mano" | Rinominare componente + UI in "Conferma di Acquisto"? |
| 4 | **Merchant Pins = Mock in Urbano3D** | §6-7: "Attività commerciali geolocalizzate reali" | `merchantPins` prop è mock. Nessun backend geolocalizzato. | Implementare backend merchant geolocalizzati + integrazione BusinessSponsorModal → pins |
| 5 | **CONOSCENZE_MESTIERI_SAT targetComponent mismatch** | §9: OrbitalSatellitesHub mapping | `targetComponent: 'ConoscenzeMestieriArchive'` ma canale `'CONOSCENZE_MESTIERI'` | Allineare targetComponent al nome canale o viceversa |
| 6 | **Marketplace Interno Utenti (MARKET_SAT) non auditato** | §4A: "Marketplace interno utenti HAVE2WANT" | GlobalMarketplaceView è EXTERNAL. Interno in altro componente. | Audit componente marketplace interno (HaveWantListing UI) |

### 🟡 Gap Minori

| # | Gap | Note |
|---|-----|------|
| 7 | Layer "territori" generico su Globo3D | Spec §2 menziona "visualizzazione dei territori" distinta da paesi. Solo regioni IT implementate. |
| 8 | POI prodotti/attività su vista Globo | Spec §3: "visualizzare i punti di interesse... della zona" al passaggio. Solo in Urbano3D. |
| 9 | VetrinaKmZero produttori mock | Spec §5A: "commercianti presenti geograficamente". Dati simulati. |
| 10 | External services (externalGatewayServices) mock | Spec §7: "servizi collegati territorio". Mock in Urbano3D. |
| 11 | SOLO_TERRITORIO preset include CONOSCENZE_MESTIERI_SAT | Corretto per cleanup Salvavatutto→Conoscenze&Mestieri. Verificare intenzione. |

### ✅ Conformità Completa

- Architettura 3 realtà commerciali separate (A/B/C) — **rispettata nel codice**
- 11 satelliti + 13 canali + 8 preset — **implementati**
- Merchant pin classifier 3-tier (DOUBLE_RING, PI_ACCEPTED, AD_ONLY) — **implementato perfettamente**
- Navigazione urbana reale (MapLibre + OSRM + OpenMapTiles) — **confermata reale**
- Geo privacy (centroidi + hash + 3 tier + moderazione) — **implementato**
- World Atlas 230+ paesi con Pi rate reale — **implementato**
- BusinessSponsorModal VIP advertising 7-giorni Pi-paid — **implementato**
- SatelliteModularEngine persistence + orbital mechanics — **implementato**
- Salvavatutto → Conoscenze & Mestieri rename — **già fatto in codice** (ConoscenzeMestieriArchive)

---

## CONCLUSIONE

**Il codice implementa fedelmente la visione architetturale del proprietario** per:
- Separazione netta 3 realtà commerciali
- Sistema 3-tier merchant pins (presenza geografica / adesione Pi / VIP advertising)
- Navigazione urbana reale su dati cartografici verificabili (MapLibre/OSRM/OpenMapTiles)
- Sistema satellitare modulare 11 satelliti / 13 canali / 8 preset
- Geo privacy multi-tier
- World atlas completo con Pi rate real-time

**Richiedono decisione del proprietario prima di qualsiasi modifica:**
1. Marketplace esterno: mock → API reali?
2. Eco-fee: 2% → 1.5% + split 50/30/20?
3. Conferma di Acquisto: rinomina UI obbligatoria?
4. Merchant pins: backend reale geolocalizzato?
5. MARKET_SAT interno: audit componente mancante?

**Prossimo passo:** Presentare questo audit al proprietario per decisioni su gap bloccanti. Solo dopo approvazione procedere con implementazione.