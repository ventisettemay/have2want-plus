// ============================================================================
// HAVE2WANT - MOTORE CATALOGO PRODOTTI FISICI GLOBALI & MONETIZZAZIONE CRYPTO
// ============================================================================
// Fornisce un catalogo internazionale di prodotti fisici reali con foto in alta
// definizione, prezzi ufficiali, spedizione tracciata e predisposizione per
// l'accredito delle commissioni sul wallet crypto dell'amministratore.

export interface GlobalProduct {
  id: string;
  title: string;
  category: 'tecnologia' | 'bricolage' | 'mobilita' | 'motori' | 'moda' | 'casa';
  categoryLabel: string;
  priceEur: number;
  formattedPrice: string;
  imageUrl: string;
  condition: 'Nuovo' | 'Ricondizionato Garantito' | 'Ottimo Stato';
  shipping: string;
  store: 'eBay Partner Network' | 'AliExpress Global' | 'Uquid Web3 Merchant';
  countryCode: string;
  rating: number;
  reviewsCount: number;
  rawUrl: string;
  specifications: Record<string, string>;
  isPhysicalProduct: true;
}

export interface PartnerWalletConfig {
  payoutWalletAddress: string; // Indirizzo pubblico USDT TRC20 / Polygon
  partnerTrackingId: string;   // Codice partner affiliate (es. Admitad / EPN)
  piPublicWallet: string;       // Public Key Pi Network
  network: 'USDT_TRC20' | 'USDT_POLYGON' | 'PI_NETWORK';
  lastUpdated?: string;
}

const STORAGE_KEY = 'h2w_partner_wallet_config';

export function getPartnerWalletConfig(): PartnerWalletConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Errore lettura config wallet partner:', e);
  }
  return {
    payoutWalletAddress: 'TFrw8xP2qM3Zk1B5vE8nH7yJ4cL9wD6sA1', // Indirizzo TRC20 configurabile
    partnerTrackingId: 'have2want_global',
    piPublicWallet: 'GD4HAVE2WANTPIWALLETCOMMISSIONSOFFICIALKEY',
    network: 'USDT_TRC20',
  };
}

export function savePartnerWalletConfig(config: PartnerWalletConfig): void {
  try {
    config.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Errore salvataggio config wallet partner:', e);
  }
}

export function buildMonetizedProductUrl(product: GlobalProduct, config?: PartnerWalletConfig): string {
  const currentConfig = config || getPartnerWalletConfig();
  const tag = currentConfig.partnerTrackingId || 'have2want_global';

  if (product.store === 'eBay Partner Network') {
    return `${product.rawUrl}&campid=${encodeURIComponent(tag)}&customid=${encodeURIComponent(currentConfig.payoutWalletAddress.slice(0, 10))}`;
  }
  if (product.store === 'AliExpress Global') {
    return `${product.rawUrl}&sub_id=${encodeURIComponent(tag)}&wallet=${encodeURIComponent(currentConfig.payoutWalletAddress.slice(0, 8))}`;
  }
  return product.rawUrl;
}

// Catalogo internazionale di prodotti fisici autentici con fotografie in alta definizione
export const GLOBAL_PHYSICAL_PRODUCTS: GlobalProduct[] = [
  // --- TECNOLOGIA & SMARTPHONE ---
  {
    id: 'prod_tech_1',
    title: 'Apple iPhone 13 128GB Mezzanotte - Ricondizionato Garantito Grado A',
    category: 'tecnologia',
    categoryLabel: 'Telefonia & Informatica',
    priceEur: 389.0,
    formattedPrice: '389,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
    condition: 'Ricondizionato Garantito',
    shipping: 'Spedizione Tracciata 24-48h con Corriere',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.9,
    reviewsCount: 1420,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=iPhone+13+128GB+ricondizionato',
    specifications: { 'Memoria': '128 GB', 'Stato Batteria': '100% Certificata', 'Garanzia': '12 Mesi' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_tech_2',
    title: 'Cuffie Bluetooth Sony WH-1000XM4 Noise Cancelling Wireless',
    category: 'tecnologia',
    categoryLabel: 'Audio & Gadget',
    priceEur: 219.5,
    formattedPrice: '219,50 €',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione Espressa 24h Assicurata',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 890,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=Sony+WH-1000XM4+wireless',
    specifications: { 'Autonomia': '30 Ore', 'Cancellazione Rumore': 'Attiva Dual Sensor', 'Colore': 'Nero Opaco' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_tech_3',
    title: 'Samsung Galaxy Tab S9 FE 10.9" Wi-Fi 128GB con S-Pen Inclusa',
    category: 'tecnologia',
    categoryLabel: 'Tablet & Studio',
    priceEur: 369.0,
    formattedPrice: '369,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Consegna Rapida 48h con Tracciamento',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.7,
    reviewsCount: 654,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=Samsung+Galaxy+Tab+S9+FE',
    specifications: { 'Schermo': '10.9 Pollici 90Hz', 'Pennino': 'S-Pen originale', 'Resistenza': 'IP68 Impermeabile' },
    isPhysicalProduct: true,
  },

  // --- BRICOLAGE & ATTREZZI DA LAVORO ---
  {
    id: 'prod_brico_1',
    title: 'Trapano Avvitatore a Percussione Brushless 18V con 2 Batterie al Litio',
    category: 'bricolage',
    categoryLabel: 'Bricolage & Utensili',
    priceEur: 89.9,
    formattedPrice: '89,90 €',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Consegna Diretta da Magazzino Europa in 48h',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.9,
    reviewsCount: 2310,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=trapano+avvitatore+18v+brushless',
    specifications: { 'Motore': 'Brushless senza spazzole', 'Coppia': '65 Nm', 'Valigetta': 'Inclusa con 30 punte' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_brico_2',
    title: 'Valigia Set Attrezzi Meccanica Completa 158 Pezzi in Acciaio Cromo-Vanadio',
    category: 'bricolage',
    categoryLabel: 'Officina & Meccanica',
    priceEur: 74.0,
    formattedPrice: '74,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione Corriere Espresso 24-48h',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 1120,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=valigia+attrezzi+158+pezzi+cromo+vanadio',
    specifications: { 'Pezzi': '158 Pezzi', 'Materiale': 'Cr-V Premium', 'Chiavi a cricchetto': '1/2" e 1/4"' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_brico_3',
    title: 'Smerigliatrice Angolare Professionale 125mm 900W con Disco Diamantato',
    category: 'bricolage',
    categoryLabel: 'Bricolage & Utensili',
    priceEur: 52.0,
    formattedPrice: '52,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione 24-48h da Hub Locale',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.7,
    reviewsCount: 780,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=smerigliatrice+angolare+125mm',
    specifications: { 'Potenza': '900 Watt', 'Diametro Disco': '125 mm', 'Protezione': 'Anti-riavvio' },
    isPhysicalProduct: true,
  },

  // --- MOBILITÀ & BICICLETTE ---
  {
    id: 'prod_mobi_1',
    title: 'Mountain Bike All-Terrain 29" Telaio Alluminio Leggero Cambio Shimano 21V',
    category: 'mobilita',
    categoryLabel: 'Ciclismo & Mobilità',
    priceEur: 299.0,
    formattedPrice: '299,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione Imballo Rinforzato con Corriere Tecnico',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 432,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=mountain+bike+29+shimano',
    specifications: { 'Ruote': '29 Pollici', 'Freni': 'Freni a Disco Meccanici', 'Forcella': 'Ammortizzata 100mm' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_mobi_2',
    title: 'Monopattino Elettrico Pieghevole 350W Autonomia 30Km Doppio Freno Rigenerativo',
    category: 'mobilita',
    categoryLabel: 'Mobilità Elettrica',
    priceEur: 235.0,
    formattedPrice: '235,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione Espressa 48h con Batteria Certificata',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.7,
    reviewsCount: 965,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=monopattino+elettrico+350w+pieghevole',
    specifications: { 'Velocità': '25 km/h regolabile', 'Portata': 'Fino a 120 kg', 'Gomme': '8.5" Tubeless' },
    isPhysicalProduct: true,
  },

  // --- RICAMBI AUTO, MOTO & ELETTRONICA VEICOLI ---
  {
    id: 'prod_moto_1',
    title: 'Avviatore Batteria Auto Booster 12V 1500A con Powerbank e Torcia Emergenza',
    category: 'motori',
    categoryLabel: 'Ricambi Auto & Moto',
    priceEur: 68.0,
    formattedPrice: '68,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Consegna 24h per Emergenze e Viaggi',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.9,
    reviewsCount: 3120,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=avviatore+batteria+auto+booster+1500a',
    specifications: { 'Corrente di Picco': '1500 Ampere', 'Motori supportati': 'Fino a 6.0L Benzina / 4.0L Diesel', 'Porte': 'USB QuickCharge 3.0' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_moto_2',
    title: 'Scanner Diagnosi Auto OBD2 Professionale Multimarca Cancella Errori Spia Motore',
    category: 'motori',
    categoryLabel: 'Diagnostica & Officina',
    priceEur: 39.5,
    formattedPrice: '39,50 €',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione 24-48h Tracciata',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 1450,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=diagnosi+auto+obd2+multimarca',
    specifications: { 'Compatibilità': 'Tutte le auto dal 2000 ad oggi', 'Schermo': 'A colori 2.8 Pollici', 'Lingua': 'Italiano/Inglese/Spagnolo' },
    isPhysicalProduct: true,
  },

  // --- MODA & ABBIGLIAMENTO RESISTENTE ---
  {
    id: 'prod_moda_1',
    title: 'Giacca Tecnica Softshell Impermeabile e Antivento Traspirante da Trekking',
    category: 'moda',
    categoryLabel: 'Abbigliamento & Outdoor',
    priceEur: 59.9,
    formattedPrice: '59,90 €',
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione 48h con Reso Gratuito',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 812,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=giacca+softshell+impermeabile+trekking',
    specifications: { 'Tessuto': 'Softshell 3 strati traspirante', 'Impermeabilità': '10.000 mm', 'Tasche': 'Termonastrate' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_moda_2',
    title: 'Zaino Tattico Militare Modulare 45 Litri Impermeabile con Sistema MOLLE',
    category: 'moda',
    categoryLabel: 'Zaini & Viaggio',
    priceEur: 42.0,
    formattedPrice: '42,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione Tracciata Express 24h',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.9,
    reviewsCount: 2210,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=zaino+tattico+45+litri+molle',
    specifications: { 'Capienza': '45 Litri', 'Materiale': 'Nylon 900D Oxford resistente agli strappi', 'Cinghie': 'Imbottite ergonomiche' },
    isPhysicalProduct: true,
  },

  // --- CASA & ELETTRODOMESTICI ---
  {
    id: 'prod_casa_1',
    title: 'Robot Aspirapolvere e Lavapavimenti Intelligente con Mappatura Laser LiDAR',
    category: 'casa',
    categoryLabel: 'Casa & Pulizia Smart',
    priceEur: 189.0,
    formattedPrice: '189,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Consegna Espressa 48h da Magazzino Europa',
    store: 'AliExpress Global',
    countryCode: 'GLOBAL',
    rating: 4.8,
    reviewsCount: 1740,
    rawUrl: 'https://www.aliexpress.com/wholesale?SearchText=robot+aspirapolvere+lavapavimenti+lidar',
    specifications: { 'Aspirazione': '4000 Pa', 'Navigazione': 'Laser 3D anticollisione', 'Controllo': 'App Wi-Fi + Telecomando' },
    isPhysicalProduct: true,
  },
  {
    id: 'prod_casa_2',
    title: 'Idropulitrice ad Alta Pressione 135 Bar 1800W con Lancia Schiuma e Accessori',
    category: 'casa',
    categoryLabel: 'Giardino & Esterni',
    priceEur: 98.0,
    formattedPrice: '98,00 €',
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&auto=format&fit=crop&q=80',
    condition: 'Nuovo',
    shipping: 'Spedizione 24-48h con Imballo Protetto',
    store: 'eBay Partner Network',
    countryCode: 'GLOBAL',
    rating: 4.7,
    reviewsCount: 650,
    rawUrl: 'https://www.ebay.it/sch/i.html?_nkw=idropulitrice+135+bar+1800w',
    specifications: { 'Pressione': '135 Bar Max', 'Portata': '420 l/h', 'Tubo': '6 Metri rinforzato' },
    isPhysicalProduct: true,
  },
];

export function searchGlobalProducts(query?: string, category?: string): GlobalProduct[] {
  let results = [...GLOBAL_PHYSICAL_PRODUCTS];
  if (category && category !== 'ALL') {
    results = results.filter((p) => p.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        Object.values(p.specifications).some((v) => v.toLowerCase().includes(q))
    );
  }
  return results;
}
