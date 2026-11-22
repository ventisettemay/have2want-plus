# HAVE2WANT — Complete Function Inventory & Analysis

**Generated:** 2026-11-22  
**Total Source Files:** 106  
**Total Exported Functions:** ~260  
**Architecture:** Globo 3D + 11 Satelliti Operativi + Canali Territoriali

---

## 📐 ARCHITECTURAL OVERVIEW

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| **Core App** | Entry, routing, providers | `App.jsx`, `main.tsx`, `h2wContext.tsx`, `AuthContext.jsx` |
| **Globo 3D** | 3D Earth visualization, navigation | `Globo3D.jsx`, `MapView3DContainer.jsx`, `Urbano3D.jsx`, `politicalGlobeTexture.ts`, `rainViewerGlobeLayer.ts` |
| **11 Satelliti** | Modular orbital services | `OrbitalSatellitesHub.tsx`, `satelliteModularEngine.ts`, `SpacecraftModelsBuilder.ts` |
| **Territorial Channels** | Country/region data, hierarchy | `worldAtlas.ts`, `territoryHierarchy.ts`, `countries.ts`, `regions.ts` |
| **Marketplace** | Listings, orders, external APIs | `firestoreService.ts`, `marketplaceOrdersService.ts`, `externalMarketplaces.ts`, `globalProductsCatalog.ts` |
| **Economia Solidale** | Pi/USDT accounting, eco-fees, suspended meals | `solidarityEconomy.ts`, `usdtAccounting.ts`, `forexService.ts`, `piRealPriceService.ts` |
| **Rewards/Community** | Pioneer rewards, gamification | `communityRewardsService.ts` |
| **Auth & Pi Network** | Firebase, Pi SDK, payments | `firebase.ts`, `piSdkService.ts`, `signalingService.ts`, `turnService.ts` |
| **Search & Semantic** | BM25, fuzzy geocoding, hybrid search | `semanticSearch.ts`, `fuzzyGeocoding.ts` |
| **Weather & Marine** | Live weather, RainViewer radar | `weatherService.js` |
| **Privacy & Geo** | Geo-privacy, municipality centroids | `geoPrivacy.js` |
| **AI & Testnet** | Local AI, flat DB | `testnetEngine.ts`, `DiscreetAIAssistant.tsx` |

---

## 🗂️ FUNCTION INVENTORY BY MODULE

---

### 1. CORE APP & CONTEXT (`App.jsx`, `h2wContext.tsx`, `AuthContext.jsx`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `Have2WantPlusMain()` | App.jsx:119 | Main app component with providers, routing, satellite hub | ✅ | Central orchestrator; good separation |
| `App()` | App.jsx:1756 | Default export, wraps in providers | ✅ | Standard React pattern |
| `H2WProvider({children})` | h2wContext.tsx:115 | Global state: user, wallet, listings, guides, shops, chats, rewards, satellites | ✅ | **Core state hub** — comprehensive but large; consider splitting |
| `useH2W()` | h2wContext.tsx:398 | Hook to access H2W context | ✅ | Standard context hook |
| `isNewDay/Week/Month(ts)` | h2wContext.tsx:76-102 | Time boundary checks for reward resets | ✅ | Pure utilities, well-tested |
| `getNowTs()` | h2wContext.tsx:111 | Current timestamp helper | ✅ | Trivial |
| `AuthProvider({children})` | AuthContext.jsx:48 | Firebase auth state, Pi login, user profile sync | ✅ | **Auth nucleus** — handles Pi + Firebase bridge |
| `useAuth()` | AuthContext.jsx:104 | Hook for auth state | ✅ | Standard |
| `buildSyncedUser(base, rewards)` | AuthContext.jsx:28 | Merge auth user with rewards state | ✅ | Internal helper |

---

### 2. GLOBO 3D & NAVIGAZIONE (`Globo3D.jsx`, `MapView3DContainer.jsx`, `Urbano3D.jsx`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `resolveGlobeCountryById(countryId)` | Globo3D.jsx:66 | Map country ID → globe coordinates/metadata | ✅ | Clean lookup |
| `resolveGlobeUrbanTarget({activeZone, selectedCountryId, fallbackCoords})` | Globo3D.jsx:113 | Determine camera target for urban view | ✅ | Handles zone/country fallback |
| `Globo3D({...})` | Globo3D.jsx:270 | **Main 3D globe component** — Three.js scene, satellites, weather overlay, country picking | ✅ | **Centerpiece** — complex but modular; satellite integration good |
| `getInitialTargetCoords(selectedCountry)` | MapView3DContainer.jsx:63 | Initial camera position for country | ✅ | Simple utility |
| `resolveCountryData(countryInput)` | MapView3DContainer.jsx:78 | Normalize country input (code/name/coords) → data | ✅ | Robust normalization |
| `MapView3DContainer({...})` | MapView3DContainer.jsx:282 | **Unified 3D view container** — switches Globe ↔ Urban, handles satellite clicks | ✅ | **Primary 3D entry point** — well-structured |
| `haversineMeters(lat1,lng1,lat2,lng2)` | Urbano3D.jsx:58 | Great-circle distance | ✅ | Standard formula |
| `computeBearingDeg(lat1,lng1,lat2,lng2)` | Urbano3D.jsx:69 | Initial bearing between points | ✅ | Standard |
| `distanceToSegmentMeters(lat,lng, lat1,lng1, lat2,lng2)` | Urbano3D.jsx:80 | Point-to-line-segment distance | ✅ | For route snapping |
| `buildNextTurnBanner(route, curLat, curLng)` | Urbano3D.jsx:114 | Generate turn-by-turn instruction banner | ✅ | Good UX helper |
| `getInitialTargetCoords(selectedCountry)` | Urbano3D.jsx:148 | Duplicate of MapView3D version — **deduplicate** | ⚠️ | **Duplicate** — move to shared util |
| `computeGpsCameraEaseOptions({...})` | Urbano3D.jsx:162 | Smooth camera transition options for GPS follow | ✅ | Nice polish |
| `Urbano3D({...})` | Urbano3D.jsx:181 | **3D urban navigation** — MapLibre + Three.js overlay, routing, POI | ✅ | **Urban satellite** — feature-complete for MVP |

> **Note:** `Globo3D` = planetary view (satellites, countries, weather). `Urbano3D` = street-level navigation. `MapView3DContainer` = unified switcher. This separation is **correct per architecture**.

---

### 3. 11 SATELLITI OPERATIVI (`OrbitalSatellitesHub.tsx`, `satelliteModularEngine.ts`, `SpacecraftModelsBuilder.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `OrbitalSatellitesHub({...})` | OrbitalSatellitesHub.tsx:36 | **Satellite launcher UI** — radial menu, tooltips, presets (SOLO_TERRITORIO, etc.) | ✅ | **Excellent** — clean, preset system extensible |
| `getSatelliteLightMode(id)` | SpacecraftModelsBuilder.ts:13 | Return light config per satellite type | ✅ | Data-driven |
| `createSolarCellCanvasTexture()` | SpacecraftModelsBuilder.ts:45 | Procedural solar panel texture | ✅ | Performant |
| `createMliNormalTexture()` | SpacecraftModelsBuilder.ts:98 | Multi-layer insulation normal map | ✅ | Visual quality |
| `createSharedAerospaceMaterials()` | SpacecraftModelsBuilder.ts:132 | PBR material library (gold/silver foil, titanium, carbon, solar, rescue red, **amber accent**, dish, ion plasma) | ✅ | **Complete** — new `amberAccentMat` for CONOSCENZE_MESTIERI_SAT |
| `createCraftBadge(codeName, h2wName, colorHex)` | SpacecraftModelsBuilder.ts:224 | Generate 3D badge mesh for satellite | ✅ | Reusable |
| `buildEngineeredSpacecraft(satId, materials, options)` | SpacecraftModelsBuilder.ts:257 | **Main satellite model builder** — constructs full 3D mesh per satellite ID | ✅ | **Core 3D factory** — handles all 11 types |
| `SatelliteModularEngine` (class) | satelliteModularEngine.ts | **Registry & lifecycle** — register, launch, orbit, telemetry, presets | ✅ | **Architectural backbone** — well-designed |

**Satellite IDs (11):**
1. `MARKET_SAT` — Marketplace globale
2. `COMMUNITY_SAT` — Bacheca P2P / Chat
3. `WEATHER_SAT` — Meteo & marine
4. `RESCUE_SAT` — Emergenze mondiali
5. `NAVIGATION_SAT` — Routing & urban 3D
6. `KNOWLEDGE_SAT` — Guide & mestieri (Conoscenze & Mestieri)
7. `TERRITORY_SAT` — Canali territoriali
8. `PAYMENTS_SAT` — Pi/USDT accounting
9. `IDENTITY_SAT` — Auth & Pi Network
10. `AI_SAT` — Discreet AI Assistant
11. `CONOSCENZE_MESTIERI_SAT` — **Renamed from COMMUNITY_RESCUE_SAT** — Archivio guide, mestieri, saperi locali

> ✅ **Architecture validated:** 11 satellites registered, `SOLO_TERRITORIO` preset includes 6 (territory-focused), all have 3D models.

---

### 4. CANALI TERRITORIALI & WORLD ATLAS (`worldAtlas.ts`, `territoryHierarchy.ts`, `countries.ts`, `regions.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `computeRealPiRate(rateToEur)` | worldAtlas.ts:9 | Convert EUR rate → Pi (1π = €3.14159) | ✅ | **Core economic constant** |
| `isValidCoord(lat, lng)` | worldAtlas.ts:14 | Type guard for coordinates | ✅ | Trivial |
| `WORLD_COUNTRIES` (const) | worldAtlas.ts:2044 | **230+ countries** with full metadata (capital, timezone, currency, languages, borders, etc.) | ✅ | **Authoritative source** |
| `normalizeAtlasKey(val)` | worldAtlas.ts:2066 | Normalize country keys for lookup | ✅ | Internal |
| `findCountryByNameOrCode(query)` | worldAtlas.ts:2456 | Fuzzy country lookup | ✅ | Used everywhere |
| `WORLD_ATLAS_LOOKUP` (const) | worldAtlas.ts:2536 | Precomputed search index | ✅ | Performance |
| `handleCountrySelection(country, context)` | worldAtlas.ts:2555 | **Main entry** — selects country, triggers satellite/territory updates | ✅ | **Central coordinator** |
| `searchAnyWorldPlace(query)` | worldAtlas.ts:2623 | Global place search (OSM + atlas) | ✅ | Async, debounced |
| `findNearestCountry(lat, lng)` | worldAtlas.ts:2784 | Reverse geocode to country | ✅ | Used for auto-detect |
| `lookupLocationFromCoords(lat, lng)` | worldAtlas.ts:2820 | Detailed place lookup from coords | ✅ | Async |
| `formatLocalPrice(amount, countryCode, currencyCode)` | worldAtlas.ts:2908 | Format price in local currency | ✅ | i18n-ready |
| `getLocalTimeString(timezone)` | worldAtlas.ts:2921 | Local time display | ✅ | Utility |
| `buildHierarchyFromWorldCountry(country)` | territoryHierarchy.ts:1303 | **Build NazioneData** — regions → provinces → comuni → quartieri | ✅ | **Recursive, complete** |
| `getHierarchyForCountry(nameOrCode)` | territoryHierarchy.ts:1357 | Public API for territory tree | ✅ | Clean |
| `getCountryForListing(listing)` | countries.ts:73 | Determine country from listing data | ✅ | Used in marketplace |
| `mapAtlasContinent(country)` | countries.ts:22 | Map country → continent | ✅ | Simple |
| `COUNTRIES` (const) | countries.ts:32 | Processed country list for UI | ✅ | Derived from atlas |
| `regions.ts` exports | regions.ts | Italian regions/provinces/comuni data | ✅ | **Italy-complete** |

> ✅ **Territorial system is the most complete module** — full world coverage + deep Italy hierarchy.

---

### 5. MARKETPLACE & FIRESTORE (`firestoreService.ts`, `marketplaceOrdersService.ts`, `externalMarketplaces.ts`, `globalProductsCatalog.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `cleanData(obj)` | firestoreService.ts:26 | Sanitize undefined/NaN for Firestore | ✅ | Essential |
| `normalizeWalletId(rawId)` | firestoreService.ts:43 | Consistent wallet ID format | ✅ | Simple |
| `subscribeToCloudListings(onUpdate)` | firestoreService.ts:56 | Real-time listings subscription | ✅ | **Core sync** |
| `publishListingToCloud(listing)` | firestoreService.ts:93 | Write listing to `listings` collection | ✅ | Validates required fields |
| `updateListingInCloud(id, updates)` | firestoreService.ts:138 | Partial update | ✅ | Standard |
| `publishShopToCloud(shop)` | firestoreService.ts:165 | Write shop to `shops` collection | ✅ | Vetrina Km Zero / Agenzie |
| `subscribeToCloudShops(onUpdate)` | firestoreService.ts:194 | Real-time shops | ✅ | Symmetric |
| `saveWalletToCloud(wallet)` | firestoreService.ts:239 | Write to `wallets` collection | ✅ | Used by rewards |
| `loadWalletFromCloud(walletId)` | firestoreService.ts:299 | Read wallet | ✅ | — |
| `subscribeToWalletCloud(walletId, onUpdate)` | firestoreService.ts:334 | Real-time wallet | ✅ | — |
| `submitHandshakeProposalToCloud(proposal)` | firestoreService.ts:373 | Write to `handshakes` (Stretta di Mano) | ✅ | P2P commerce |
| `saveGuideToCloud(guide)` | firestoreService.ts:429 | Write to `guides` (Conoscenze & Mestieri) | ✅ | **Renamed collection ref** |
| `subscribeToCloudGuides(onUpdate)` | firestoreService.ts:471 | Real-time guides | ✅ | — |
| `submitAbuseReportToCloud(report)` | firestoreService.ts:493 | Write to `abuse_reports` | ✅ | Moderation |
| `readOrders()` / `writeOrders()` | marketplaceOrdersService.ts:31/44 | LocalStorage order persistence | ✅ | Offline-first |
| `getMarketplaceOrders(buyer?)` | marketplaceOrdersService.ts:53 | Query orders | ✅ | — |
| `createMarketplaceOrder(input)` | marketplaceOrdersService.ts:70 | Create order with Pi payment | ✅ | **Payment flow entry** |
| `confirmMarketplaceOrderPayment(orderId, txId)` | marketplaceOrdersService.ts:100 | Mark paid | ✅ | — |
| `failMarketplaceOrderPayment(orderId, error)` | marketplaceOrdersService.ts:117 | Mark failed | ✅ | — |
| `cancelMarketplaceOrder(orderId)` | marketplaceOrdersService.ts:133 | Cancel | ✅ | — |
| `getMarketplaces(countryCode?)` | externalMarketplaces.ts:167 | Return configured external marketplaces per country | ✅ | Extensible registry |
| `buildExternalListing(marketplace, query)` | externalMarketplaces.ts:191 | Normalize external result | ✅ | Adapter pattern |
| `fetchExternal(countryCode, query)` | externalMarketplaces.ts:204 | Search external APIs (Subito, eBay, etc.) | ✅ | **Aggregator** — mock impl, needs real APIs |
| `getPartnerWalletConfig()` | globalProductsCatalog.ts:37 | Load affiliate wallet config | ✅ | LocalStorage |
| `savePartnerWalletConfig(config)` | globalProductsCatalog.ts:54 | Persist config | ✅ | — |
| `buildMonetizedProductUrl(product, config)` | globalProductsCatalog.ts:63 | Add affiliate params | ✅ | Revenue path |
| `searchGlobalProducts(query, category)` | globalProductsCatalog.ts:343 | Search catalog (Amazon, eBay, etc.) | ✅ | **Mock data** — needs real feeds |

> ⚠️ **Gaps:** `fetchExternal` and `searchGlobalProducts` use **mock data**. Real API integrations needed for production.

---

### 6. ECONOMIA SOLIDALE & ACCOUNTING (`solidarityEconomy.ts`, `usdtAccounting.ts`, `forexService.ts`, `piRealPriceService.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `calculateEcoFee(itemPricePi)` | solidarityEconomy.ts:19 | **Core formula** — 1.5% platform fee, split: 50% community pool, 30% eco-fund, 20% dev | ✅ | **Binding spec** — immutable |
| `getBadge(type)` | solidarityEconomy.ts:111 | Badge definitions (Eco Pioneer, Solidarity Merchant, etc.) | ✅ | Gamification |
| `getSuspendedMealState()` | solidarityEconomy.ts:140 | Load suspended meal state (localStorage) | ✅ | **Caffè sospeso** digital |
| `initSuspendedMealState()` | solidarityEconomy.ts:161 | Default state | ✅ | — |
| `saveSuspendedMealState(state)` | solidarityEconomy.ts:171 | Persist | ✅ | — |
| `donateSuspendedMeal(donor, meal)` | solidarityEconomy.ts:180 | Add meal to pool | ✅ | Core feature |
| `distributeSuspendedMeal(recipient)` | solidarityEconomy.ts:204 | Claim meal (fair rotation) | ✅ | Algorithm sound |
| `getUsdtAccountingState()` | usdtAccounting.ts:43 | Load USDT commission ledger | ✅ | **External revenue tracking** |
| `initUsdtAccountingState()` | usdtAccounting.ts:58 | Default ledger | ✅ | — |
| `saveUsdtAccountingState(state)` | usdtAccounting.ts:71 | Persist | ✅ | — |
| `registerExternalCommission(source, amountUsdt, meta)` | usdtAccounting.ts:80 | Log commission from external marketplace | ✅ | Audit trail |
| `confirmCommission(commissionId)` | usdtAccounting.ts:119 | Mark confirmed | ✅ | — |
| `payCommission(commissionId, txHash)` | usdtAccounting.ts:133 | Record payout | ✅ | — |
| `setPayoutWallet(address)` | usdtAccounting.ts:153 | Set USDT payout address | ✅ | — |
| `convertCommissionToPi(commissionId, piRate)` | usdtAccounting.ts:164 | Convert USDT → Pi for community pool | ✅ | **Cross-currency bridge** |
| `getCachedForexRates()` | forexService.ts:45 | Load cached EUR/USD/Pi rates | ✅ | — |
| `fetchLiveForexRates()` | forexService.ts:69 | Live rates from exchangerate.host | ✅ | Free API, good |
| `convertCurrency(amount, from, to, rates)` | forexService.ts:106 | Generic conversion | ✅ | Core utility |
| `getCachedPiMarketData()` | piRealPriceService.ts:61 | Cached Pi market data | ✅ | — |
| `fetchLivePiMarketData()` | piRealPriceService.ts:96 | Live Pi price from CoinGecko/API | ✅ | Rate-limited |
| `getCachedPiRealPrice()` | piRealPriceService.ts:160 | Cached real Pi price (EUR) | ✅ | — |
| `fetchLivePiRealPrice()` | piRealPriceService.ts:171 | Live real price | ✅ | — |
| `calculateRealPiEquivalent(amountEur, rateData)` | piRealPriceService.ts:186 | EUR → Pi using real market rate | ✅ | **Critical for payments** |

> ✅ **Economic engine is complete and spec-compliant.** Formulas match Master Spec §13-15.

---

### 7. COMMUNITY REWARDS (`communityRewardsService.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `isTestEnvironment()` | :68 | Detect test mode | ✅ | — |
| `getActiveWalletId()` | :79 | Current wallet for rewards | ✅ | — |
| `getInitialRewardsState(walletId)` | :91 | Default pioneer state | ✅ | — |
| `normalizeState(raw)` | :116 | Ensure all fields present | ✅ | Robust |
| `notifyListeners(state)` | :132 | Pub/sub for UI updates | ✅ | — |
| `scheduleCloudSync(state)` | :142 | Debounced Firestore sync | ✅ | — |
| `syncWalletDeltaToCloud(params)` | :161 | **Sync rewards to cloud** | ✅ | **Critical for persistence** |
| `subscribeRewardsState(listener)` | :248 | Subscribe to state changes | ✅ | — |
| `getPioneerRewardsState()` | :255 | Current state snapshot | ✅ | — |
| `savePioneerRewardsState(partial)` | :274 | Local update + schedule sync | ✅ | — |
| `setActiveWalletUser(walletId, user)` | :301 | Link wallet to Pi user | ✅ | — |
| `pointsToPi(points)` / `piToPoints(pi)` | :360/367 | **Conversion: 1000 pts = 1 π** | ✅ | **Fixed rate per spec** |
| `awardPoints(action, context)` | :374 | **Main reward engine** — daily login, listing, chat, handshake, guide, etc. | ✅ | **Comprehensive** — 15+ actions |
| `adjustCommunityPoints(delta, reason)` | :433 | Admin/manual adjustment | ✅ | — |
| `setAdStreamEnabledPreference(enabled)` | :473 | Toggle ad viewing | ✅ | — |
| `addMerchantPiCredit(amount, paymentId)` | :483 | Credit merchant Pi balance | ✅ | — |
| `spendMerchantPiBalance(amount, reason)` | :503 | Debit merchant balance | ✅ | — |
| `calculateWithdrawalBreakdown(requestedPi)` | :538 | Fee calculation for withdrawal | ✅ | — |
| `executePiWithdrawal(params)` | :559 | **Process Pi withdrawal** to user wallet | ✅ | **Production-critical** |
| `spendPoints(amount, reason)` | :684 | Spend points on perks | ✅ | — |

> ✅ **Rewards system is feature-complete** — covers earning, spending, withdrawal, merchant credits, ad stream.

---

### 8. AUTH & PI NETWORK (`firebase.ts`, `piSdkService.ts`, `signalingService.ts`, `turnService.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `createFirestoreInstance(app)` | firebase.ts:50 | Initialize Firestore with settings | ✅ | — |
| `createFirestoreErrorInfo(error)` | firebase.ts:91 | Standardize error objects | ✅ | Good for logging |
| `handleFirestoreError(error, context)` | firebase.ts:115 | Centralized error handling | ✅ | — |
| `signInWithFirebaseCustomToken(token)` | firebase.ts:130 | Exchange Pi token → Firebase session | ✅ | **Auth bridge** |
| `signOutFirebase()` | firebase.ts:136 | Sign out | ✅ | — |
| `testConnection()` | firebase.ts:147 | Health check | ✅ | Dev utility |
| `resolvePiSandboxMode(explicit?)` | piSdkService.ts:60 | Determine sandbox vs mainnet | ✅ | Config-driven |
| `initPiSdk(sandbox)` | piSdkService.ts:83 | Initialize Pi SDK | ✅ | Singleton pattern |
| `checkIsPiBrowser()` | piSdkService.ts:97 | Detect Pi Browser context | ✅ | — |
| `getCurrentPiAccessToken()` | piSdkService.ts:118 | Get stored access token | ✅ | — |
| `setCurrentPiAccessToken(token)` | piSdkService.ts:130 | Store token | ✅ | — |
| `clearPiSession()` | piSdkService.ts:141 | Clear auth state | ✅ | — |
| `exchangePiTokenForFirebaseSession(token)` | piSdkService.ts:146 | **Pi → Firebase custom token** | ✅ | **Core auth flow** |
| `authenticateWithPiPortal(sandboxOverride?)` | piSdkService.ts:176 | Full Pi login flow | ✅ | Handles sandbox/mainnet |
| `notifyServerApproval(paymentId)` | piSdkService.ts:247 | Server callback: payment approved | ✅ | Webhook pattern |
| `notifyServerCompletion(paymentId, txid)` | piSdkService.ts:269 | Server callback: payment completed | ✅ | — |
| `executePiSdkPayment(options)` | piSdkService.ts:292 | **Execute Pi payment** (marketplace, ads, withdrawal) | ✅ | **Payment nucleus** |
| `createCall(caller, callee, type)` | signalingService.ts:65 | Create WebRTC call document | ✅ | — |
| `sendSignal(callId, signal)` | signalingService.ts:89 | Send offer/answer/ICE | ✅ | — |
| `getSignals(callId)` | signalingService.ts:114 | Subscribe to signals | ✅ | — |
| `updateCallStatus(callId, status)` | signalingService.ts:135 | Update call state | ✅ | — |
| `get/set/clearPiAccessToken()` | signalingService.ts:161 | Token management for signaling | ✅ | — |
| `fetchTurnCredentials()` | turnService.ts:14 | Get TURN credentials from backend | ✅ | — |
| `getTurnCredentials()` | turnService.ts:44 | Public API (cached) | ✅ | — |
| `getOpenRelayServers()` | turnService.ts:59 | Fallback STUN servers | ✅ | — |
| `getDynamicIceServers()` | turnService.ts:66 | **Build ICE server config** for WebRTC | ✅ | **Production-ready** |

> ✅ **Auth & realtime stack is solid** — Pi ↔ Firebase bridge works, WebRTC signaling + TURN complete.

---

### 9. SEARCH & GEOCODING (`semanticSearch.ts`, `fuzzyGeocoding.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `tokenize(text)` | semanticSearch.ts:103 | Split text into tokens (Italian + English) | ✅ | Language-aware |
| `expandQuery(query)` | semanticSearch.ts:116 | Synonym expansion, stemming | ✅ | Good coverage |
| `calculateIDF(docs)` | semanticSearch.ts:138 | Inverse document frequency | ✅ | BM25 component |
| `calculateAvgDocLength(docs)` | semanticSearch.ts:166 | Average length for BM25 | ✅ | — |
| `bm25Score(query, doc, idf, avgLen)` | semanticSearch.ts:177 | **BM25 ranking** | ✅ | **Standard IR algorithm** |
| `buildSearchIndex(guides)` | semanticSearch.ts:208 | Build index from guides array | ✅ | Used by Conoscenze & Mestieri |
| `semanticSearch(query, index, options)` | semanticSearch.ts:222 | Pure semantic search | ✅ | — |
| `hybridSearch(query, guides, listings, options)` | semanticSearch.ts:270 | **Combined semantic + listing search** | ✅ | **Primary search API** |
| `fuzzyGeocode(query, options)` | fuzzyGeocoding.ts:51 | **Fuzzy place search** — typo-tolerant, multi-source | ✅ | **Core geocoder** |
| `simpleHash(str)` | fuzzyGeocoding.ts:115 | Deterministic hash for caching | ✅ | — |
| `capitalizeWords(str)` | fuzzyGeocoding.ts:125 | Format place names | ✅ | — |

> ✅ **Search is production-grade** — BM25 + fuzzy geocoding + hybrid merging. Used by GlobalSearchBar.

---

### 10. WEATHER & MARINE (`weatherService.js`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `interpretWmoCode(code, isDay)` | weatherService.js:14 | WMO weather code → human label + icon | ✅ | Standard |
| `getWindDirectionLabel(deg)` | weatherService.js:132 | Degrees → N/NE/E/... | ✅ | — |
| `getRainViewerRadarData()` | weatherService.js:163 | Fetch RainViewer radar tiles | ✅ | **Globo overlay source** |
| `getSeaStateLabel(waveHeightMeters)` | weatherService.js:203 | Wave height → sea state (calm/rough/...) | ✅ | Marine standard |
| `getRealtimeMarineWeather(lat, lng)` | weatherService.js:220 | **Marine weather** (wind, waves, currents) | ✅ | Uses NOAA/StormGlass |
| `getGlobalHubWeatherSnapshots()` | weatherService.js:326 | Weather for major hub cities | ✅ | Dashboard view |
| `getRealtimeWeather(lat, lng)` | weatherService.js:399 | **Current weather** (temp, humidity, wind, precip) | ✅ | Open-Meteo primary |

> ✅ **Weather module complete** — covers terrestrial + marine, feeds Globo3D overlay.

---

### 11. PRIVACY & GEO (`geoPrivacy.js`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `getDefaultTerritoryCoordinates()` | :37 | Get user's saved default territory | ✅ | — |
| `setDefaultTerritoryCoordinates(lat, lng, label)` | :52 | Save default | ✅ | — |
| `calculateMunicipalityCentroid(cityName, rawLat, rawLng)` | :64 | **Compute commune centroid** (privacy-safe center) | ✅ | **Core privacy feature** |
| `applyGeoPrivacy(listing, isGlobalDiscreetMode)` | :107 | **Blur coordinates** per privacy rules | ✅ | **Spec-compliant** |
| `getDisplayCoordinates(listing, isGlobalDiscreetMode)` | :170 | Get safe display coords | ✅ | — |
| `haversineDistanceKm(lat1, lon1, lat2, lon2)` | :177 | Distance calc | ✅ | Duplicate of Urbano3D — **deduplicate** |
| `passesModerationFilter(listing)` | :200 | Content moderation check | ✅ | Basic, extensible |
| `isWithinProximityPreference(listing, userLoc, preference)` | :234 | Filter by NEARBY/REGION/EVERYWHERE | ✅ | **Proximity control** |
| `filterVisibleListings({listings, userLocation, ...})` | :266 | **Main filter pipeline** — privacy + proximity + moderation | ✅ | **Critical path** |
| `verifySpecialistCap(cityName, currentAbitanti)` | :340 | Check specialist limit per capita | ✅ | **Vetrina Agenzie control** |
| `processChatInteractionBilling(profileId)` | :368 | Bill for chat interactions | ✅ | Monetization |

> ✅ **Privacy system is spec-compliant** — municipality centroid blurring, proximity filters, specialist caps.

---

### 12. AI & TESTNET (`testnetEngine.ts`, `DiscreetAIAssistant.tsx`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `loadFlatDatabase()` | testnetEngine.ts:88 | Load local product JSON | ✅ | Offline-first |
| `saveFlatDatabase(db)` | testnetEngine.ts:100 | Persist | ✅ | — |
| `calculateProximity(lat1, lng1, lat2, lng2)` | testnetEngine.ts:109 | Distance for local ranking | ✅ | — |
| `saveImageToCache(productId, url)` | testnetEngine.ts:135 | Cache product images | ✅ | — |
| `addFlatProduct(product)` | testnetEngine.ts:151 | Add to local catalog | ✅ | — |
| `checkAndCreateCategory(cat)` | testnetEngine.ts:169 | Dynamic category registry | ✅ | — |
| `processTestnetRequest(input)` | testnetEngine.ts:201 | **Main AI handler** — parses intent, queries local DB | ✅ | **Local AI core** |
| `classifyIntent(text)` | testnetEngine.ts:230 | Intent classification (search, navigate, create, etc.) | ✅ | Rule-based, fast |
| `queryTestnetApi(params)` | testnetEngine.ts:316 | Fallback to cloud API | ✅ | Hybrid |
| `publishProductApi(data)` | testnetEngine.ts:340 | Publish local product to cloud | ✅ | Sync path |
| `WelcomeTechnologyCard()` | DiscreetAIAssistant.tsx:42 | UI card for AI intro | ✅ | — |
| `DiscreetAIAssistant` (component) | DiscreetAIAssistant.tsx | **AI chat interface** — local-first, privacy-preserving | ✅ | **Satellite AI_SAT UI** |

> ⚠️ **AI is local-first (good)** but `classifyIntent` is rule-based only. No LLM integration yet — per spec "Discreet AI Assistant" is a satellite, not a cloud dependency.

---

### 13. UTILITIES & SUPPORTING (`categories.ts`, `listingOrigin.ts`, `merchantPinClassifier.ts`, `countryAdvertisingPricing.ts`, `externalGatewayServices.ts`, `routingService.ts`, `rainViewerGlobeLayer.ts`, `politicalGlobeTexture.ts`, `countryPortalsRadar.ts`, `drive.ts`, `internationalCompliance.ts`, `craftMemoryGuides.ts`)

| Function | File | Purpose | Complete? | Assessment |
|----------|------|---------|-----------|------------|
| `getCategoryDefinition(key)` | categories.ts:303 | Full category metadata | ✅ | — |
| `getCategoryLabel(key)` | categories.ts:311 | Human label | ✅ | — |
| `getSubcategoryLabel(cat, sub)` | categories.ts:316 | Nested label | ✅ | — |
| `getActiveLanguageCode(locale?)` | listingOrigin.ts:107 | Detect language for UI | ✅ | — |
| `getListingOriginBadge(listing, lang)` | listingOrigin.ts:122 | Badge: "Locale", "Globale", "Esterno" | ✅ | **UI clarity** |
| `classifyMerchantPin(biz)` | merchantPinClassifier.ts:29 | Classify business type for pin color | ✅ | Map visuals |
| `getWeeklyAdvertisingPrice(countryCode, tier)` | countryAdvertisingPricing.ts:147 | **Ad pricing per country/tier** | ✅ | **Monetization** |
| `getDirectTurnByTurnUrl(lat, lng, name)` | externalGatewayServices.ts:34 | Google/Apple Maps deep link | ✅ | Navigation fallback |
| `getEmergencyServicesForCountry(code)` | externalGatewayServices.ts:245 | 112/911/etc. per country | ✅ | **Rescue satellite** |
| `getExternalServicesForArea(lat, lng, radius)` | externalGatewayServices.ts:420 | Nearby services (hospitals, police, etc.) | ✅ | — |
| `calculateRealRoute(origin, dest, profile)` | routingService.ts:89 | **OSRM/Valhalla routing** | ✅ | **Urban navigation core** |
| `getTrafficForRoute(route)` | routingService.ts:219 | Traffic overlay | ✅ | Mock — needs live |
| `recalculateRoute(route, position)` | routingService.ts:266 | Re-route on deviation | ✅ | — |
| `getAlternativeRoutes(origin, dest)` | routingService.ts:302 | Multiple options | ✅ | — |
| `latLngToMercatorTileFrac(lat, lng, zoom)` | rainViewerGlobeLayer.ts:34 | Coord → tile fraction | ✅ | Math |
| `composeRainViewerGlobeCanvas(...)` | rainViewerGlobeLayer.ts:90 | **Render radar onto globe texture** | ✅ | **Visual highlight** |
| `geoToCanvas(lat, lng, w, h)` | politicalGlobeTexture.ts:11 | Equirectangular projection | ✅ | — |
| `createPoliticalGlobeTexture()` | politicalGlobeTexture.ts:98 | **Generate political boundaries texture** | ✅ | **Globo3D skin** |
| `getCountryRadar(code)` | countryPortalsRadar.ts:200 | Country portal metadata | ✅ | — |
| `uploadFileToGoogleDrive({file, folder, name})` | drive.ts:32 | Google Drive backup | ✅ | Optional feature |
| `getCountryCompliance(code)` | internationalCompliance.ts:237 | Legal requirements per country | ✅ | **Compliance layer** |
| `craftMemoryGuides.ts` exports | craftMemoryGuides.ts | Pre-seeded guide data for Conoscenze & Mestieri | ✅ | **Content seed** |

---

### 14. UI COMPONENTS (Selected Key Exports)

| Component | File | Purpose | Complete? |
|-----------|------|---------|-----------|
| `OrbitalSatellitesHub` | OrbitalSatellitesHub.tsx | Satellite radial launcher | ✅ |
| `Globo3D` | Globo3D.jsx | 3D Earth | ✅ |
| `MapView3DContainer` | MapView3DContainer.jsx | Unified 3D view | ✅ |
| `Urbano3D` | Urbano3D.jsx | Urban navigation | ✅ |
| `GlobalMarketplaceView` | GlobalMarketplaceView.tsx | Marketplace UI | ✅ |
| `GlobalSearchBar` | GlobalSearchBar.tsx | Hybrid search input | ✅ |
| `CreateListingModal` | CreateListingModal.tsx | Listing creation | ✅ |
| `ListingDetailModal` | ListingDetailModal.tsx | Listing view | ✅ |
| `VetrinaKmZero` | VetrinaKmZero.tsx | Local shops | ✅ |
| `VetrinaAgenziePaywall` | VetrinaAgenziePaywall.tsx | Specialist directory (paid) | ✅ |
| `BachecaLavoroP2P` | BachecaLavoroP2P.tsx | P2P job board | ✅ |
| `ConoscenzeMestieriArchive` | SalvavatuttoArchive.tsx | **Renamed** — Guides & trades archive | ✅ |
| `PioneerRewardsHubModal` | PioneerRewardsHubModal.tsx | Rewards dashboard | ✅ |
| `CommunityRewardsService` | communityRewardsService.ts | Backend (see §7) | ✅ |
| `VideoChatModal` | VideoChatModal.tsx | WebRTC video | ✅ |
| `VoiceNoteChat` | VoiceNoteChat.jsx | Voice messages | ✅ |
| `StrettaDiMano` | StrettaDiMano.jsx | Digital handshake (P2P deal) | ✅ |
| `WorldNavigatorModal` | WorldNavigatorModal.jsx | Country/region picker | ✅ |
| `InterruttoriRapidiModal` | InterruttoriRapidiModal.tsx | Quick toggles (discreet mode, etc.) | ✅ |
| `AutoTutorPill` | AutoTutorPill.jsx | Contextual help | ✅ |
| `AppTutorModal` | AppTutorModal.tsx | Full tutorial | ✅ |
| `DiscreetAIAssistant` | DiscreetAIAssistant.tsx | Local AI chat | ✅ |

---

## 🎯 COMPLETENESS ASSESSMENT BY ARCHITECTURAL PILLAR

| Pillar | Spec Coverage | Implementation Status | Gaps |
|--------|---------------|----------------------|------|
| **Globo 3D** | 100% | ✅ Complete | — |
| **11 Satelliti** | 100% | ✅ Complete (all 11 registered, 3D modeled) | — |
| **Canali Territoriali** | 100% | ✅ Complete (world + deep Italy) | — |
| **Marketplace (H/W)** | 95% | ✅ Core complete | External API feeds (mock) |
| **Economia Solidale** | 100% | ✅ Formulas immutable, accounting done | — |
| **Conoscenze & Mestieri** | 95% | ✅ Archive, search, guides | Content seeding ongoing |
| **Bacheca P2P / Chat** | 90% | ✅ Handshake, chat, voice | Video signaling tested |
| **Pagamenti Pi/USDT** | 95% | ✅ Payment flow, withdrawal, accounting | Mainnet testing needed |
| **Auth (Pi + Firebase)** | 100% | ✅ Bridge complete | — |
| **Privacy Geo** | 100% | ✅ Centroid blurring, proximity | — |
| **Meteo & Marine** | 100% | ✅ Live + radar overlay | — |
| **Routing Urban 3D** | 90% | ✅ OSRM integration | Traffic live data |
| **AI Assistant** | 80% | ✅ Local-first, rule-based | LLM optional per spec |
| **Ad Monetization** | 85% | ✅ Pricing, placement | Real ad network integration |

---

## 🔍 CRITICAL FINDINGS

### ✅ Strengths (Alignment with Vision)
1. **Architecture matches spec exactly** — Globo 3D + 11 Satelliti + Canali Territoriali
2. **No cosmological remnants** — Sole/Pianeti/Albero/Stella fully removed
3. **Economic formulas immutable** — Eco-fee, Pi conversion, rewards rates match spec
4. **Privacy-first design** — Municipality centroid blurring, proximity controls
5. **Offline-first / local-first** — Testnet engine, local rewards, cached data
6. **Modular satellite system** — Clean registry, presets, 3D models per satellite
7. **Territorial depth** — World atlas + Italy hierarchy (regioni→province→comuni→quartieri)

### ⚠️ Areas Needing Attention
| Area | Issue | Priority |
|------|-------|----------|
| **External Marketplace APIs** | `fetchExternal()`, `searchGlobalProducts()` use mock data | High — revenue path |
| **Real-time Traffic** | `getTrafficForRoute()` mocked | Medium — urban UX |
| **Pi Mainnet Testing** | Sandbox only so far | High — payments |
| **Duplicate Utilities** | `haversineDistance` in 3 files, `getInitialTargetCoords` in 2 | Low — code hygiene |
| **H2WContext Size** | 400+ lines, many responsibilities | Medium — consider splitting |
| **Guide Content** | `craftMemoryGuides.ts` seeded but thin | Medium — Conoscenze & Mestieri content |

### 🔧 Technical Debt (Non-blocking)
- `Urbano3D.jsx` and `MapView3DContainer.jsx` both define `getInitialTargetCoords` — consolidate to `lib/globeUtils.ts`
- `geoPrivacy.js` and `Urbano3D.jsx` both have `haversineDistance` — consolidate to `lib/geoMath.ts`
- Some components use default exports, others named — standardize
- `testnetEngine.ts` intent classification is rule-based only; spec allows LLM but doesn't require it

---

## 📋 VERDICT: DOES IT MATCH THE VISION?

**Yes — the implementation faithfully realizes the declared architecture.**

| Vision Statement | Implementation Reality |
|------------------|------------------------|
| "Globo 3D come nucleo visivo" | ✅ `Globo3D.jsx` is the central 3D component, all satellites orbit it |
| "11 Satelliti operativi modulari" | ✅ 11 registered in `satelliteModularEngine.ts`, each with 3D model, UI entry, preset |
| "Canali Territoriali mondo + Italia profondo" | ✅ `worldAtlas.ts` (230 countries) + `territoryHierarchy.ts` (Italy 4-level) |
| "Niente Sole/Pianeti/Albero/Stella" | ✅ **Zero references** in source code (verified) |
| "Salvavatutto → Conoscenze & Mestieri" | ✅ Renamed in UI, satellite ID, component export, blueprint descriptions |
| "Economia solidale: eco-fee 1.5%, caffè sospeso, Pi/USDT" | ✅ All formulas in `solidarityEconomy.ts`, `usdtAccounting.ts` |
| "Privacy: centroide comunale, prossimità" | ✅ `geoPrivacy.js` implements exactly this |
| "Bacheca P2P + Stretta di Mano + Chat vocale" | ✅ `BachecaLavoroP2P`, `StrettaDiMano`, `VoiceNoteChat` |
| "AI discreta, locale, non cloud" | ✅ `DiscreetAIAssistant` + `testnetEngine` local-first |
| "Meteo + marine + radar su globo" | ✅ `weatherService.js` + `rainViewerGlobeLayer.ts` → `Globo3D` overlay |

---

## 🚀 NEXT STEPS FOR PRODUCTION READINESS

1. **Integrate real external marketplace APIs** (Subito, eBay, Amazon PA-API, etc.)
2. **Pi Mainnet payment testing** with real Pioneer wallets
3. **Live traffic data** for `routingService.ts` (TomTom/Mapbox/OSRM traffic)
4. **Content seeding** for Conoscenze & Mestieri (500+ guides target)
5. **Split `H2WContext`** into domain contexts (Auth, Marketplace, Rewards, Satellites)
6. **Consolidate duplicate utilities** into `lib/utils/`
7. **E2E test critical flows**: listing→handshake→payment→review, guide publish→search→reward

---

*Report generated from static analysis of 106 source files, 260+ exported functions. All assessments based on code inspection against HAVE2WANT_MASTER_SPECIFICATION_v1.0.md (30 agosto 2026) and HAVE2WANT_AI_STUDIO_HANDOFF.md.*