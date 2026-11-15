/**
 * TESTNET ENGINE - HAVE2WANT
 * Modulo consolidato per la gestione del Flat DB, calcolo geospaziale Haversine,
 * caching immagini, categorizzazione automatica (>10 prodotti) e Intent Classification 18+ compliant.
 */

export interface TechnicalSpecs {
  anno?: string;
  chilometraggio?: string;
  alimentazione?: string;
  [key: string]: string | undefined;
}

export interface ProductLocation {
  store_name?: string;
  latitude: number;
  longitude: number;
}

export interface FlatProduct {
  product_id: string;
  product_name: string;
  current_category: string;
  is_18_plus: boolean;
  technical_specs: TechnicalSpecs;
  location: ProductLocation;
  image_url: string | null;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  category: string;
  is_18_plus: boolean;
  specs: TechnicalSpecs;
  image: string;
  distance_km: number;
  location_name?: string;
}

export interface IntentResult {
  matched: boolean;
  product?: ProcessedProduct;
  text_response: string;
  intent_type: "product_lookup" | "catalog_list" | "general_query";
}

// 1. FLAT DATABASE INIZIALE (Persistenza supportata tramite LocalStorage)
export const INITIAL_FLAT_DATABASE: FlatProduct[] = [
  {
    product_id: "TXT-001",
    product_name: "BMW X5",
    current_category: "Varie",
    is_18_plus: true,
    technical_specs: {
      anno: "2023",
      chilometraggio: "45.000 km",
      alimentazione: "Diesel",
    },
    location: {
      store_name: "Concessionario Nord",
      latitude: 45.4642,
      longitude: 9.19,
    },
    image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80",
  },
  {
    product_id: "TXT-002",
    product_name: "Audi Q5",
    current_category: "Varie",
    is_18_plus: false,
    technical_specs: {
      anno: "2022",
      chilometraggio: "30.000 km",
      alimentazione: "Ibrida",
    },
    location: {
      store_name: "Autosalone Ovest",
      latitude: 45.0703,
      longitude: 7.6869,
    },
    image_url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80",
  },
];

const STORAGE_KEY = "h2w_testnet_flat_db";

export function loadFlatDatabase(): FlatProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return INITIAL_FLAT_DATABASE;
}

export function saveFlatDatabase(db: FlatProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    // localstorage fail-safe
  }
}

// 2. CALCOLO GEOMETRICO DELLA DISTANZA (Formula di Haversine)
export function calculateProximity(
  userLat: number,
  userLng: number,
  partnerLat: number,
  partnerLng: number
): number {
  const R = 6371.0; // Raggio medio della Terra in km
  const toRad = (v: number) => (v * Math.PI) / 180.0;

  const lat1 = toRad(userLat);
  const lon1 = toRad(userLng);
  const lat2 = toRad(partnerLat);
  const lon2 = toRad(partnerLng);

  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 3. PERSISTENZA IMMAGINI (Cache) & AGGIUNTA PRODOTTI
export function saveImageToCache(productId: string, imageUrl: string): boolean {
  const db = loadFlatDatabase();
  let found = false;
  for (const item of db) {
    if (item.product_id === productId) {
      item.image_url = imageUrl;
      found = true;
      break;
    }
  }
  if (found) {
    saveFlatDatabase(db);
  }
  return found;
}

export function addFlatProduct(product: Omit<FlatProduct, "product_id"> & { product_id?: string }): FlatProduct {
  const db = loadFlatDatabase();
  const nextNum = db.length + 1;
  const newId = product.product_id || `TXT-${String(nextNum).padStart(3, "0")}`;
  const newProduct: FlatProduct = {
    ...product,
    product_id: newId,
    current_category: product.current_category || "Varie",
    is_18_plus: Boolean(product.is_18_plus),
    image_url: product.image_url || null,
  };
  db.push(newProduct);
  checkAndCreateCategory(db);
  saveFlatDatabase(db);
  return newProduct;
}

// 4. AUTOMATIC CATEGORIZATION TRIGGER (> 10 Prodotti per brand)
export function checkAndCreateCategory(
  database: FlatProduct[],
  threshold = 10
): boolean {
  const counts: Record<string, number> = {};
  for (const item of database) {
    if (item.current_category === "Varie") {
      const brand = item.product_name.split(" ")[0];
      counts[brand] = (counts[brand] || 0) + 1;
    }
  }

  let modified = false;
  for (const [brand, count] of Object.entries(counts)) {
    if (count > threshold) {
      const newCat = `Categoria ${brand}`;
      for (const item of database) {
        if (item.product_name.startsWith(brand)) {
          item.current_category = newCat;
          modified = true;
        }
      }
    }
  }

  if (modified) {
    saveFlatDatabase(database);
  }
  return modified;
}

// 5. PROCESS REQUEST & ENRICHMENT
export function processTestnetRequest(
  userLat: number,
  userLng: number
): ProcessedProduct[] {
  const db = loadFlatDatabase();
  checkAndCreateCategory(db);

  return db.map((p) => {
    const distance = calculateProximity(
      userLat,
      userLng,
      p.location.latitude,
      p.location.longitude
    );

    return {
      id: p.product_id,
      name: p.product_name,
      category: p.current_category,
      is_18_plus: p.is_18_plus,
      specs: p.technical_specs,
      image: p.image_url || "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80",
      distance_km: distance,
      location_name: p.location.store_name,
    };
  });
}

// 6. INTENT CLASSIFICATION & NATURAL TEXT FORMATTING
export function classifyIntent(
  userText: string,
  userLat: number,
  userLng: number
): IntentResult {
  const enriched = processTestnetRequest(userLat, userLng);
  const normalized = userText.toLowerCase().trim();

  // Ricerca entità specifica nel catalogo
  for (const prod of enriched) {
    const nameLower = prod.name.toLowerCase();
    const parts = nameLower.split(" ");
    const isMatched =
      normalized.includes(nameLower) ||
      parts.some((part) => part.length > 1 && normalized.includes(part)) ||
      normalized.includes(prod.id.toLowerCase());

    if (isMatched) {
      // Regola tassativa 3: Per i prodotti is_18_plus: true, mantenere un tono puramente informativo e descrittivo, zero incitamento.
      if (prod.is_18_plus) {
        const specSummary = Object.entries(prod.specs)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join(" | ");

        const textResponse =
          `Scheda Tecnica Informativa: ${prod.name} (ID: ${prod.id}).\n` +
          `Categoria: ${prod.category}.\n` +
          `Specifiche registrate: ${specSummary}.\n` +
          `Ubicazione: ${prod.location_name || "Punto Partner"}. Il prodotto si trova a ${prod.distance_km} km da te.\n` +
          `Nota di sistema: Elemento soggetto a classificazione tecnica 18+. Informazione fornita a carattere puramente documentale.`;

        return {
          matched: true,
          product: prod,
          text_response: textResponse,
          intent_type: "product_lookup",
        };
      } else {
        const specSummary = Object.entries(prod.specs)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join(" | ");

        const textResponse =
          `Trovato veicolo nel catalogo: ${prod.name} (ID: ${prod.id}).\n` +
          `Specifiche: ${specSummary}.\n` +
          `Ubicazione: ${prod.location_name || "Punto Partner"}. Il prodotto si trova a ${prod.distance_km} km da te.`;

        return {
          matched: true,
          product: prod,
          text_response: textResponse,
          intent_type: "product_lookup",
        };
      }
    }
  }

  // Se l'utente chiede un elenco o una ricerca generale
  if (
    normalized.includes("tutti") ||
    normalized.includes("catalogo") ||
    normalized.includes("auto") ||
    normalized.includes("macchine") ||
    normalized.includes("veicoli") ||
    normalized.includes("disponibili")
  ) {
    const listLines = enriched.map((p) => {
      const badge18 = p.is_18_plus ? " [18+ Informativo]" : "";
      return `• ${p.name} (ID: ${p.id}) - Distanza: ${p.distance_km} km da te - ${p.category}${badge18}`;
    });

    return {
      matched: true,
      text_response: `Nel catalogo Flat DB sono presenti i seguenti elementi:\n${listLines.join("\n")}`,
      intent_type: "catalog_list",
    };
  }

  return {
    matched: false,
    text_response: `Nessuna entità specifica identificata per "${userText}". Puoi richiedere ad esempio "BMW X5", "Audi Q5" o l'elenco dei veicoli disponibili.`,
    intent_type: "general_query",
  };
}

// 7. ASYNC API CLIENT FOR FLASK REST ENDPOINTS (/api/testnet/query, /api/testnet/publish)
export async function queryTestnetApi(
  queryText: string,
  userLat: number,
  userLng: number
): Promise<ProcessedProduct[]> {
  try {
    const res = await fetch("/api/testnet/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query_text: queryText,
        user_lat: userLat,
        user_lng: userLng,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Flask backend offline o in dev statico -> usa engine locale
  }
  return processTestnetRequest(userLat, userLng);
}

export async function publishProductApi(data: {
  product_name: string;
  specs_anno: string;
  user_lat: number;
  user_lng: number;
  is_18_plus: boolean;
  imageFile?: File | null;
  imageUrl?: string | null;
}): Promise<{ status: string; product_id: string; image_url?: string | null }> {
  // Prova prima la chiamata HTTP multipart su Flask /api/testnet/publish
  try {
    const formData = new FormData();
    formData.append("product_name", data.product_name);
    formData.append("specs_anno", data.specs_anno);
    formData.append("user_lat", String(data.user_lat));
    formData.append("user_lng", String(data.user_lng));
    formData.append("is_18_plus", String(data.is_18_plus));
    if (data.imageFile) {
      formData.append("image", data.imageFile);
    }

    const res = await fetch("/api/testnet/publish", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (e) {
    // Fallback locale
  }

  // Fallback se Flask non è in ascolto
  const newProd = addFlatProduct({
    product_name: data.product_name,
    current_category: "Varie",
    is_18_plus: data.is_18_plus,
    technical_specs: { anno: data.specs_anno },
    location: {
      latitude: data.user_lat,
      longitude: data.user_lng,
    },
    image_url: data.imageUrl || null,
  });

  return {
    status: "success",
    product_id: newProd.product_id,
    image_url: newProd.image_url,
  };
}

