export interface ExternalMarketplace {
  id: string;
  name: string;
  country: string;
  countryName: string;
  flag: string;
  url: string;
  type: 'global_auction' | 'classifieds' | 'second_hand' | 'hyperlocal';
  description: string;
}

export interface ExternalListing {
  id: string;
  title: string;
  price: string;
  url: string;
  marketplace: string;
  country: string;
  flag: string;
}

// Associazione dinamica Paese -> Marketplace leader mondiali
export const COUNTRY_MARKETPLACES: Record<string, ExternalMarketplace[]> = {
  // 🌐 GLOBALE / MONDO INTERO
  GLOBAL: [
    { id: 'ebay_global', name: 'eBay Worldwide', country: 'GLOBAL', countryName: 'Tutto il Mondo', flag: '🌐', url: 'https://www.ebay.com/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Mercato globale per compravendite e spedizioni mondiali' },
    { id: 'aliexpress_global', name: 'AliExpress Global', country: 'GLOBAL', countryName: 'Tutto il Mondo', flag: '🌐', url: 'https://www.aliexpress.com/wholesale?SearchText={query}', type: 'second_hand', description: 'Catalogo mondiale di fornitori e commercio internazionale' },
    { id: 'amazon_global', name: 'Amazon Global Store', country: 'GLOBAL', countryName: 'Tutto il Mondo', flag: '🌐', url: 'https://www.amazon.com/s?k={query}', type: 'second_hand', description: 'Offerte internazionali con spedizione globale' },
  ],

  // 🇺🇸 STATI UNITI
  US: [
    { id: 'ebay_us', name: 'eBay US', country: 'US', countryName: 'Stati Uniti', flag: '🇺🇸', url: 'https://www.ebay.com/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Piattaforma numero uno USA per aste e acquisti garantiti' },
    { id: 'craigslist_us', name: 'Craigslist', country: 'US', countryName: 'Stati Uniti', flag: '🇺🇸', url: 'https://www.craigslist.org/search/sss?query={query}', type: 'classifieds', description: 'Bacheca storica di annunci locali per città e contee' },
    { id: 'offerup_us', name: 'OfferUp', country: 'US', countryName: 'Stati Uniti', flag: '🇺🇸', url: 'https://offerup.com/search?q={query}', type: 'hyperlocal', description: 'App mobile per compravendita di prossimità con profili verificati' },
    { id: 'mercari_us', name: 'Mercari US', country: 'US', countryName: 'Stati Uniti', flag: '🇺🇸', url: 'https://www.mercari.com/search/?keyword={query}', type: 'second_hand', description: 'Marketplace di seconda mano rapido per privati' },
  ],

  // 🇬🇧 REGNO UNITO
  GB: [
    { id: 'ebay_gb', name: 'eBay UK', country: 'GB', countryName: 'Regno Unito', flag: '🇬🇧', url: 'https://www.ebay.co.uk/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Leader nazionale britannico per compravendita' },
    { id: 'gumtree_gb', name: 'Gumtree UK', country: 'GB', countryName: 'Regno Unito', flag: '🇬🇧', url: 'https://www.gumtree.com/search?search_category=all&q={query}', type: 'classifieds', description: 'Bacheca di annunci locali e motori nel Regno Unito' },
    { id: 'vinted_gb', name: 'Vinted UK', country: 'GB', countryName: 'Regno Unito', flag: '🇬🇧', url: 'https://www.vinted.co.uk/vetements?search_text={query}', type: 'second_hand', description: 'Piattaforma C2C per abbigliamento e oggetti usati' },
  ],

  // 🇩🇪 GERMANIA
  DE: [
    { id: 'kleinanzeigen_de', name: 'Kleinanzeigen', country: 'DE', countryName: 'Germania', flag: '🇩🇪', url: 'https://www.kleinanzeigen.de/s-{query}/k0', type: 'classifieds', description: 'Il punto di riferimento assoluto tedesco per il mercatino dell\'usato' },
    { id: 'ebay_de', name: 'eBay Deutschland', country: 'DE', countryName: 'Germania', flag: '🇩🇪', url: 'https://www.ebay.de/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Aste e vendite dirette in Germania e Centro Europa' },
  ],

  // 🇫🇷 FRANCIA
  FR: [
    { id: 'leboncoin_fr', name: 'Leboncoin', country: 'FR', countryName: 'Francia', flag: '🇫🇷', url: 'https://www.leboncoin.fr/recherche?text={query}', type: 'classifieds', description: 'L\'istituzione francese per gli annunci locali e lo scambio tra privati' },
    { id: 'ebay_fr', name: 'eBay France', country: 'FR', countryName: 'Francia', flag: '🇫🇷', url: 'https://www.ebay.fr/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Compravendita e aste in Francia' },
    { id: 'vinted_fr', name: 'Vinted France', country: 'FR', countryName: 'Francia', flag: '🇫🇷', url: 'https://www.vinted.fr/vetements?search_text={query}', type: 'second_hand', description: 'Mercatino seconda mano moda e accessori' },
  ],

  // 🇪🇸 SPAGNA
  ES: [
    { id: 'wallapop_es', name: 'Wallapop', country: 'ES', countryName: 'Spagna', flag: '🇪🇸', url: 'https://es.wallapop.com/app/search?keywords={query}', type: 'hyperlocal', description: 'L\'app numero uno in Spagna per compravendita geolocalizzata' },
    { id: 'milanuncios_es', name: 'Milanuncios', country: 'ES', countryName: 'Spagna', flag: '🇪🇸', url: 'https://www.milanuncios.com/anuncios/?s={query}', type: 'classifieds', description: 'Portale storico di annunci per motori, casa e lavoro' },
    { id: 'ebay_es', name: 'eBay España', country: 'ES', countryName: 'Spagna', flag: '🇪🇸', url: 'https://www.ebay.es/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Compravendita garantita e collezionismo' },
  ],

  // 🇮🇹 ITALIA
  IT: [
    { id: 'subito_it', name: 'Subito.it', country: 'IT', countryName: 'Italia', flag: '🇮🇹', url: 'https://www.subito.it/annunci-italia/vendita/usato/?q={query}', type: 'classifieds', description: 'Piattaforma di riferimento italiana per annunci e compravendite' },
    { id: 'wallapop_it', name: 'Wallapop Italia', country: 'IT', countryName: 'Italia', flag: '🇮🇹', url: 'https://it.wallapop.com/app/search?keywords={query}', type: 'hyperlocal', description: 'App geolocalizzata per compravendita di prossimità' },
    { id: 'ebay_it', name: 'eBay Italia', country: 'IT', countryName: 'Italia', flag: '🇮🇹', url: 'https://www.ebay.it/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Aste e vendite online garantite' },
  ],

  // 🇯🇵 GIAPPONE
  JP: [
    { id: 'mercari_jp', name: 'Mercari (メルカリ)', country: 'JP', countryName: 'Giappone', flag: '🇯🇵', url: 'https://jp.mercari.com/search?keyword={query}', type: 'second_hand', description: 'L\'app di usato C2C più utilizzata in Giappone' },
    { id: 'yahoo_auctions_jp', name: 'Yahoo! Auctions Japan', country: 'JP', countryName: 'Giappone', flag: '🇯🇵', url: 'https://auctions.yahoo.co.jp/search/search?p={query}', type: 'global_auction', description: 'Aste per collezionismo, anime, tecnologia e rarità' },
    { id: 'rakuten_jp', name: 'Rakuten (楽天)', country: 'JP', countryName: 'Giappone', flag: '🇯🇵', url: 'https://search.rakuten.co.jp/search/mall/{query}/', type: 'second_hand', description: 'Grande mercato giapponese con negozi ed eccellenze' },
  ],

  // 🇧🇷 BRASILE
  BR: [
    { id: 'mercadolivre_br', name: 'Mercado Livre Brasil', country: 'BR', countryName: 'Brasile', flag: '🇧🇷', url: 'https://lista.mercadolivre.com.br/{query}', type: 'global_auction', description: 'Il marketplace leader assoluto in America Latina' },
    { id: 'olx_br', name: 'OLX Brasil', country: 'BR', countryName: 'Brasile', flag: '🇧🇷', url: 'https://www.olx.com.br/brasil?q={query}', type: 'classifieds', description: 'Annunci di prossimità per quartiere e città brasiliane' },
    { id: 'enjoei_br', name: 'Enjoei', country: 'BR', countryName: 'Brasile', flag: '🇧🇷', url: 'https://www.enjoei.com.br/busca?q={query}', type: 'second_hand', description: 'Moda, elettronica e design di seconda mano' },
  ],

  // 🇲🇽 MESSICO
  MX: [
    { id: 'mercadolibre_mx', name: 'Mercado Libre México', country: 'MX', countryName: 'Messico', flag: '🇲🇽', url: 'https://listado.mercadolibre.com.mx/{query}', type: 'global_auction', description: 'Leader messicano per compravendite online e spedizioni' },
    { id: 'ebay_mx', name: 'eBay México', country: 'MX', countryName: 'Messico', flag: '🇲🇽', url: 'https://www.ebay.com/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Importazioni internazionali e acquisti garantiti' },
  ],

  // 🇨🇦 CANADA
  CA: [
    { id: 'kijiji_ca', name: 'Kijiji Canada', country: 'CA', countryName: 'Canada', flag: '🇨🇦', url: 'https://www.kijiji.ca/b-search.html?searchTerm={query}', type: 'classifieds', description: 'La più grande bacheca canadese di annunci locali' },
    { id: 'ebay_ca', name: 'eBay Canada', country: 'CA', countryName: 'Canada', flag: '🇨🇦', url: 'https://www.ebay.ca/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Compravendita in Canada e spedizioni cross-border' },
  ],

  // 🇦🇺 AUSTRALIA
  AU: [
    { id: 'gumtree_au', name: 'Gumtree Australia', country: 'AU', countryName: 'Australia', flag: '🇦🇺', url: 'https://www.gumtree.com.au/s-{query}/k0', type: 'classifieds', description: 'La piattaforma di annunci usati più popolare in Australia' },
    { id: 'ebay_au', name: 'eBay Australia', country: 'AU', countryName: 'Australia', flag: '🇦🇺', url: 'https://www.ebay.com.au/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Mercato online australiano leader per aste e acquisti' },
  ],

  // 🇮🇳 INDIA
  IN: [
    { id: 'olx_in', name: 'OLX India', country: 'IN', countryName: 'India', flag: '🇮🇳', url: 'https://www.olx.in/items/q-{query}', type: 'classifieds', description: 'Compravendita nazionale di auto, tecnologia e arredo' },
    { id: 'flipkart_in', name: 'Flipkart', country: 'IN', countryName: 'India', flag: '🇮🇳', url: 'https://www.flipkart.com/search?q={query}', type: 'second_hand', description: 'Grande mercato di prodotti elettronici e consumo in India' },
    { id: 'indiamart_in', name: 'IndiaMART', country: 'IN', countryName: 'India', flag: '🇮🇳', url: 'https://dir.indiamart.com/search.mp?ss={query}', type: 'classifieds', description: 'Canale di collegamento con fornitori e produttori' },
  ],

  // 🇨🇳 CINA
  CN: [
    { id: 'taobao_cn', name: 'Taobao (淘宝)', country: 'CN', countryName: 'Cina', flag: '🇨🇳', url: 'https://s.taobao.com/search?q={query}', type: 'second_hand', description: 'Il più vasto mercato online C2C al mondo' },
    { id: 'xianyu_cn', name: 'Xianyu / Idle Fish (闲鱼)', country: 'CN', countryName: 'Cina', flag: '🇨🇳', url: 'https://2.taobao.com/', type: 'hyperlocal', description: 'Piattaforma di usato P2P del gruppo Alibaba' },
    { id: 'jd_cn', name: 'JD.com (京东)', country: 'CN', countryName: 'Cina', flag: '🇨🇳', url: 'https://search.jd.com/Search?keyword={query}', type: 'second_hand', description: 'Elettronica e prodotti autentici con logistica diretta' },
  ],

  // 🇰🇷 COREA DEL SUD
  KR: [
    { id: 'karrot_kr', name: 'Danggeun / Karrot (당근마켓)', country: 'KR', countryName: 'Corea del Sud', flag: '🇰🇷', url: 'https://www.daangn.com/search/{query}', type: 'hyperlocal', description: 'App iperlocale sudcoreana per scambi di quartiere entro 6 km' },
    { id: 'bunjang_kr', name: 'Bunjang (번개장터)', country: 'KR', countryName: 'Corea del Sud', flag: '🇰🇷', url: 'https://m.bunjang.co.kr/search/products?q={query}', type: 'second_hand', description: 'Specializzato in K-Pop, moda, sneakers e tecnologia' },
  ],

  // 🇳🇱 PAESI BASSI
  NL: [
    { id: 'marktplaats_nl', name: 'Marktplaats.nl', country: 'NL', countryName: 'Paesi Bassi', flag: '🇳🇱', url: 'https://www.marktplaats.nl/q/{query}/', type: 'classifieds', description: 'Il mercato dell\'usato più famoso nei Paesi Bassi' },
    { id: 'ebay_nl', name: 'eBay Nederland', country: 'NL', countryName: 'Paesi Bassi', flag: '🇳🇱', url: 'https://www.ebay.nl/sch/i.html?_nkw={query}', type: 'global_auction', description: 'Aste e compravendite internazionali' },
  ],

  // 🇵🇱 POLONIA
  PL: [
    { id: 'allegro_pl', name: 'Allegro', country: 'PL', countryName: 'Polonia', flag: '🇵🇱', url: 'https://allegro.pl/listing?string={query}', type: 'global_auction', description: 'La più grande piattaforma di e-commerce e usato in Polonia' },
    { id: 'olx_pl', name: 'OLX Polska', country: 'PL', countryName: 'Polonia', flag: '🇵🇱', url: 'https://www.olx.pl/oferty/q-{query}/', type: 'classifieds', description: 'Annunci locali di compravendita in Polonia' },
  ],

  // 🇨🇭 SVIZZERA
  CH: [
    { id: 'ricardo_ch', name: 'Ricardo.ch', country: 'CH', countryName: 'Svizzera', flag: '🇨🇭', url: 'https://www.ricardo.ch/it/s/{query}/', type: 'global_auction', description: 'Il mercato svizzero numero uno per aste e compravendita' },
    { id: 'tutti_ch', name: 'Tutti.ch', country: 'CH', countryName: 'Svizzera', flag: '🇨🇭', url: 'https://www.tutti.ch/it/li/svizzera?q={query}', type: 'classifieds', description: 'Annunci gratuiti e mercatino locale in Svizzera' },
  ],

  // 🇸🇪 SVEZIA
  SE: [
    { id: 'blocket_se', name: 'Blocket', country: 'SE', countryName: 'Svezia', flag: '🇸🇪', url: 'https://www.blocket.se/annonser/hela_sverige?q={query}', type: 'classifieds', description: 'Il mercato storico per la compravendita in Svezia' },
    { id: 'tradera_se', name: 'Tradera', country: 'SE', countryName: 'Svezia', flag: '🇸🇪', url: 'https://www.tradera.com/search?q={query}', type: 'global_auction', description: 'Aste e vendite di seconda mano svedesi' },
  ],

  // 🇦🇪 EMIRATI ARABI UNITI
  AE: [
    { id: 'dubizzle_ae', name: 'Dubizzle', country: 'AE', countryName: 'Emirati Arabi Uniti', flag: '🇦🇪', url: 'https://dubai.dubizzle.com/classified/?keyword={query}', type: 'classifieds', description: 'La piattaforma leader negli EAU e Dubai' },
    { id: 'opensooq_ae', name: 'OpenSooq', country: 'AE', countryName: 'Emirati Arabi Uniti', flag: '🇦🇪', url: 'https://ae.opensooq.com/en/find?PostSearch[term]={query}', type: 'classifieds', description: 'Marketplace diffuso in tutto il Medio Oriente' },
  ],

  // 🇿🇦 SUDAFRICA
  ZA: [
    { id: 'gumtree_za', name: 'Gumtree South Africa', country: 'ZA', countryName: 'Sudafrica', flag: '🇿🇦', url: 'https://www.gumtree.co.za/s-{query}/v1q0p1', type: 'classifieds', description: 'Bacheca di compravendita locale in Sudafrica' },
    { id: 'olx_za', name: 'OLX South Africa', country: 'ZA', countryName: 'Sudafrica', flag: '🇿🇦', url: 'https://www.olx.co.za/items/q-{query}', type: 'classifieds', description: 'Annunci e seconda mano' },
  ],

  // 🇳🇬 NIGERIA
  NG: [
    { id: 'jiji_ng', name: 'Jiji Nigeria', country: 'NG', countryName: 'Nigeria', flag: '🇳🇬', url: 'https://jiji.ng/search?query={query}', type: 'classifieds', description: 'Il più grande marketplace online in Nigeria e Africa occidentale' },
  ],
};

export function getMarketplaces(countryCode?: string): ExternalMarketplace[] {
  if (!countryCode || countryCode === 'ALL' || countryCode === 'GLOBO' || countryCode === 'GLOBAL') {
    return COUNTRY_MARKETPLACES['GLOBAL'] || [];
  }
  const code = countryCode.toUpperCase();
  const direct = COUNTRY_MARKETPLACES[code];
  if (direct && direct.length > 0) return direct;

  // Fallback con eBay Worldwide
  return [
    {
      id: `ebay_${code.toLowerCase()}`,
      name: `eBay Worldwide (${code})`,
      country: code,
      countryName: code,
      flag: '🌐',
      url: 'https://www.ebay.com/sch/i.html?_nkw={query}',
      type: 'global_auction',
      description: 'Catalogo mondiale eBay con spedizioni internazionali',
    },
    ...COUNTRY_MARKETPLACES['GLOBAL']
  ];
}

export function buildExternalListing(marketplace: ExternalMarketplace, query: string): ExternalListing {
  const safeQuery = query?.trim() || 'offerte';
  return {
    id: `ext_${marketplace.id}_${encodeURIComponent(safeQuery)}`,
    title: `${safeQuery} su ${marketplace.name}`,
    price: `Vedi offerte su ${marketplace.name}`,
    url: marketplace.url.replace('{query}', encodeURIComponent(safeQuery)),
    marketplace: marketplace.name,
    country: marketplace.country,
    flag: marketplace.flag || '🌐',
  };
}

export function fetchExternal(countryCode: string, query: string): ExternalListing[] {
  const mps = getMarketplaces(countryCode);
  return mps.map((mp) => buildExternalListing(mp, query));
}

