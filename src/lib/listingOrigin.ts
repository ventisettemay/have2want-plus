// Helper internazionalizzato per badge e informazioni di provenienza annunci
// Fornisce l'etichetta "Esterno" / "Illustrativo" / "Diretto P2P" tradotta nella lingua dell'utente o del territorio

export interface ExternalBadgeInfo {
  isExternal: boolean;
  isDemo: boolean;
  label: string;
  sublabel: string;
  sourceName?: string;
  tooltip: string;
}

// Traduzioni dell'etichetta "Esterno" e "Illustrativo" nelle principali lingue
const TRANSLATIONS: Record<string, {
  external: string;
  externalDesc: string;
  demo: string;
  demoDesc: string;
  p2pDirect: string;
  p2pDirectDesc: string;
}> = {
  it: {
    external: 'Esterno',
    externalDesc: 'Annuncio sincronizzato da portale esterno',
    demo: 'Di prova',
    demoDesc: 'Annuncio dimostrativo di prova della comunità',
    p2pDirect: 'Diretto P2P',
    p2pDirectDesc: 'Pubblicato direttamente su HAVE2WANT'
  },
  en: {
    external: 'External',
    externalDesc: 'Listing synced from external portal',
    demo: 'Test / Demo',
    demoDesc: 'Demonstrative sample test listing',
    p2pDirect: 'Direct P2P',
    p2pDirectDesc: 'Published directly on HAVE2WANT'
  },
  es: {
    external: 'Externo',
    externalDesc: 'Anuncio sincronizado desde portal externo',
    demo: 'De prueba',
    demoDesc: 'Anuncio de prueba demostrativo de la comunidad',
    p2pDirect: 'Directo P2P',
    p2pDirectDesc: 'Publicado directamente en HAVE2WANT'
  },
  fr: {
    external: 'Externe',
    externalDesc: 'Annonce synchronisée depuis un portail externe',
    demo: 'D\'essai',
    demoDesc: 'Annonce d\'essai démonstrative de la communauté',
    p2pDirect: 'Direct P2P',
    p2pDirectDesc: 'Publié directement sur HAVE2WANT'
  },
  de: {
    external: 'Extern',
    externalDesc: 'Anzeige aus externem Portal synchronisiert',
    demo: 'Testanzeige',
    demoDesc: 'Beispielhafte Testanzeige der Community',
    p2pDirect: 'Direkt P2P',
    p2pDirectDesc: 'Direkt auf HAVE2WANT veröffentlicht'
  },
  pt: {
    external: 'Externo',
    externalDesc: 'Anúncio sincronizado de portal externo',
    demo: 'De teste',
    demoDesc: 'Anúncio de teste demonstrativo da comunidade',
    p2pDirect: 'Direto P2P',
    p2pDirectDesc: 'Publicado diretamente no HAVE2WANT'
  },
  zh: {
    external: '外部',
    externalDesc: '从外部门户同步的公告',
    demo: '测试演示',
    demoDesc: '社区测试演示公告',
    p2pDirect: '直连 P2P',
    p2pDirectDesc: '直接发布在 HAVE2WANT'
  },
  ja: {
    external: '外部',
    externalDesc: '外部ポータルから同期された掲載',
    demo: 'テスト用',
    demoDesc: 'コミュニティのテスト用デモ掲載',
    p2pDirect: '直接 P2P',
    p2pDirectDesc: 'HAVE2WANTに直接投稿'
  },
  ru: {
    external: 'Внешний',
    externalDesc: 'Объявление синхронизировано с внешнего портала',
    demo: 'Тестовое',
    demoDesc: 'Демонстрационное тестовое объявление',
    p2pDirect: 'Прямой P2P',
    p2pDirectDesc: 'Опубликовано напрямую в HAVE2WANT'
  },
  ar: {
    external: 'خارجي',
    externalDesc: 'إعلان متزامن من بوابة خارجية',
    demo: 'تجريبي',
    demoDesc: 'إعلان تجريبي توضيحي للمجتمع',
    p2pDirect: 'مباشر P2P',
    p2pDirectDesc: 'منشور مباشرة على HAVE2WANT'
  }
};

/**
 * Risolve il codice lingua preferito (it, en, es, fr, de, ecc.)
 */
export function getActiveLanguageCode(customLocale?: string): string {
  if (customLocale && typeof customLocale === 'string') {
    const clean = customLocale.toLowerCase().slice(0, 2);
    if (TRANSLATIONS[clean]) return clean;
  }
  try {
    const navLang = (navigator.language || 'it').toLowerCase().slice(0, 2);
    if (TRANSLATIONS[navLang]) return navLang;
  } catch {}
  return 'it';
}

/**
 * Determina se un annuncio è esterno o di prova/illustrativo e restituisce i testi localizzati
 */
export function getListingOriginBadge(
  listing: any,
  preferredLangCode?: string
): ExternalBadgeInfo {
  const lang = getActiveLanguageCode(preferredLangCode);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.it;

  // Un annuncio è considerato esterno se ha il flag isExternal, o ha externalPortal / externalLink, o source_type === 'external'
  const isExternal = Boolean(
    listing?.isExternal === true ||
    listing?.is_external === true ||
    listing?.externalPortal ||
    listing?.externalSource ||
    listing?.source_type === 'external' ||
    listing?.source_type === 'portale_esterno'
  );

  // Un annuncio è di prova se marcato esplicitamente come demo/prova oppure appartiene ai dati campione/seme iniziali
  const isDemo = Boolean(
    !isExternal && (
      listing?.isDemo === true ||
      listing?.is_demo === true ||
      listing?.isIllustrative === true ||
      listing?.is_illustrative === true ||
      listing?.isTest === true ||
      listing?.is_test === true ||
      listing?.is_prova === true ||
      listing?.isProva === true ||
      listing?.isSample === true ||
      (typeof listing?.id === 'string' && (
        listing.id.startsWith('listing-') ||
        listing.id.startsWith('demo-') ||
        listing.id.startsWith('test-') ||
        listing.id.startsWith('sample-') ||
        listing.id.startsWith('mock-') ||
        listing.id.startsWith('seed-') ||
        listing.id === '1' ||
        listing.id === '2' ||
        listing.id === '3' ||
        listing.id === 'ann_0' ||
        listing.id === 'ann_1'
      ))
    )
  );

  const sourceName = listing?.externalPortal || listing?.externalSource || listing?.sourceName || '';

  if (isExternal) {
    return {
      isExternal: true,
      isDemo: false,
      label: t.external,
      sublabel: sourceName ? `${t.external}: ${sourceName}` : t.external,
      sourceName,
      tooltip: sourceName ? `${t.externalDesc} (${sourceName})` : t.externalDesc
    };
  }

  if (isDemo) {
    return {
      isExternal: false,
      isDemo: true,
      label: t.demo,
      sublabel: `${t.demo}`,
      tooltip: t.demoDesc
    };
  }

  return {
    isExternal: false,
    isDemo: false,
    label: t.p2pDirect,
    sublabel: t.p2pDirect,
    tooltip: t.p2pDirectDesc
  };
}
