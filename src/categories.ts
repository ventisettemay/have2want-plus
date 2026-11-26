import { CategoryDefinition, RealCategoryKey, RealSubcategoryKey } from "./types";

export const CATEGORY_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=600&auto=format&fit=crop&q=80";

export const REAL_CATEGORIES_MATRIX: CategoryDefinition[] = [
  {
    key: "attrezzi_lavoro",
    label: "Attrezzature, Utensili & Ferramenta",
    iconName: "Hammer",
    description: "Elettroutensili professionali, utensili manuali da officina, banchi lavoro, attrezzatura edile e ferramenta tecnica.",
    realImage: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&auto=format&fit=crop&q=80",
    badgeText: "TIPOLOGIA DEDICATA",
    subcategories: [
      {
        key: "elettroutensili_professionali",
        label: "Elettroutensili & Trapani Professionali",
        description: "Trapani a percussione, smerigliatrici angolari, seghe circolari, tassellatori e levigatrici a batteria o filo.",
        realImage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "utensili_manuali_officina",
        label: "Utensili Manuali & Officina Meccanica",
        description: "Chiavi combinate, cricchetti, pinze da presa, martelli, cacciaviti professionali e cassette attrezzi.",
        realImage: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "attrezzature_cantiere_edili",
        label: "Attrezzature da Cantiere & Saldatrici",
        description: "Betoniere, saldatrici a filo/inverter, trabattelli, compressori aria e banchi da taglio.",
        realImage: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "giardinaggio_agricoltura_tecnica",
        label: "Motoseghe, Decespugliatori & Utensili Terra",
        description: "Motoseghe a catena, soffiatori, cesoie telescopiche e attrezzi tecnici per orticoltura e potatura.",
        realImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "ferramenta_bulloneria",
        label: "Ferramenta, Bulloneria & Fissaggi",
        description: "Viti strutturali, tasselli chimici, staffe in acciaio, cuscinetti e minuterie metalliche.",
        realImage: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "alimentari_km0",
    label: "Km 0, Botteghe & Produttori Locali",
    iconName: "Store",
    description: "Filiera cortissima del territorio: ortofrutta biologica di stagione, olio extravergine, formaggi artigianali e farine a pietra.",
    realImage: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=80",
    badgeText: "FILIERA CORTA",
    subcategories: [
      {
        key: "ortofrutta_fresca_stagione",
        label: "Ortofrutta Fresca di Stagione",
        description: "Pomodori cuore di bue, mele autoctone, zucche, legumi freschi e cassette dall'orto.",
        realImage: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "olio_vino_conserve",
        label: "Olio Extravergine, Vino & Conserve",
        description: "Olio da frantoio spremuto a freddo, bottiglie di cantina locale e passate artigianali.",
        realImage: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "formaggi_latticini_artigianali",
        label: "Formaggi & Cascine d'Alpeggio",
        description: "Tome stagionate, caciotte a latte crudo, burro di malga e formaggi tipici dei borghi.",
        realImage: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "pane_farine_macinate_pietra",
        label: "Pane a Lievito Madre & Farine Macinate a Pietra",
        description: "Grani antichi, pagnotte contadine a lunga fermentazione e semole integrali.",
        realImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "arredamento_casa",
    label: "Arredo, Mobili & Design Abitativo",
    iconName: "Home",
    description: "Mobili in legno massello restaurati, tavoli da pranzo, credenze d'epoca, sedie rustiche e complementi d'arredo.",
    realImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80",
    badgeText: "NO ATTREZZI",
    subcategories: [
      {
        key: "tavoli_sedie_massello",
        label: "Tavoli da Pranzo & Sedie Massello",
        description: "Tavoli noce o rovere piallati a mano, sedie in paglia di Vienna e panche rustiche.",
        realImage: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "armadi_credenze_restaurate",
        label: "Armadi, Madie & Credenze d'Epoca",
        description: "Mobili contenitori restaurati a gommalacca o cera vergine d'api, finiture originali.",
        realImage: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "illuminazione_complementi",
        label: "Illuminazione & Complementi d'Interni",
        description: "Lampade artigianali in ferro battuto, specchiere dorate, cuscini in lino e tappeti.",
        realImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "arredamento_mobili",
        label: "Arredamento Generale & Mobili Casa",
        description: "Librerie modulari, scrivanie studio, divani e arredi per spazi vivibili.",
        realImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "auto_moto_veicoli",
    label: "Veicoli, Ricambi & Meccanica",
    iconName: "Car",
    description: "Pezzi di ricambio officina, pneumatici stagionali, cargo bike, veicoli da lavoro e mobilità territoriale.",
    realImage: CATEGORY_FALLBACK_IMAGE,
    bannerImage: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&auto=format&fit=crop&q=80",
    badgeText: "MECCANICA & MOBILITÀ",
    subcategories: [
      {
        key: "pneumatici_accessori",
        label: "Pneumatici Termici & Accessori Ruota",
        description: "Gomme invernali, 4 stagioni, cerchi in lega, catene da neve omologate e sensori TPMS.",
        realImage: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "componenti_meccanici_ricambi",
        label: "Ricambi Meccanici, Batterie & Freni",
        description: "Pastiglie freno, dischi, alternatori, batterie auto/furgone, filtri e candele.",
        realImage: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "veicoli_usati",
        label: "Biciclette, Mezzi da Lavoro & Furgoni",
        description: "Cargo bike, city bike da passeggio revisionate, scooter e furgoni di seconda mano.",
        realImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "trasferte_passaggi_carpool",
        label: "Trasferte & Passaggi Condivisi (Carpool)",
        description: "Viaggi condivisi tra città e comuni con rimborso chilometrico o baratto simbolico.",
        realImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "elettronica_informatica",
    label: "Elettronica & Informatica Professionale",
    iconName: "Laptop",
    description: "Laptop ricondizionati, monitor IPS, smartphone rigenerati garantiti, schede elettroniche e hardware.",
    realImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1200&auto=format&fit=crop&q=80",
    badgeText: "HARDWARE & TECH",
    subcategories: [
      {
        key: "hardware_computer",
        label: "Notebook, Computer & Schermi",
        description: "Portatili Intel/Ryzen con SSD veloci, monitor da ufficio, tastiere meccaniche e docking station.",
        realImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "telefonia_smartphone",
        label: "Smartphone & Dispositivi Mobili",
        description: "Telefoni rigenerati sbloccati, batterie nuove con garanzia di tenuta e accessori protettivi.",
        realImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "elettrodomestici",
        label: "Elettrodomestici Funzionanti & Revisionati",
        description: "Robot da cucina, impastatrici planetarie, fornetti, ferri da stiro professionali.",
        realImage: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "abbigliamento_accessori",
    label: "Abbigliamento, Calzature & DPI da Lavoro",
    iconName: "Shirt",
    description: "Scarponi antinfortunistici rinforzati, tute da officina, giacconi invernali pesanti, borse in cuoio e moda circolare.",
    realImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80",
    badgeText: "DPI & TESSILI",
    subcategories: [
      {
        key: "scarpe_antinfortunistiche_dpi",
        label: "Scarpe Antinfortunistiche & DPI",
        description: "Calzature S3 con puntale in acciaio, suola antisdrucciolo, occhiali protettivi e guanti da lavoro.",
        realImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "calzature_scarpe",
        label: "Calzature & Scarpe da Passeggio",
        description: "Scarponi da montagna, stivali in gomma impermeabili e scarpe quotidiane in cuoio.",
        realImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "vestiario_abiti",
        label: "Giacconi da Lavoro, Tute & Maglieria",
        description: "Giacche invernali imbottite, maglioni in pura lana, pantaloni tecnici multitasche e tute.",
        realImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "accessori_moda",
        label: "Borse in Cuoio, Cinture & Zaini Ergonomici",
        description: "Zaini scuola rinforzati con tasca PC, cinture in pelle spessa e tracolle artigianali.",
        realImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "libri_scuola_cultura",
    label: "Libri, Testi Scolastici & Saggistica",
    iconName: "GraduationCap",
    description: "Scambio diretto di testi scolastici usati (scuole medie e superiori), manuali tecnici, saggi di agronomia e romanzi.",
    realImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
    badgeText: "STUDENTI & CULTURA",
    subcategories: [
      {
        key: "scambio_libri_scolastici",
        label: "Scambio Testi Scolastici (Medie & Superiori)",
        description: "Adozioni di testi di grammatica, matematica, chimica, fisica e lingue tra famiglie a costo zero o simbolico.",
        realImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "saggistica_narrativa",
        label: "Manuali Tecnici, Agronomia & Saggi",
        description: "Trattati di botanica, permacultura, artigianato, storia locale e narrativa classica.",
        realImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "servizi_lavoro_buoni",
    label: "Bacheca Lavoro P2P & Competenze",
    iconName: "Wrench",
    description: "Manodopera qualificata, riparazioni domestiche, idraulica, falegnameria, ripetizioni scolastiche e aiuto pratico.",
    realImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=80",
    badgeText: "COMPETENZE REALI",
    subcategories: [
      {
        key: "manodopera_mestieri_riparazioni",
        label: "Mestieri, Manodopera & Riparazioni Rapide",
        description: "Interventi idraulici, falegnameria, riparazione tapparelle, affilatura lame e manutenzione cancelli.",
        realImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "ripetizioni_scolastiche",
        label: "Ripetizioni Scolastiche & Aiuto Compiti",
        description: "Lezioni individuali di matematica, fisica, inglese e metodo di studio pomeridiano per ragazzi.",
        realImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "carte_prepagate_buoni_carburante",
        label: "Buoni Carburante & Carte Prepagate",
        description: "Esuberi di buoni spesa e voucher carburante per spostamenti essenziali.",
        realImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    key: "rete_specialisti_supporto",
    label: "Rete Specialisti Sostenitori (Vetrina Solidale)",
    iconName: "HeartHandshake",
    description: "Medici, psicologi e consulenti legali ed etici della comunità per orientamento preliminare gratuito in chat.",
    realImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80",
    badgeText: "ORIENTAMENTO GRATUITO",
    subcategories: [
      {
        key: "medici_comunita",
        label: "Medici di Base & Salute Solidale",
        description: "Orientamento clinico e chiarimento su esami o prevenzione medica di base.",
        isCommunitySpecialist: true,
        realImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "psicologi_ascolto",
        label: "Psicologi dell'Ascolto & Benessere Emotivo",
        description: "Prima accoglienza emotiva, orientamento e consulenza psicologica per superare momenti critici.",
        isCommunitySpecialist: true,
        realImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      },
      {
        key: "consulenza_professionale_etica",
        label: "Consulenza Legale & Fiscale Etica",
        description: "Supporto normativo su accordi, contratti e locazioni.",
        isCommunitySpecialist: true,
        realImage: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&auto=format&fit=crop&q=80",
      },
    ],
  },
];

export function getCategoryDefinition(key: string): CategoryDefinition | undefined {
  if (key === "casa_fai_da_te") {
    // Mappa retrocompatibile verso attrezzi o arredo
    return REAL_CATEGORIES_MATRIX.find((c) => c.key === "attrezzi_lavoro");
  }
  return REAL_CATEGORIES_MATRIX.find((c) => c.key === key);
}

export function getCategoryLabel(key: string): string {
  if (key === "casa_fai_da_te") return "Attrezzature & Utensili da Lavoro";
  return getCategoryDefinition(key)?.label || key;
}

export function getSubcategoryLabel(catKey: string, subKey: string): string {
  const cat = getCategoryDefinition(catKey);
  const sub = cat?.subcategories.find((s) => s.key === subKey);
  return sub?.label || subKey;
}
