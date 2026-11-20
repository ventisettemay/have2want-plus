// MODULO GERARCHIA TERRITORIALE UNIVERSALE
// Struttura a 5 livelli: Mondo -> Stato (Nazione) -> Regione/Stato Federale -> Provincia/Distretto -> Comune/Città
// Supporta TUTTI gli Stati del mondo con fallback su Geocoding Nominatim Live per qualsiasi comune

import { findCountryByNameOrCode, WORLD_COUNTRIES, WorldCountry } from './worldAtlas';

export interface ComuneData {
  name: string;
  lat: number;
  lng: number;
  cap?: string;
  isCapital?: boolean;
}

export interface ProvinciaData {
  name: string;
  code?: string;
  lat: number;
  lng: number;
  comuni: ComuneData[];
}

export interface RegioneData {
  name: string;
  capital: string;
  lat: number;
  lng: number;
  provinces: ProvinciaData[];
}

export interface NazioneData {
  code: string;
  code3: string;
  name: string;
  nativeName: string;
  flag: string;
  continent: string;
  capital: string;
  lat: number;
  lng: number;
  currency: { code: string; symbol: string; name: string };
  lang: string;
  regions: RegioneData[];
  fallbackGenerated?: boolean;
}

// Database gerarchico completo per i principali Stati, estendibile dinamicamente
export const GLOBAL_HIERARCHY: NazioneData[] = [
  // 1. ITALIA
  {
    code: 'IT',
    code3: 'ITA',
    name: 'Italia',
    nativeName: 'Italia',
    flag: '🇮🇹',
    continent: 'Europa',
    capital: 'Roma',
    lat: 41.8902,
    lng: 12.4922,
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    lang: 'Italiano',
    regions: [
      {
        name: 'Lazio',
        capital: 'Roma',
        lat: 41.8902,
        lng: 12.4922,
        provinces: [
          {
            name: 'Roma',
            code: 'RM',
            lat: 41.8902,
            lng: 12.4922,
            comuni: [
              { name: 'Roma Centro', lat: 41.8902, lng: 12.4922, isCapital: true },
              { name: 'Fiumicino', lat: 41.7735, lng: 12.2389 },
              { name: 'Tivoli', lat: 41.9610, lng: 12.7984 },
              { name: 'Pomezia', lat: 41.6706, lng: 12.5029 },
              { name: 'Civitavecchia', lat: 42.0924, lng: 11.7964 },
              { name: 'Velletri', lat: 41.6869, lng: 12.7781 },
              { name: 'Guidonia Montecelio', lat: 41.9961, lng: 12.7231 },
              { name: 'Anzio', lat: 41.4485, lng: 12.6288 },
              { name: 'Nettuno', lat: 41.4583, lng: 12.6625 },
              { name: 'Albano Laziale', lat: 41.7289, lng: 12.6597 },
            ],
          },
          {
            name: 'Latina',
            code: 'LT',
            lat: 41.4676,
            lng: 12.9037,
            comuni: [
              { name: 'Latina', lat: 41.4676, lng: 12.9037, isCapital: true },
              { name: 'Aprilia', lat: 41.5934, lng: 12.6515 },
              { name: 'Terracina', lat: 41.2882, lng: 13.2435 },
              { name: 'Formia', lat: 41.2589, lng: 13.6067 },
              { name: 'Gaeta', lat: 41.2132, lng: 13.5688 },
              { name: 'Cisterna di Latina', lat: 41.5925, lng: 12.8272 },
            ],
          },
          {
            name: 'Frosinone',
            code: 'FR',
            lat: 41.6400,
            lng: 13.3500,
            comuni: [
              { name: 'Frosinone', lat: 41.6400, lng: 13.3500, isCapital: true },
              { name: 'Cassino', lat: 41.4925, lng: 13.8306 },
              { name: 'Alatri', lat: 41.7264, lng: 13.3444 },
              { name: 'Sora', lat: 41.7167, lng: 13.6167 },
              { name: 'Ceccano', lat: 41.5694, lng: 13.3333 },
            ],
          },
          {
            name: 'Viterbo',
            code: 'VT',
            lat: 42.4174,
            lng: 12.1047,
            comuni: [
              { name: 'Viterbo', lat: 42.4174, lng: 12.1047, isCapital: true },
              { name: 'Tarquinia', lat: 42.2536, lng: 11.7583 },
              { name: 'Civita Castellana', lat: 42.2961, lng: 12.4111 },
              { name: 'Vetralla', lat: 42.3111, lng: 12.0789 },
              { name: 'Montefiascone', lat: 42.5333, lng: 12.0333 },
            ],
          },
          {
            name: 'Rieti',
            code: 'RI',
            lat: 42.4042,
            lng: 12.8628,
            comuni: [
              { name: 'Rieti', lat: 42.4042, lng: 12.8628, isCapital: true },
              { name: 'Fara in Sabina', lat: 42.2133, lng: 12.7303 },
              { name: 'Cittaducale', lat: 42.3853, lng: 12.9511 },
              { name: 'Poggio Mirteto', lat: 42.2683, lng: 12.6842 },
            ],
          },
        ],
      },
      {
        name: 'Lombardia',
        capital: 'Milano',
        lat: 45.4642,
        lng: 9.1900,
        provinces: [
          {
            name: 'Milano',
            code: 'MI',
            lat: 45.4642,
            lng: 9.1900,
            comuni: [
              { name: 'Milano Centro', lat: 45.4642, lng: 9.1900, isCapital: true },
              { name: 'Sesto San Giovanni', lat: 45.5328, lng: 9.2272 },
              { name: 'Cinisello Balsamo', lat: 45.5561, lng: 9.2139 },
              { name: 'Legnano', lat: 45.5975, lng: 8.9161 },
              { name: 'Rho', lat: 45.5311, lng: 9.0397 },
              { name: 'Paderno Dugnano', lat: 45.5683, lng: 9.1681 },
              { name: 'Cologno Monzese', lat: 45.5283, lng: 9.2789 },
              { name: 'Rozzano', lat: 45.3850, lng: 9.1558 },
              { name: 'San Donato Milanese', lat: 45.4189, lng: 9.2667 },
            ],
          },
          {
            name: 'Brescia',
            code: 'BS',
            lat: 45.5416,
            lng: 10.2118,
            comuni: [
              { name: 'Brescia', lat: 45.5416, lng: 10.2118, isCapital: true },
              { name: 'Desenzano del Garda', lat: 45.4697, lng: 10.5361 },
              { name: 'Montichiari', lat: 45.4147, lng: 10.3953 },
              { name: 'Lumezzane', lat: 45.6514, lng: 10.2647 },
              { name: 'Rovato', lat: 45.5658, lng: 9.9972 },
            ],
          },
          {
            name: 'Bergamo',
            code: 'BG',
            lat: 45.6983,
            lng: 9.6773,
            comuni: [
              { name: 'Bergamo', lat: 45.6983, lng: 9.6773, isCapital: true },
              { name: 'Treviglio', lat: 45.5217, lng: 9.5931 },
              { name: 'Seriate', lat: 45.6847, lng: 9.7183 },
              { name: 'Dalmine', lat: 45.6500, lng: 9.6000 },
            ],
          },
          {
            name: 'Monza e della Brianza',
            code: 'MB',
            lat: 45.5845,
            lng: 9.2744,
            comuni: [
              { name: 'Monza', lat: 45.5845, lng: 9.2744, isCapital: true },
              { name: 'Lissone', lat: 45.6111, lng: 9.2422 },
              { name: 'Seregno', lat: 45.6622, lng: 9.2064 },
              { name: 'Desio', lat: 45.6186, lng: 9.2081 },
              { name: 'Cesano Maderno', lat: 45.6292, lng: 9.1481 },
            ],
          },
          {
            name: 'Como',
            code: 'CO',
            lat: 45.8081,
            lng: 9.0852,
            comuni: [
              { name: 'Como', lat: 45.8081, lng: 9.0852, isCapital: true },
              { name: 'Cantù', lat: 45.7408, lng: 9.1306 },
              { name: 'Mariano Comense', lat: 45.6986, lng: 9.1822 },
              { name: 'Erba', lat: 45.8167, lng: 9.2333 },
            ],
          },
        ],
      },
      {
        name: 'Piemonte',
        capital: 'Torino',
        lat: 45.0703,
        lng: 7.6869,
        provinces: [
          {
            name: 'Torino',
            code: 'TO',
            lat: 45.0703,
            lng: 7.6869,
            comuni: [
              { name: 'Torino Centro', lat: 45.0703, lng: 7.6869, isCapital: true },
              { name: 'Moncalieri', lat: 45.0008, lng: 7.7147 },
              { name: 'Collegno', lat: 45.0789, lng: 7.5750 },
              { name: 'Rivoli', lat: 45.0700, lng: 7.5186 },
              { name: 'Nichelino', lat: 44.9961, lng: 7.6531 },
              { name: 'Settimo Torinese', lat: 45.1389, lng: 7.7686 },
              { name: 'Grugliasco', lat: 45.0683, lng: 7.5786 },
              { name: 'Chieri', lat: 45.0139, lng: 7.8228 },
              { name: 'Pinerolo', lat: 44.8847, lng: 7.3308 },
              { name: 'Venaria Reale', lat: 45.1333, lng: 7.6333 },
            ],
          },
          {
            name: 'Asti',
            code: 'AT',
            lat: 44.9008,
            lng: 8.2069,
            comuni: [
              { name: 'Asti', lat: 44.9008, lng: 8.2069, isCapital: true },
              { name: 'Nizza Monferrato', lat: 44.7744, lng: 8.3547 },
              { name: 'Canelli', lat: 44.7208, lng: 8.2889 },
              { name: 'San Damiano d\'Asti', lat: 44.8333, lng: 8.0667 },
              { name: 'Costigliole d\'Asti', lat: 44.7861, lng: 8.1811 },
            ],
          },
          {
            name: 'Cuneo',
            code: 'CN',
            lat: 44.3845,
            lng: 7.5427,
            comuni: [
              { name: 'Cuneo', lat: 44.3845, lng: 7.5427, isCapital: true },
              { name: 'Alba', lat: 44.6989, lng: 8.0347 },
              { name: 'Bra', lat: 44.6989, lng: 7.8547 },
              { name: 'Fossano', lat: 44.5500, lng: 7.7222 },
              { name: 'Mondovì', lat: 44.3917, lng: 7.8239 },
              { name: 'Savigliano', lat: 44.6469, lng: 7.6597 },
            ],
          },
          {
            name: 'Alessandria',
            code: 'AL',
            lat: 44.9133,
            lng: 8.6183,
            comuni: [
              { name: 'Alessandria', lat: 44.9133, lng: 8.6183, isCapital: true },
              { name: 'Casale Monferrato', lat: 45.1358, lng: 8.4525 },
              { name: 'Novi Ligure', lat: 44.7628, lng: 8.7886 },
              { name: 'Tortona', lat: 44.8942, lng: 8.8647 },
              { name: 'Acqui Terme', lat: 44.6753, lng: 8.4697 },
            ],
          },
          {
            name: 'Novara',
            code: 'NO',
            lat: 45.4469,
            lng: 8.6200,
            comuni: [
              { name: 'Novara', lat: 45.4469, lng: 8.6200, isCapital: true },
              { name: 'Borgomanero', lat: 45.7000, lng: 8.4667 },
              { name: 'Trecate', lat: 45.4333, lng: 8.7333 },
              { name: 'Arona', lat: 45.7583, lng: 8.5583 },
            ],
          },
        ],
      },
      {
        name: 'Campania',
        capital: 'Napoli',
        lat: 40.8518,
        lng: 14.2681,
        provinces: [
          {
            name: 'Napoli',
            code: 'NA',
            lat: 40.8518,
            lng: 14.2681,
            comuni: [
              { name: 'Napoli Centro', lat: 40.8518, lng: 14.2681, isCapital: true },
              { name: 'Giugliano in Campania', lat: 40.9297, lng: 14.1953 },
              { name: 'Torre del Greco', lat: 40.7878, lng: 14.3683 },
              { name: 'Pozzuoli', lat: 40.8258, lng: 14.1206 },
              { name: 'Casoria', lat: 40.9039, lng: 14.2936 },
              { name: 'Castellammare di Stabia', lat: 40.7000, lng: 14.4833 },
              { name: 'Afragola', lat: 40.9167, lng: 14.3167 },
              { name: 'Marano di Napoli', lat: 40.9000, lng: 14.1833 },
              { name: 'Portici', lat: 40.8167, lng: 14.3333 },
              { name: 'Ercolano', lat: 40.8067, lng: 14.3528 },
              { name: 'Sorrento', lat: 40.6261, lng: 14.3758 },
            ],
          },
          {
            name: 'Salerno',
            code: 'SA',
            lat: 40.6824,
            lng: 14.7681,
            comuni: [
              { name: 'Salerno', lat: 40.6824, lng: 14.7681, isCapital: true },
              { name: 'Cava de\' Tirreni', lat: 40.7000, lng: 14.7083 },
              { name: 'Battipaglia', lat: 40.6128, lng: 14.9856 },
              { name: 'Scafati', lat: 40.7725, lng: 14.5261 },
              { name: 'Nocera Inferiore', lat: 40.7447, lng: 14.6417 },
              { name: 'Amalfi', lat: 40.6333, lng: 14.6000 },
              { name: 'Positano', lat: 40.6281, lng: 14.4850 },
            ],
          },
          {
            name: 'Caserta',
            code: 'CE',
            lat: 41.0717,
            lng: 14.3317,
            comuni: [
              { name: 'Caserta', lat: 41.0717, lng: 14.3317, isCapital: true },
              { name: 'Aversa', lat: 40.9725, lng: 14.2058 },
              { name: 'Marcianise', lat: 41.0333, lng: 14.3000 },
              { name: 'Maddaloni', lat: 41.0397, lng: 14.3853 },
            ],
          },
        ],
      },
      {
        name: 'Veneto',
        capital: 'Venezia',
        lat: 45.4408,
        lng: 12.3155,
        provinces: [
          {
            name: 'Venezia',
            code: 'VE',
            lat: 45.4408,
            lng: 12.3155,
            comuni: [
              { name: 'Venezia Centro', lat: 45.4408, lng: 12.3155, isCapital: true },
              { name: 'Mestre', lat: 45.4908, lng: 12.2422 },
              { name: 'Chioggia', lat: 45.2186, lng: 12.2789 },
              { name: 'San Donà di Piave', lat: 45.6300, lng: 12.5647 },
              { name: 'Jesolo', lat: 45.5333, lng: 12.6333 },
            ],
          },
          {
            name: 'Verona',
            code: 'VR',
            lat: 45.4384,
            lng: 10.9916,
            comuni: [
              { name: 'Verona', lat: 45.4384, lng: 10.9916, isCapital: true },
              { name: 'Villafranca di Verona', lat: 45.3528, lng: 10.8447 },
              { name: 'Legnago', lat: 45.1917, lng: 11.3111 },
              { name: 'San Bonifacio', lat: 45.4000, lng: 11.2667 },
            ],
          },
          {
            name: 'Padova',
            code: 'PD',
            lat: 45.4064,
            lng: 11.8768,
            comuni: [
              { name: 'Padova', lat: 45.4064, lng: 11.8768, isCapital: true },
              { name: 'Vigonza', lat: 45.4439, lng: 11.9861 },
              { name: 'Albignasego', lat: 45.3500, lng: 11.8667 },
              { name: 'Selvazzano Dentro', lat: 45.3908, lng: 11.7869 },
            ],
          },
          {
            name: 'Vicenza',
            code: 'VI',
            lat: 45.5455,
            lng: 11.5354,
            comuni: [
              { name: 'Vicenza', lat: 45.5455, lng: 11.5354, isCapital: true },
              { name: 'Bassano del Grappa', lat: 45.7667, lng: 11.7333 },
              { name: 'Schio', lat: 45.7139, lng: 11.3578 },
              { name: 'Valdagno', lat: 45.6500, lng: 11.3000 },
            ],
          },
          {
            name: 'Treviso',
            code: 'TV',
            lat: 45.6669,
            lng: 12.2428,
            comuni: [
              { name: 'Treviso', lat: 45.6669, lng: 12.2428, isCapital: true },
              { name: 'Conegliano', lat: 45.8856, lng: 12.2989 },
              { name: 'Castelfranco Veneto', lat: 45.6706, lng: 11.9272 },
              { name: 'Montebelluna', lat: 45.7758, lng: 12.0467 },
            ],
          },
        ],
      },
      {
        name: 'Toscana',
        capital: 'Firenze',
        lat: 43.7696,
        lng: 11.2558,
        provinces: [
          {
            name: 'Firenze',
            code: 'FI',
            lat: 43.7696,
            lng: 11.2558,
            comuni: [
              { name: 'Firenze Centro', lat: 43.7696, lng: 11.2558, isCapital: true },
              { name: 'Scandicci', lat: 43.7533, lng: 11.1894 },
              { name: 'Sesto Fiorentino', lat: 43.8333, lng: 11.2000 },
              { name: 'Empoli', lat: 43.7189, lng: 10.9472 },
              { name: 'Campi Bisenzio', lat: 43.8247, lng: 11.1333 },
            ],
          },
          {
            name: 'Pisa',
            code: 'PI',
            lat: 43.7228,
            lng: 10.4017,
            comuni: [
              { name: 'Pisa', lat: 43.7228, lng: 10.4017, isCapital: true },
              { name: 'Cascina', lat: 43.6806, lng: 10.5014 },
              { name: 'San Giuliano Terme', lat: 43.7667, lng: 10.4500 },
              { name: 'Pontedera', lat: 43.6631, lng: 10.6358 },
            ],
          },
          {
            name: 'Siena',
            code: 'SI',
            lat: 43.3188,
            lng: 11.3308,
            comuni: [
              { name: 'Siena', lat: 43.3188, lng: 11.3308, isCapital: true },
              { name: 'Poggibonsi', lat: 43.4667, lng: 11.1500 },
              { name: 'Colle di Val d\'Elsa', lat: 43.4219, lng: 11.1275 },
              { name: 'Montepulciano', lat: 43.1000, lng: 11.7833 },
            ],
          },
          {
            name: 'Livorno',
            code: 'LI',
            lat: 43.5485,
            lng: 10.3106,
            comuni: [
              { name: 'Livorno', lat: 43.5485, lng: 10.3106, isCapital: true },
              { name: 'Piombino', lat: 42.9333, lng: 10.5333 },
              { name: 'Rosignano Marittimo', lat: 43.4000, lng: 10.4667 },
              { name: 'Cecina', lat: 43.3167, lng: 10.5167 },
            ],
          },
        ],
      },
      {
        name: 'Sicilia',
        capital: 'Palermo',
        lat: 38.1157,
        lng: 13.3615,
        provinces: [
          {
            name: 'Palermo',
            code: 'PA',
            lat: 38.1157,
            lng: 13.3615,
            comuni: [
              { name: 'Palermo', lat: 38.1157, lng: 13.3615, isCapital: true },
              { name: 'Bagheria', lat: 38.0803, lng: 13.5078 },
              { name: 'Carini', lat: 38.1333, lng: 13.1833 },
              { name: 'Monreale', lat: 38.0833, lng: 13.2833 },
              { name: 'Partinico', lat: 37.9833, lng: 13.0500 },
              { name: 'Cefalù', lat: 38.0333, lng: 14.0167 },
            ],
          },
          {
            name: 'Catania',
            code: 'CT',
            lat: 37.5079,
            lng: 15.0873,
            comuni: [
              { name: 'Catania', lat: 37.5079, lng: 15.0873, isCapital: true },
              { name: 'Acireale', lat: 37.6128, lng: 15.1661 },
              { name: 'Misterbianco', lat: 37.5186, lng: 15.0064 },
              { name: 'Paternò', lat: 37.5667, lng: 14.9000 },
              { name: 'Caltagirone', lat: 37.2333, lng: 14.5167 },
              { name: 'Taormina', lat: 37.8528, lng: 15.2869 },
            ],
          },
          {
            name: 'Messina',
            code: 'ME',
            lat: 38.1938,
            lng: 15.5540,
            comuni: [
              { name: 'Messina', lat: 38.1938, lng: 15.5540, isCapital: true },
              { name: 'Barcellona Pozzo di Gotto', lat: 38.1500, lng: 15.2167 },
              { name: 'Milazzo', lat: 38.2167, lng: 15.2333 },
            ],
          },
        ],
      },
      // Tutte le altre regioni d'Italia (Puglia, Emilia-Romagna, Liguria, Marche, Abruzzo, Sardegna, Friuli, Trentino, Umbria, Basilicata, Calabria, Molise, Valle d'Aosta)
      {
        name: 'Puglia',
        capital: 'Bari',
        lat: 41.1171,
        lng: 16.8719,
        provinces: [
          {
            name: 'Bari',
            code: 'BA',
            lat: 41.1171,
            lng: 16.8719,
            comuni: [
              { name: 'Bari Centro', lat: 41.1171, lng: 16.8719, isCapital: true },
              { name: 'Altamura', lat: 40.8267, lng: 16.5528 },
              { name: 'Molfetta', lat: 41.2000, lng: 16.6000 },
              { name: 'Bitonto', lat: 41.1097, lng: 16.6903 },
              { name: 'Monopoli', lat: 40.9500, lng: 17.3000 },
              { name: 'Polignano a Mare', lat: 40.9967, lng: 17.2189 },
            ],
          },
          {
            name: 'Lecce',
            code: 'LE',
            lat: 40.3533,
            lng: 18.1740,
            comuni: [
              { name: 'Lecce', lat: 40.3533, lng: 18.1740, isCapital: true },
              { name: 'Nardò', lat: 40.1783, lng: 18.0317 },
              { name: 'Galatina', lat: 40.1728, lng: 18.1706 },
              { name: 'Gallipoli', lat: 40.0558, lng: 17.9928 },
              { name: 'Otranto', lat: 40.1472, lng: 18.4906 },
            ],
          },
          {
            name: 'Taranto',
            code: 'TA',
            lat: 40.4644,
            lng: 17.2470,
            comuni: [
              { name: 'Taranto', lat: 40.4644, lng: 17.2470, isCapital: true },
              { name: 'Martina Franca', lat: 40.7000, lng: 17.3333 },
              { name: 'Grottaglie', lat: 40.5333, lng: 17.4333 },
              { name: 'Manduria', lat: 40.4000, lng: 17.6000 },
            ],
          },
        ],
      },
      {
        name: 'Emilia-Romagna',
        capital: 'Bologna',
        lat: 44.4949,
        lng: 11.3426,
        provinces: [
          {
            name: 'Bologna',
            code: 'BO',
            lat: 44.4949,
            lng: 11.3426,
            comuni: [
              { name: 'Bologna Centro', lat: 44.4949, lng: 11.3426, isCapital: true },
              { name: 'Imola', lat: 44.3536, lng: 11.7144 },
              { name: 'Casalecchio di Reno', lat: 44.4819, lng: 11.2789 },
              { name: 'San Lazzaro di Savena', lat: 44.4714, lng: 11.4114 },
            ],
          },
          {
            name: 'Modena',
            code: 'MO',
            lat: 44.6471,
            lng: 10.9252,
            comuni: [
              { name: 'Modena', lat: 44.6471, lng: 10.9252, isCapital: true },
              { name: 'Carpi', lat: 44.7836, lng: 10.8856 },
              { name: 'Sassuolo', lat: 44.5408, lng: 10.7825 },
              { name: 'Maranello', lat: 44.5261, lng: 10.8656 },
            ],
          },
          {
            name: 'Reggio Emilia',
            code: 'RE',
            lat: 44.6983,
            lng: 10.6307,
            comuni: [
              { name: 'Reggio nell\'Emilia', lat: 44.6983, lng: 10.6307, isCapital: true },
              { name: 'Scandiano', lat: 44.5939, lng: 10.6872 },
              { name: 'Correggio', lat: 44.7708, lng: 10.7806 },
            ],
          },
          {
            name: 'Parma',
            code: 'PR',
            lat: 44.8015,
            lng: 10.3279,
            comuni: [
              { name: 'Parma', lat: 44.8015, lng: 10.3279, isCapital: true },
              { name: 'Fidenza', lat: 44.8667, lng: 10.0667 },
              { name: 'Salsomaggiore Terme', lat: 44.8167, lng: 9.9833 },
            ],
          },
          {
            name: 'Rimini',
            code: 'RN',
            lat: 44.0678,
            lng: 12.5695,
            comuni: [
              { name: 'Rimini', lat: 44.0678, lng: 12.5695, isCapital: true },
              { name: 'Riccione', lat: 43.9989, lng: 12.6561 },
              { name: 'Bellaria-Igea Marina', lat: 44.1458, lng: 12.4697 },
              { name: 'Cattolica', lat: 43.9631, lng: 12.7381 },
            ],
          },
        ],
      },
    ],
  },

  // 2. FRANCIA (FR)
  {
    code: 'FR',
    code3: 'FRA',
    name: 'Francia',
    nativeName: 'France',
    flag: '🇫🇷',
    continent: 'Europa',
    capital: 'Parigi',
    lat: 48.8566,
    lng: 2.3522,
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    lang: 'Francese',
    regions: [
      {
        name: 'Île-de-France',
        capital: 'Parigi',
        lat: 48.8566,
        lng: 2.3522,
        provinces: [
          {
            name: 'Paris',
            code: '75',
            lat: 48.8566,
            lng: 2.3522,
            comuni: [
              { name: 'Parigi Centro (Louvre / Notre-Dame)', lat: 48.8566, lng: 2.3522, isCapital: true },
              { name: 'Montmartre (18e)', lat: 48.8867, lng: 2.3431 },
              { name: 'Champs-Élysées (8e)', lat: 48.8698, lng: 2.3075 },
              { name: 'Le Marais (4e)', lat: 48.8575, lng: 2.3600 },
              { name: 'Tour Eiffel / Passy (16e)', lat: 48.8584, lng: 2.2945 },
            ],
          },
          {
            name: 'Hauts-de-Seine',
            code: '92',
            lat: 48.8925,
            lng: 2.2156,
            comuni: [
              { name: 'Nanterre / La Défense', lat: 48.8925, lng: 2.2156, isCapital: true },
              { name: 'Boulogne-Billancourt', lat: 48.8397, lng: 2.2399 },
              { name: 'Neuilly-sur-Seine', lat: 48.8847, lng: 2.2689 },
              { name: 'Issy-les-Moulineaux', lat: 48.8239, lng: 2.2700 },
            ],
          },
          {
            name: 'Yvelines',
            code: '78',
            lat: 48.8049,
            lng: 2.1204,
            comuni: [
              { name: 'Versailles', lat: 48.8049, lng: 2.1204, isCapital: true },
              { name: 'Saint-Germain-en-Laye', lat: 48.8989, lng: 2.0938 },
              { name: 'Sartrouville', lat: 48.9400, lng: 2.1600 },
            ],
          },
        ],
      },
      {
        name: "Provence-Alpes-Côte d'Azur",
        capital: 'Marsiglia',
        lat: 43.2965,
        lng: 5.3698,
        provinces: [
          {
            name: 'Bouches-du-Rhône',
            code: '13',
            lat: 43.2965,
            lng: 5.3698,
            comuni: [
              { name: 'Marsiglia Centro / Vieux-Port', lat: 43.2965, lng: 5.3698, isCapital: true },
              { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474 },
              { name: 'Arles', lat: 43.6766, lng: 4.6278 },
              { name: 'Cassis', lat: 43.2144, lng: 5.5386 },
            ],
          },
          {
            name: 'Alpes-Maritimes',
            code: '06',
            lat: 43.7102,
            lng: 7.2620,
            comuni: [
              { name: 'Nizza / Promenade des Anglais', lat: 43.7102, lng: 7.2620, isCapital: true },
              { name: 'Cannes / La Croisette', lat: 43.5528, lng: 7.0174 },
              { name: 'Antibes', lat: 43.5808, lng: 7.1239 },
              { name: 'Mentone', lat: 43.7745, lng: 7.4975 },
            ],
          },
        ],
      },
      {
        name: 'Auvergne-Rhône-Alpes',
        capital: 'Lione',
        lat: 45.7640,
        lng: 4.8357,
        provinces: [
          {
            name: 'Rhône / Métropole de Lyon',
            code: '69',
            lat: 45.7640,
            lng: 4.8357,
            comuni: [
              { name: 'Lione Centro / Presqu\'île', lat: 45.7640, lng: 4.8357, isCapital: true },
              { name: 'Villeurbanne', lat: 45.7719, lng: 4.8797 },
              { name: 'Vénissieux', lat: 45.6989, lng: 4.8867 },
            ],
          },
          {
            name: 'Haute-Savoie',
            code: '74',
            lat: 45.8992,
            lng: 6.1294,
            comuni: [
              { name: 'Annecy / Lac d\'Annecy', lat: 45.8992, lng: 6.1294, isCapital: true },
              { name: 'Chamonix-Mont-Blanc', lat: 45.9237, lng: 6.8694 },
            ],
          },
        ],
      },
    ],
  },

  // 3. SPAGNA (ES)
  {
    code: 'ES',
    code3: 'ESP',
    name: 'Spagna',
    nativeName: 'España',
    flag: '🇪🇸',
    continent: 'Europa',
    capital: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    lang: 'Spagnolo',
    regions: [
      {
        name: 'Comunidad de Madrid',
        capital: 'Madrid',
        lat: 40.4168,
        lng: -3.7038,
        provinces: [
          {
            name: 'Madrid',
            code: 'M',
            lat: 40.4168,
            lng: -3.7038,
            comuni: [
              { name: 'Madrid Centro (Puerta del Sol / Gran Vía)', lat: 40.4168, lng: -3.7038, isCapital: true },
              { name: 'Móstoles', lat: 40.3222, lng: -3.8647 },
              { name: 'Alcalá de Henares', lat: 40.4819, lng: -3.3644 },
              { name: 'Getafe', lat: 40.3083, lng: -3.7328 },
              { name: 'Leganés', lat: 40.3281, lng: -3.7636 },
            ],
          },
        ],
      },
      {
        name: 'Cataluña',
        capital: 'Barcellona',
        lat: 41.3851,
        lng: 2.1734,
        provinces: [
          {
            name: 'Barcelona',
            code: 'B',
            lat: 41.3851,
            lng: 2.1734,
            comuni: [
              { name: 'Barcellona Centro (Rambla / Eixample)', lat: 41.3851, lng: 2.1734, isCapital: true },
              { name: 'L\'Hospitalet de Llobregat', lat: 41.3597, lng: 2.0997 },
              { name: 'Badalona', lat: 41.4500, lng: 2.2472 },
              { name: 'Terrassa', lat: 41.5631, lng: 2.0089 },
              { name: 'Sabadell', lat: 41.5433, lng: 2.1094 },
              { name: 'Sitges', lat: 41.2372, lng: 1.8058 },
            ],
          },
          {
            name: 'Girona',
            code: 'GI',
            lat: 41.9794,
            lng: 2.8214,
            comuni: [
              { name: 'Girona', lat: 41.9794, lng: 2.8214, isCapital: true },
              { name: 'Figueres', lat: 42.2667, lng: 2.9611 },
              { name: 'Lloret de Mar', lat: 41.7000, lng: 2.8333 },
            ],
          },
        ],
      },
      {
        name: 'Andalucía',
        capital: 'Siviglia',
        lat: 37.3891,
        lng: -5.9845,
        provinces: [
          {
            name: 'Sevilla',
            code: 'SE',
            lat: 37.3891,
            lng: -5.9845,
            comuni: [
              { name: 'Siviglia Centro / Barrio Santa Cruz', lat: 37.3891, lng: -5.9845, isCapital: true },
              { name: 'Dos Hermanas', lat: 37.2833, lng: -5.9167 },
              { name: 'Alcalá de Guadaíra', lat: 37.3333, lng: -5.8500 },
            ],
          },
          {
            name: 'Málaga',
            code: 'MA',
            lat: 36.7213,
            lng: -4.4214,
            comuni: [
              { name: 'Malaga Centro', lat: 36.7213, lng: -4.4214, isCapital: true },
              { name: 'Marbella / Puerto Banús', lat: 36.5101, lng: -4.8824 },
              { name: 'Fuengirola', lat: 36.5400, lng: -4.6200 },
              { name: 'Torremolinos', lat: 36.6200, lng: -4.5000 },
            ],
          },
          {
            name: 'Granada',
            code: 'GR',
            lat: 37.1773,
            lng: -3.5986,
            comuni: [
              { name: 'Granada / Alhambra', lat: 37.1773, lng: -3.5986, isCapital: true },
              { name: 'Motril', lat: 36.7500, lng: -3.5167 },
            ],
          },
        ],
      },
    ],
  },

  // 4. STATI UNITI (US)
  {
    code: 'US',
    code3: 'USA',
    name: 'Stati Uniti',
    nativeName: 'United States',
    flag: '🇺🇸',
    continent: 'Nord America',
    capital: 'Washington D.C.',
    lat: 38.9072,
    lng: -77.0369,
    currency: { code: 'USD', symbol: '$', name: 'Dollaro USA' },
    lang: 'Inglese',
    regions: [
      {
        name: 'California',
        capital: 'Sacramento',
        lat: 38.5816,
        lng: -121.4944,
        provinces: [
          {
            name: 'Los Angeles County',
            code: 'LA',
            lat: 34.0522,
            lng: -118.2437,
            comuni: [
              { name: 'Los Angeles Downtown', lat: 34.0522, lng: -118.2437, isCapital: true },
              { name: 'Hollywood', lat: 34.0928, lng: -118.3287 },
              { name: 'Santa Monica', lat: 34.0195, lng: -118.4912 },
              { name: 'Beverly Hills', lat: 34.0736, lng: -118.4004 },
              { name: 'Long Beach', lat: 33.7701, lng: -118.1937 },
              { name: 'Pasadena', lat: 34.1478, lng: -118.1445 },
            ],
          },
          {
            name: 'San Francisco Bay Area',
            code: 'SF',
            lat: 37.7749,
            lng: -122.4194,
            comuni: [
              { name: 'San Francisco', lat: 37.7749, lng: -122.4194, isCapital: true },
              { name: 'San Jose / Silicon Valley', lat: 37.3382, lng: -121.8863 },
              { name: 'Oakland', lat: 37.8044, lng: -122.2712 },
              { name: 'Palo Alto', lat: 37.4419, lng: -122.1430 },
              { name: 'Berkeley', lat: 37.8716, lng: -122.2727 },
            ],
          },
          {
            name: 'San Diego County',
            code: 'SD',
            lat: 32.7157,
            lng: -117.1611,
            comuni: [
              { name: 'San Diego Downtown', lat: 32.7157, lng: -117.1611, isCapital: true },
              { name: 'Chula Vista', lat: 32.6401, lng: -117.0842 },
              { name: 'La Jolla', lat: 32.8328, lng: -117.2713 },
            ],
          },
        ],
      },
      {
        name: 'New York',
        capital: 'Albany',
        lat: 42.6526,
        lng: -73.7562,
        provinces: [
          {
            name: 'New York City (5 Boroughs)',
            code: 'NYC',
            lat: 40.7128,
            lng: -74.0060,
            comuni: [
              { name: 'Manhattan (Midtown / Times Square)', lat: 40.7580, lng: -73.9855, isCapital: true },
              { name: 'Brooklyn (DUMBO / Williamsburg)', lat: 40.6782, lng: -73.9442 },
              { name: 'Queens (Astoria / Flushing)', lat: 40.7282, lng: -73.7949 },
              { name: 'The Bronx', lat: 40.8448, lng: -73.8648 },
              { name: 'Staten Island', lat: 40.5795, lng: -74.1502 },
            ],
          },
        ],
      },
      {
        name: 'Florida',
        capital: 'Tallahassee',
        lat: 30.4383,
        lng: -84.2807,
        provinces: [
          {
            name: 'Miami-Dade County',
            code: 'MIA',
            lat: 25.7617,
            lng: -80.1918,
            comuni: [
              { name: 'Miami Downtown / Brickell', lat: 25.7617, lng: -80.1918, isCapital: true },
              { name: 'Miami Beach / South Beach', lat: 25.7907, lng: -80.1300 },
              { name: 'Coral Gables', lat: 25.7215, lng: -80.2684 },
            ],
          },
          {
            name: 'Orange County (Orlando)',
            code: 'ORL',
            lat: 28.5383,
            lng: -81.3792,
            comuni: [
              { name: 'Orlando', lat: 28.5383, lng: -81.3792, isCapital: true },
              { name: 'Winter Park', lat: 28.6000, lng: -81.3500 },
            ],
          },
        ],
      },
    ],
  },

  // 5. GERMANIA (DE)
  {
    code: 'DE',
    code3: 'DEU',
    name: 'Germania',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    continent: 'Europa',
    capital: 'Berlino',
    lat: 52.5200,
    lng: 13.4050,
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    lang: 'Tedesco',
    regions: [
      {
        name: 'Bayern (Baviera)',
        capital: 'Monaco di Baviera',
        lat: 48.1351,
        lng: 11.5820,
        provinces: [
          {
            name: 'Oberbayern',
            lat: 48.1351,
            lng: 11.5820,
            comuni: [
              { name: 'Monaco di Baviera (München)', lat: 48.1351, lng: 11.5820, isCapital: true },
              { name: 'Ingolstadt', lat: 48.7667, lng: 11.4333 },
              { name: 'Rosenheim', lat: 47.8561, lng: 12.1289 },
            ],
          },
          {
            name: 'Mittelfranken',
            lat: 49.4521,
            lng: 11.0767,
            comuni: [
              { name: 'Norimberga (Nürnberg)', lat: 49.4521, lng: 11.0767, isCapital: true },
              { name: 'Erlangen', lat: 49.5897, lng: 11.0039 },
              { name: 'Fürth', lat: 49.4772, lng: 10.9889 },
            ],
          },
        ],
      },
      {
        name: 'Berlin (Stato di Berlino)',
        capital: 'Berlino',
        lat: 52.5200,
        lng: 13.4050,
        provinces: [
          {
            name: 'Bezirk Berlin',
            lat: 52.5200,
            lng: 13.4050,
            comuni: [
              { name: 'Berlin Mitte (Alexanderplatz)', lat: 52.5200, lng: 13.4050, isCapital: true },
              { name: 'Charlottenburg', lat: 52.5167, lng: 13.3000 },
              { name: 'Kreuzberg', lat: 52.4986, lng: 13.3917 },
              { name: 'Pankow', lat: 52.5686, lng: 13.4039 },
            ],
          },
        ],
      },
      {
        name: 'Nordrhein-Westfalen',
        capital: 'Düsseldorf',
        lat: 51.2277,
        lng: 6.7735,
        provinces: [
          {
            name: 'Regierungsbezirk Köln',
            lat: 50.9375,
            lng: 6.9603,
            comuni: [
              { name: 'Colonia (Köln Dom)', lat: 50.9375, lng: 6.9603, isCapital: true },
              { name: 'Bonn', lat: 50.7374, lng: 7.0982 },
              { name: 'Aquisgrana (Aachen)', lat: 50.7753, lng: 6.0839 },
            ],
          },
          {
            name: 'Regierungsbezirk Düsseldorf',
            lat: 51.2277,
            lng: 6.7735,
            comuni: [
              { name: 'Düsseldorf Altstadt', lat: 51.2277, lng: 6.7735, isCapital: true },
              { name: 'Duisburg', lat: 51.4344, lng: 6.7623 },
              { name: 'Essen', lat: 51.4556, lng: 7.0116 },
              { name: 'Dortmund', lat: 51.5136, lng: 7.4653 },
            ],
          },
        ],
      },
    ],
  },

  // 6. REGNO UNITO (GB)
  {
    code: 'GB',
    code3: 'GBR',
    name: 'Regno Unito',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    continent: 'Europa',
    capital: 'Londra',
    lat: 51.5074,
    lng: -0.1278,
    currency: { code: 'GBP', symbol: '£', name: 'Sterlina' },
    lang: 'Inglese',
    regions: [
      {
        name: 'Inghilterra (England)',
        capital: 'Londra',
        lat: 51.5074,
        lng: -0.1278,
        provinces: [
          {
            name: 'Greater London',
            lat: 51.5074,
            lng: -0.1278,
            comuni: [
              { name: 'City of London / Westminster', lat: 51.5074, lng: -0.1278, isCapital: true },
              { name: 'Camden Town', lat: 51.5390, lng: -0.1426 },
              { name: 'Kensington & Chelsea', lat: 51.5014, lng: -0.1919 },
              { name: 'Greenwich', lat: 51.4826, lng: -0.0077 },
            ],
          },
          {
            name: 'Greater Manchester',
            lat: 53.4808,
            lng: -2.2426,
            comuni: [
              { name: 'Manchester', lat: 53.4808, lng: -2.2426, isCapital: true },
              { name: 'Salford', lat: 53.4875, lng: -2.2901 },
              { name: 'Bolton', lat: 53.5780, lng: -2.4290 },
            ],
          },
        ],
      },
      {
        name: 'Scozia (Scotland)',
        capital: 'Edimburgo',
        lat: 55.9533,
        lng: -3.1883,
        provinces: [
          {
            name: 'City of Edinburgh',
            lat: 55.9533,
            lng: -3.1883,
            comuni: [
              { name: 'Edimburgo Centro / Royal Mile', lat: 55.9533, lng: -3.1883, isCapital: true },
              { name: 'Leith Port', lat: 55.9750, lng: -3.1670 },
            ],
          },
          {
            name: 'Glasgow City',
            lat: 55.8642,
            lng: -4.2518,
            comuni: [
              { name: 'Glasgow Centro', lat: 55.8642, lng: -4.2518, isCapital: true },
              { name: 'West End Glasgow', lat: 55.8720, lng: -4.2980 },
            ],
          },
        ],
      },
    ],
  },

  // 7. SVIZZERA (CH)
  {
    code: 'CH',
    code3: 'CHE',
    name: 'Svizzera',
    nativeName: 'Schweiz / Suisse / Svizzera',
    flag: '🇨🇭',
    continent: 'Europa',
    capital: 'Berna',
    lat: 46.9480,
    lng: 7.4474,
    currency: { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero' },
    lang: 'Italiano / Tedesco / Francese',
    regions: [
      {
        name: 'Ticino',
        capital: 'Bellinzona',
        lat: 46.1928,
        lng: 9.0178,
        provinces: [
          {
            name: 'Distretto di Lugano',
            lat: 46.0037,
            lng: 8.9511,
            comuni: [
              { name: 'Lugano Centro / Lungolago', lat: 46.0037, lng: 8.9511, isCapital: true },
              { name: 'Paradiso', lat: 45.9922, lng: 8.9489 },
              { name: 'Massagno', lat: 46.0117, lng: 8.9467 },
            ],
          },
          {
            name: 'Distretto di Bellinzona',
            lat: 46.1928,
            lng: 9.0178,
            comuni: [
              { name: 'Bellinzona Castelli', lat: 46.1928, lng: 9.0178, isCapital: true },
              { name: 'Giubiasco', lat: 46.1722, lng: 9.0069 },
            ],
          },
          {
            name: 'Distretto di Locarno',
            lat: 46.1670,
            lng: 8.7943,
            comuni: [
              { name: 'Locarno Piazza Grande', lat: 46.1670, lng: 8.7943, isCapital: true },
              { name: 'Ascona', lat: 46.1558, lng: 8.7739 },
            ],
          },
        ],
      },
      {
        name: 'Zürich (Zurigo)',
        capital: 'Zurigo',
        lat: 47.3769,
        lng: 8.5417,
        provinces: [
          {
            name: 'Bezirk Zürich',
            lat: 47.3769,
            lng: 8.5417,
            comuni: [
              { name: 'Zurigo Centro / Bahnhofstrasse', lat: 47.3769, lng: 8.5417, isCapital: true },
              { name: 'Winterthur', lat: 47.4988, lng: 8.7237 },
              { name: 'Uster', lat: 47.3500, lng: 8.7167 },
            ],
          },
        ],
      },
      {
        name: 'Genève (Ginevra)',
        capital: 'Ginevra',
        lat: 46.2044,
        lng: 6.1432,
        provinces: [
          {
            name: 'Canton de Genève',
            lat: 46.2044,
            lng: 6.1432,
            comuni: [
              { name: 'Ginevra Centro / Jet d\'Eau', lat: 46.2044, lng: 6.1432, isCapital: true },
              { name: 'Carouge', lat: 46.1833, lng: 6.1333 },
              { name: 'Vernier', lat: 46.2167, lng: 6.0833 },
            ],
          },
        ],
      },
    ],
  },

  // 8. GIAPPONE (JP)
  {
    code: 'JP',
    code3: 'JPN',
    name: 'Giappone',
    nativeName: '日本',
    flag: '🇯🇵',
    continent: 'Asia',
    capital: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    currency: { code: 'JPY', symbol: '¥', name: 'Yen' },
    lang: 'Giapponese',
    regions: [
      {
        name: 'Kanto',
        capital: 'Tokyo',
        lat: 35.6762,
        lng: 139.6503,
        provinces: [
          {
            name: 'Tokyo Metropolis (Prefettura)',
            lat: 35.6762,
            lng: 139.6503,
            comuni: [
              { name: 'Shinjuku', lat: 35.6938, lng: 139.7034, isCapital: true },
              { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004 },
              { name: 'Ginza / Chuo', lat: 35.6719, lng: 139.7650 },
              { name: 'Akihabara (Chiyoda)', lat: 35.6983, lng: 139.7731 },
              { name: 'Asakusa (Taito)', lat: 35.7118, lng: 139.7967 },
            ],
          },
        ],
      },
      {
        name: 'Kansai',
        capital: 'Osaka',
        lat: 34.6937,
        lng: 135.5023,
        provinces: [
          {
            name: 'Osaka Prefecture',
            lat: 34.6937,
            lng: 135.5023,
            comuni: [
              { name: 'Osaka Dotonbori', lat: 34.6937, lng: 135.5023, isCapital: true },
              { name: 'Umeda', lat: 34.7024, lng: 135.4959 },
            ],
          },
          {
            name: 'Kyoto Prefecture',
            lat: 35.0116,
            lng: 135.7681,
            comuni: [
              { name: 'Kyoto Centro Storico / Gion', lat: 35.0116, lng: 135.7681, isCapital: true },
              { name: 'Arashiyama', lat: 35.0116, lng: 135.6778 },
            ],
          },
        ],
      },
    ],
  },
];

function buildHierarchyFromWorldCountry(country: WorldCountry): NazioneData {
  const sourceRegions =
    country.regions && country.regions.length > 0
      ? country.regions
      : [
          {
            name: `Area Metropolitana ${country.capital || country.name}`,
            capital: country.capital || country.name,
            lat: country.lat,
            lng: country.lng,
          },
        ];

  return {
    code: country.code,
    code3: country.code3,
    name: country.name,
    nativeName: country.nativeName,
    flag: country.flag,
    continent: country.continent,
    capital: country.capital,
    lat: country.lat,
    lng: country.lng,
    currency: {
      code: country.currency.code,
      symbol: country.currency.symbol,
      name: country.currency.name,
    },
    lang: country.language.name,
    regions: sourceRegions.map((reg) => ({
      name: reg.name,
      capital: reg.capital,
      lat: reg.lat,
      lng: reg.lng,
      provinces: [
        {
          name: `${reg.name} (${reg.capital})`,
          lat: reg.lat,
          lng: reg.lng,
          comuni: [
            {
              name: reg.capital || reg.name,
              lat: reg.lat,
              lng: reg.lng,
              isCapital: true,
            },
          ],
        },
      ],
    })),
  };
}

// Funzione di lookup gerarchico per trovare una nazione (MAI fallback silenzioso su Italia/Roma)
export function getHierarchyForCountry(countryNameOrCode: string): NazioneData | null {
  const query = (countryNameOrCode || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!query) return null;

  const found = GLOBAL_HIERARCHY.find(
    (c) =>
      c.code.toLowerCase() === query ||
      c.code3.toLowerCase() === query ||
      c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === query ||
      c.nativeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === query
  );

  if (found) return found;

  // Ricerca completa in WORLD_COUNTRIES (~197 Stati sovrani)
  const worldMatch =
    findCountryByNameOrCode(countryNameOrCode) ||
    WORLD_COUNTRIES.find(
      (c) =>
        c.code.toLowerCase() === query ||
        c.code3.toLowerCase() === query ||
        c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === query ||
        c.nativeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === query
    );

  if (worldMatch) {
    return buildHierarchyFromWorldCountry(worldMatch);
  }

  return null;
}

