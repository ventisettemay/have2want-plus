/**
 * countryPortalsRadar.ts
 * Mappa globale e radar delle abitudini di ricerca e piattaforme di scambio
 * per ciascun paese nel mondo (Cina, India, Giappone, USA, Italia, ecc.)
 */

export interface CountryRadarInfo {
  code: string;
  countryName: string;
  nativeName: string;
  flag: string;
  popularSearchEngines: string[];
  mainExchangePortals: {
    name: string;
    description: string;
    url?: string;
    type: 'classifieds' | 'second_hand' | 'hyperlocal' | 'p2p_barter' | 'super_app';
  }[];
  culturalTradingHabit: string;
  preferredPaymentMethods: string[];
  dominantSearchKeyword: string;
}

export const GLOBAL_PORTALS_RADAR: Record<string, CountryRadarInfo> = {
  IT: {
    code: 'IT',
    countryName: 'Italia',
    nativeName: 'Italia',
    flag: '🇮🇹',
    popularSearchEngines: ['Google Italia', 'Facebook Search', 'Ecosia'],
    mainExchangePortals: [
      { name: 'Subito.it', description: 'Portavocabolario storico per compravendita e motori/elettronica', type: 'classifieds' },
      { name: 'Vinted', description: 'Leader indiscusso per moda, capi usati e accessori', type: 'second_hand' },
      { name: 'Facebook Marketplace', description: 'Ritiro rapido a mano e compravendite comunali/di quartiere', type: 'hyperlocal' },
      { name: 'Wallapop', description: 'App geolocalizzata per compravendita di prossimità', type: 'hyperlocal' },
      { name: 'eBay.it', description: 'Collezionismo, pezzi di ricambio e vintage', type: 'second_hand' },
    ],
    culturalTradingHabit: 'Preferenza per il ritiro e controllo a vista di persona. Uso frequente di WhatsApp per definire ora e luogo di incontro sicuro.',
    preferredPaymentMethods: ['Scambio a mano in contanti', 'Pi Network / Baratto', 'PayPal P2P', 'Bonifico istantaneo'],
    dominantSearchKeyword: 'subito usato baratto vicino a me',
  },
  CN: {
    code: 'CN',
    countryName: 'Cina',
    nativeName: '中国',
    flag: '🇨🇳',
    popularSearchEngines: ['Baidu (百度)', 'WeChat Search (搜一搜)', 'Xiaohongshu (小红书/RED)'],
    mainExchangePortals: [
      { name: 'Xianyu (闲鱼 - Idle Fish)', description: 'Piattaforma di usato P2P del gruppo Alibaba con milioni di utenti attivi giornalieri', type: 'second_hand' },
      { name: 'Zhuanzhuan (转转)', description: 'Specializzato in smartphone e dispositivi elettronici ricondizionati con perizia', type: 'second_hand' },
      { name: 'WeChat Mini-Programs', description: 'Comunità di vicinato, scambio tra condomini ed eco-baratto', type: 'super_app' },
    ],
    culturalTradingHabit: 'Negoziazione rapidissima tramite chat integrata, video in diretta per attestare le condizioni, altissimo uso di punteggi di affidabilità (Sesame Credit).',
    preferredPaymentMethods: ['WeChat Pay', 'Alipay', 'Pi Network', 'RMB digitale'],
    dominantSearchKeyword: '同城二手 (usato nella stessa città)',
  },
  IN: {
    code: 'IN',
    countryName: 'India',
    nativeName: 'भारत',
    flag: '🇮🇳',
    popularSearchEngines: ['Google India (con ricerca vocale)', 'YouTube', 'WhatsApp Channels'],
    mainExchangePortals: [
      { name: 'OLX India', description: 'Piattaforma di riferimento nazionale per compravendita auto, telefoni e arredamento', type: 'classifieds' },
      { name: 'Quikr', description: 'Annunci locali per beni usati, servizi di casa e offerte di lavoro di prossimità', type: 'classifieds' },
      { name: 'IndiaMART', description: 'Canale di collegamento per piccole forniture, artigiani e grossisti P2B', type: 'classifieds' },
      { name: 'WhatsApp Business & Community', description: 'Gruppi di quartiere ad altissima densità per vendita e scambio diretto', type: 'hyperlocal' },
    ],
    culturalTradingHabit: 'Interazione spesso vocale nelle lingue regionali (Hindi, Tamil, Telugu, ecc.). Negoziazione calorosa e conferma finale dell\'accordo al telefono prima dell\'incontro.',
    preferredPaymentMethods: ['UPI (Google Pay, PhonePe, Paytm)', 'Contanti alla consegna', 'Pi Network'],
    dominantSearchKeyword: 'second hand olx near me',
  },
  JP: {
    code: 'JP',
    countryName: 'Giappone',
    nativeName: '日本',
    flag: '🇯🇵',
    popularSearchEngines: ['Yahoo! Japan (ヤフー)', 'Google Japan', 'X (Twitter)'],
    mainExchangePortals: [
      { name: 'Mercari (メルカリ)', description: 'L\'app di usato C2C più utilizzata in Giappone, focalizzata sulla precisione descrittiva', type: 'second_hand' },
      { name: 'Jimoty (ジモティー)', description: 'Bacheca iperlocale per regali gratuiti, baratto e ritiro di mobili e grandi oggetti nel quartiere', type: 'p2p_barter' },
      { name: 'Yahoo! Auctions (ヤフオク)', description: 'Aste e compravendita per collezionisti, anime, modellismo e pezzi rari', type: 'second_hand' },
      { name: 'Rakuma (ラクマ)', description: 'Marketplace di compravendita del gruppo Rakuten', type: 'second_hand' },
    ],
    culturalTradingHabit: 'Estrema trasparenza su ogni minuscolo difetto visivo. Rispetto scrupoloso degli orari di incontro e spedizioni anonime tramite Konbini (7-Eleven/Lawson).',
    preferredPaymentMethods: ['Pagamento Konbini', 'PayPay', 'Rakuten Pay', 'Pi Network'],
    dominantSearchKeyword: 'ジモティー 無料 (Jimoty gratis/baratto locale)',
  },
  US: {
    code: 'US',
    countryName: 'Stati Uniti',
    nativeName: 'United States',
    flag: '🇺🇸',
    popularSearchEngines: ['Google', 'Amazon Search', 'Reddit Local Communities'],
    mainExchangePortals: [
      { name: 'Craigslist', description: 'La bacheca pioniera per città e contee, essenziale e diretta', type: 'classifieds' },
      { name: 'Facebook Marketplace', description: 'La destinazione più popolare per scambi e compravendita locale a vista', type: 'hyperlocal' },
      { name: 'OfferUp', description: 'App mobile per acquisto e vendita di prossimità con profilo verificato', type: 'hyperlocal' },
      { name: 'eBay US', description: 'Mercato globale per aste e acquisti garantiti', type: 'second_hand' },
      { name: 'Freecycle / Buy Nothing', description: 'Comunità no-profit per il dono e il ricircolo gratuito di oggetti tra vicini', type: 'p2p_barter' },
    ],
    culturalTradingHabit: 'Ricerche basate su ZIP Code (codice postale) e raggio in miglia. Incontri spesso fissati presso i "Safe Exchange Zones" (parcheggi illuminati delle stazioni di polizia).',
    preferredPaymentMethods: ['Venmo', 'Zelle', 'Cash App', 'Pi Network', 'Contanti'],
    dominantSearchKeyword: 'craigslist for sale near me',
  },
  DE: {
    code: 'DE',
    countryName: 'Germania',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    popularSearchEngines: ['Google Deutschland', 'Ecosia'],
    mainExchangePortals: [
      { name: 'Kleinanzeigen (ex eBay Kleinanzeigen)', description: 'Il punto di riferimento assoluto tedesco per il mercatino locale dell\'usato', type: 'classifieds' },
      { name: 'Vinted.de', description: 'Popolare per abbigliamento di seconda mano', type: 'second_hand' },
      { name: 'Nebenan.de', description: 'Rete sociale di vicinato per prestiti, aiuto reciproco e baratto locale', type: 'hyperlocal' },
    ],
    culturalTradingHabit: 'Comunicazione formale, puntuale ed essenziale. Attenzione alla certificazione e all\'integrità dell\'oggetto.',
    preferredPaymentMethods: ['PayPal Amici', 'Barzahlung (Contanti)', 'SEPA Transfer', 'Pi Network'],
    dominantSearchKeyword: 'kleinanzeigen zu verschenken (in regalo)',
  },
  FR: {
    code: 'FR',
    countryName: 'Francia',
    nativeName: 'France',
    flag: '🇫🇷',
    popularSearchEngines: ['Google France', 'Qwant'],
    mainExchangePortals: [
      { name: 'Leboncoin', description: 'L\'istituzione francese per gli annunci locali e lo scambio di qualsiasi bene', type: 'classifieds' },
      { name: 'Vinted France', description: 'Molto diffuso per vestiti e articoli per la casa', type: 'second_hand' },
      { name: 'Geev', description: 'App dedicata esclusivamente al dono e al riciclo tra privati', type: 'p2p_barter' },
    ],
    culturalTradingHabit: 'Predilezione per il contatto diretto via messaggistica interna di Leboncoin o scambio al mercato cittadino.',
    preferredPaymentMethods: ['Paiement sécurisé Leboncoin', 'Espèces (Contanti)', 'Lydia', 'Pi Network'],
    dominantSearchKeyword: 'leboncoin bonnes affaires près de chez moi',
  },
  BR: {
    code: 'BR',
    countryName: 'Brasile',
    nativeName: 'Brasil',
    flag: '🇧🇷',
    popularSearchEngines: ['Google Brasil', 'WhatsApp', 'Instagram Direct'],
    mainExchangePortals: [
      { name: 'Mercado Livre Brasil', description: 'Il marketplace più grande dell\'America Latina', type: 'second_hand' },
      { name: 'OLX Brasil', description: 'Annunci di prossimità per quartiere e città', type: 'classifieds' },
      { name: 'Enjoei', description: 'Piattaforma di moda usata e design per giovani creativi', type: 'second_hand' },
    ],
    culturalTradingHabit: 'Uso onnipresente del sistema di pagamento istantaneo Pix e accordi veloci su WhatsApp.',
    preferredPaymentMethods: ['Pix (istantaneo)', 'Dinheiro (Contanti)', 'Pi Network', 'Cartão parcelado'],
    dominantSearchKeyword: 'olx desapego perto de mim',
  },
  KR: {
    code: 'KR',
    countryName: 'Corea del Sud',
    nativeName: '대한민국',
    flag: '🇰🇷',
    popularSearchEngines: ['Naver (네이버)', 'Daum (다음)', 'Google Korea'],
    mainExchangePortals: [
      { name: 'Danggeun Market (Karrot - 당근마켓)', description: 'L\'app iperlocale per eccellenza: scambi autorizzati solo entro 6 km con vicini verificati via GPS', type: 'hyperlocal' },
      { name: 'Bunjang (번개장터)', description: 'Specializzato in K-Pop, sneakers, moda e streetwear da collezione', type: 'second_hand' },
      { name: 'Joonggonara (중고나라)', description: 'La più antica e popolosa bacheca di compravendita di Naver Café', type: 'classifieds' },
    ],
    culturalTradingHabit: 'Incontri rapidi e puntuali all\'ingresso della stazione della metropolitana locale o nell\'atrio del complesso residenziale (Apatu).',
    preferredPaymentMethods: ['Danggeun Pay', 'KakaoPay', 'Toss', 'Pi Network'],
    dominantSearchKeyword: '당근마켓 동네생활 (Karrot vita di quartiere)',
  },
  ES: {
    code: 'ES',
    countryName: 'Spagna',
    nativeName: 'España',
    flag: '🇪🇸',
    popularSearchEngines: ['Google España'],
    mainExchangePortals: [
      { name: 'Wallapop', description: 'L\'app numero uno in Spagna per compravendita locale georeferenziata', type: 'hyperlocal' },
      { name: 'Milanuncios', description: 'Classico portale di annunci per lavoro, motori e oggetti di casa', type: 'classifieds' },
      { name: 'Vinted España', description: 'Molto forte per abbigliamento e seconda mano', type: 'second_hand' },
    ],
    culturalTradingHabit: 'Accordo amichevole in chat e incontro nel bar o piazza del quartiere.',
    preferredPaymentMethods: ['Bizum (trasferimento immediato da smartphone)', 'Efectivo (Contanti)', 'Pi Network'],
    dominantSearchKeyword: 'wallapop segunda mano cerca',
  },
  AE: {
    code: 'AE',
    countryName: 'Emirati Arabi Uniti',
    nativeName: 'الإمارات',
    flag: '🇦🇪',
    popularSearchEngines: ['Google UAE', 'Instagram'],
    mainExchangePortals: [
      { name: 'Dubizzle', description: 'La piattaforma principe negli EAU per case, auto ed elettronica', type: 'classifieds' },
      { name: 'OpenSooq', description: 'Bacheca molto popolare in tutto il Medio Oriente', type: 'classifieds' },
    ],
    culturalTradingHabit: 'Trattative spesso bilingue (Arabo/Inglese), rapidità di incontro e alto ricambio di beni dovuto all\'internazionalità.',
    preferredPaymentMethods: ['Contanti / AED', 'Pi Network', 'Bonifico istantaneo'],
    dominantSearchKeyword: 'dubizzle second hand items dubai',
  }
};

/**
 * Ottiene le informazioni del radar dei portali per un codice nazione (es. IT, CN, IN, US, ecc.)
 */
export function getCountryRadar(countryCode?: string): CountryRadarInfo {
  if (!countryCode) return GLOBAL_PORTALS_RADAR['IT'];
  const code = countryCode.toUpperCase();
  if (GLOBAL_PORTALS_RADAR[code]) {
    return GLOBAL_PORTALS_RADAR[code];
  }
  // Fallback generico internazionale
  return {
    code,
    countryName: 'Mondo / Internazionale',
    nativeName: 'Global',
    flag: '🌐',
    popularSearchEngines: ['Google', 'Bing', 'Baidu', 'Yandex'],
    mainExchangePortals: [
      { name: 'Facebook Marketplace', description: 'Presente in oltre 100 nazioni per compravendita locale', type: 'hyperlocal' },
      { name: 'eBay International', description: 'Scambio e aste a livello transfrontaliero', type: 'second_hand' },
      { name: 'Gruppi Comunitari & Chat', description: 'Reti WhatsApp, Telegram e WeChat locali', type: 'p2p_barter' },
    ],
    culturalTradingHabit: 'Accordo diretto di persona o tramite messaggistica istantanea con verifica dello stato reale dell\'oggetto.',
    preferredPaymentMethods: ['Valuta locale a vista', 'Pi Network (decentralizzato)', 'Baratto diretto bene-contro-bene'],
    dominantSearchKeyword: 'buy sell trade near me',
  };
}
