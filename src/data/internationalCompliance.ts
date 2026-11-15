// Quadro normativo internazionale e leggi nazionali per conformità globale HAVE2WANT PLUS
// Copre privacy, esonero responsabilità intermediari, divieto fiat, copyright e regolamentazione P2P

export interface CountryComplianceLaw {
  id: string;
  name: string;
  flag: string;
  langCode: string;
  langName: string;
  continent: string;
  privacyLaw: string;
  intermediaryLiabilityLaw: string;
  commercialCurrencyLaw: string;
  copyrightLaw: string;
  specificDisclaimers: {
    developerExoneration: string;
    noFiatRule: string;
    geoPrivacyRule: string;
    adRewardCommercialRule: string;
    p2pHandshakeRule: string;
  };
}

export const INTERNATIONAL_COMPLIANCE_COUNTRIES: CountryComplianceLaw[] = [
  {
    id: "IT",
    name: "Italia",
    flag: "🇮🇹",
    langCode: "it",
    langName: "Italiano",
    continent: "Europa",
    privacyLaw: "D.Lgs 196/2003 (Codice Privacy) novellato da D.Lgs 101/2018 & Regolamento UE 2016/679 (GDPR)",
    intermediaryLiabilityLaw: "D.Lgs 70/2003 (Recepimento Dir. 2000/31/CE E-Commerce, Art. 14-17: assenza di obbligo generale di sorveglianza per mera bacheca e hosting) & Digital Services Act (DSA - Reg. UE 2022/2065)",
    commercialCurrencyLaw: "TUB (D.Lgs 385/1993) e TUF (D.Lgs 58/1998): Piattaforma 100% non-custodial; divieto assoluto di intermediazione finanziaria fiat. Scambi in beni fisici o Pi Coin (π) diretto da wallet personale.",
    copyrightLaw: "Legge 633/1941 sul Diritto d'Autore e Trattato di Berna per la protezione delle opere letterarie e artistiche (Paternità originaria dell'Ideatore Registrato - Genesis Seal BOW-2026).",
    specificDisclaimers: {
      developerExoneration: "L'Ideatore, il Creatore e lo Sviluppatore software sono totalmente esonerati e manlevati ai sensi degli artt. 2043 e 2051 c.c. per qualsiasi inadempimento, perdita o controversia tra utenti scambianti.",
      noFiatRule: "È tassativamente escluso l'uso di Euro, valute legali statali o conti correnti bancari sul circuito; non vi è alcun deposito o trattenuta di denaro ai sensi dell'art. 1766 c.c.",
      geoPrivacyRule: "I dati geografici sono anonimizzati sul centroide del comune (~2.5 km di sfocatura geometrica) a tutela dell'incolumità personale e del domicilio privato (Art. 14 Costituzione e GDPR).",
      adRewardCommercialRule: "La visione dei video pubblicitari nell'Ad-Reward Hub è volontaria e genera crediti d'inserzione; le evidenze per palazzi 3D sono saldate unicamente in Pi tramite Pi SDK esterno.",
      p2pHandshakeRule: "La Stretta di Mano P2P con doppio PIN a 4 cifre attesta la conclusione materiale dell'accordo; ogni supporto solidale non sostituisce pareri medici o prescrizioni cliniche (D.M. Sanità)."
    }
  },
  {
    id: "EU",
    name: "Unione Europea (Quadro Generale)",
    flag: "🇪🇺",
    langCode: "en",
    langName: "English / European Framework",
    continent: "Europa",
    privacyLaw: "General Data Protection Regulation (EU) 2016/679 (GDPR) & ePrivacy Directive 2002/58/EC",
    intermediaryLiabilityLaw: "EU Digital Services Act (DSA - Regulation (EU) 2022/2065, Articles 4 to 6: Liability exemptions for hosting and intermediary services) & Directive 2000/31/EC",
    commercialCurrencyLaw: "MiCA Regulation (Markets in Crypto-Assets) / Non-Custodial Barter: No fiat custody, no custodial crypto wallets, purely direct P2P interactions without centralized funds management.",
    copyrightLaw: "Directive (EU) 2019/790 on copyright in the Digital Single Market & Berne Convention (WIPO)",
    specificDisclaimers: {
      developerExoneration: "The creator, software developer, and system administrators hold zero liability for peer-to-peer discussions, listings, or bilateral trades under EU intermediary liability exemptions.",
      noFiatRule: "No fiat currency processing, banking channels, or custodial balances. Direct barter or external Pi cryptocurrency transactions only.",
      geoPrivacyRule: "Strict territorial privacy compliance with fuzzy municipality centroids (~2.5km) preventing home address revelation and profiling.",
      adRewardCommercialRule: "Commercial building visibility and sponsor boosts are purchased via external Pi SDK payments. Ad watching rewards user listing credits without monetary disbursement.",
      p2pHandshakeRule: "4-digit verification handshake formalizes private barter agreements. Mutual community counseling does not constitute medical advice or regulated legal counsel."
    }
  },
  {
    id: "ES",
    name: "España",
    flag: "🇪🇸",
    langCode: "es",
    langName: "Español",
    continent: "Europa",
    privacyLaw: "Reglamento (UE) 2016/679 (RGPD) & Ley Orgánica 3/2018 (LOPDGDD de Protección de Datos Personales)",
    intermediaryLiabilityLaw: "Ley 34/2002 (LSSI-CE: Régimen de responsabilidad de los prestadores de servicios de la sociedad de la información y alojamiento neutral) y Reglamento DSA UE",
    commercialCurrencyLaw: "Régimen mercantil de permuta y trueque (Código Civil arts. 1538-1541): Ausencia de custodia financiera y exclusión de moneda fiduciaria euro.",
    copyrightLaw: "Real Decreto Legislativo 1/1996 (Ley de Propiedad Intelectual) y Convenio de Berna.",
    specificDisclaimers: {
      developerExoneration: "El Creador y Desarrollador quedan eximidos de responsabilidad conforme al art. 1902 del Código Civil y régimen LSSI por intercambios o acuerdos privados entre usuarios.",
      noFiatRule: "Plataforma sin moneda fiat. No se operan pagos bancarios ni cuentas de custodia; solo trueque ético y Pi Network en wallet externo.",
      geoPrivacyRule: "Protección estricta del domicilio familiar: coordenadas limitadas al centroide municipal con radio de privacidad de ~2.5 km.",
      adRewardCommercialRule: "Visualización voluntaria de anuncios publicitarios para ganar créditos comunitarios; edificios 3D comerciales activables mediante Pi SDK.",
      p2pHandshakeRule: "Apretón de manos digital con PIN de 4 cifras para confirmar la entrega material del bien o servicio solidario sin intermediarios."
    }
  },
  {
    id: "FR",
    name: "France",
    flag: "🇫🇷",
    langCode: "fr",
    langName: "Français",
    continent: "Europa",
    privacyLaw: "Règlement (UE) 2016/679 (RGPD) & Loi n° 78-17 Informatique et Libertés modifiée par la loi n° 2018-493",
    intermediaryLiabilityLaw: "Loi pour la Confiance dans l'Économie Numérique (LCEN n° 2004-575, art. 6: statut d'hébergeur neutre non responsable des contenus des tiers) & Règlement DSA",
    commercialCurrencyLaw: "Code monétaire et financier: Absence totale de services sur actifs numériques dépositaires (PSAN non requis car plateforme 100% non-custodial sans monnaie fiat).",
    copyrightLaw: "Code de la propriété intellectuelle (Art. L.111-1 et suivants) & Convention de Berne pour la protection des oeuvres de l'esprit.",
    specificDisclaimers: {
      developerExoneration: "L'auteur initial et le développeur sont intégralement exonérés de toute responsabilité contractuelle ou délictuelle (Art. 1240 du Code civil) relative aux échanges.",
      noFiatRule: "Interdiction des devises fiat (Euros/Dollars); troc de pair à pair et paiements optionnels Pi Network via le Pi Browser sans intermédiaire.",
      geoPrivacyRule: "Floutage automatique de la géolocalisation sur le centroïde communal (~2.5 km) garantissant le respect de la vie privée et du domicile.",
      adRewardCommercialRule: "Visionnage d'annonces publicitaires pour accumuler des crédits d'annonces; mise en lumière des bâtiments 3D via les fonctions de paiement Pi SDK.",
      p2pHandshakeRule: "Poignée de main numérique avec double code PIN à 4 chiffres; les conseils solidaires ne constituent en aucun cas une consultation médicale d'urgence."
    }
  },
  {
    id: "DE",
    name: "Deutschland",
    flag: "🇩🇪",
    langCode: "de",
    langName: "Deutsch",
    continent: "Europa",
    privacyLaw: "Datenschutz-Grundverordnung (DSGVO) & Bundesdatenschutzgesetz (BDSG)",
    intermediaryLiabilityLaw: "Digitale-Dienste-Gesetz (DDG) / ehem. Telemediengesetz (TMG §§ 7-10: Haftungsausschluss für Dienstanbieter bei fremden Inhalten) & EU-DSA",
    commercialCurrencyLaw: "Kreditwesengesetz (KWG) Konformität: Keine Einlagenverwaltung, keine Verwahrung von Fiat-Währungen; reine Non-Custodial Tauschplattform.",
    copyrightLaw: "Urheberrechtsgesetz (UrhG) & Berner Übereinkunft zum Schutz von Werken der Literatur und Kunst.",
    specificDisclaimers: {
      developerExoneration: "Vollständiger Haftungsausschluss für den Software-Urheber und Systementwickler gemäß § 823 BGB bezüglich privater Handelsabsprachen der Nutzer.",
      noFiatRule: "Kein Fiat-Geld (Euro/Dollar). Ausschließlich privater Sachwarentausch oder Pi Network Übertragungen über externe Wallets.",
      geoPrivacyRule: "Vollständiger Geodatenschutz: Unschärferadius von ~2,5 km um den Gemeindeschwerpunkt zum Schutz der privaten Wohnadresse.",
      adRewardCommercialRule: "Freiwilliges Ansehen von Werbung im Ad-Hub für Inseratsguthaben; Hervorhebung gewerblicher 3D-Gebäude über Pi SDK Schnittstelle.",
      p2pHandshakeRule: "Digitaler 4-Ziffern-PIN Handschlag zur Bestätigung materieller Übergaben; gegenseitige Nachbarschaftshilfe ersetzt keine ärztliche Behandlung."
    }
  },
  {
    id: "US",
    name: "United States of America",
    flag: "🇺🇸",
    langCode: "en",
    langName: "English",
    continent: "Americhe",
    privacyLaw: "California Consumer Privacy Act (CCPA/CPRA), FTC Privacy Guidelines & Federal Electronic Communications Privacy Act (ECPA)",
    intermediaryLiabilityLaw: "Section 230 of the Communications Decency Act (47 U.S.C. § 230: Platform creator and operator absolute immunity for third-party user-generated listings and communications)",
    commercialCurrencyLaw: "Uniform Commercial Code (UCC) Article 2 (Barter & Goods Exchange): No custodial banking, no fiat currency transmission, non-custodial peer-to-peer interactions.",
    copyrightLaw: "Title 17 U.S. Code (Copyright Act), Digital Millennium Copyright Act (DMCA) & Berne Convention for the Protection of Literary and Artistic Works.",
    specificDisclaimers: {
      developerExoneration: "The original author and software engineers bear ZERO liability for any trades, physical encounters, warranties, or damages arising from community platform use.",
      noFiatRule: "No fiat currency (USD), credit cards, or centralized escrow. Pure peer-to-peer barter and external Pi Network transfers directly from user-owned wallets.",
      geoPrivacyRule: "Precise home street addresses are strictly prohibited and never stored; location tags resolve to fuzzy district or municipal centroids (~1.5 miles / 2.5 km).",
      adRewardCommercialRule: "Users may voluntarily watch sponsor ads to earn listing credits; commercial building promotions are settled in Pi via the official Pi SDK bridge.",
      p2pHandshakeRule: "Mutual 4-digit security PIN handshakes verify trade completion; community peer support does not constitute medical, mental health, or financial counseling."
    }
  },
  {
    id: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    langCode: "en",
    langName: "English",
    continent: "Europa",
    privacyLaw: "UK GDPR & Data Protection Act 2018",
    intermediaryLiabilityLaw: "Electronic Commerce (EC Directive) Regulations 2002 & Online Safety Act 2023 (Neutral intermediary hosting protections)",
    commercialCurrencyLaw: "FCA Non-Custodial Guidelines: Zero custody of fiat funds or private keys; private consumer-to-consumer exchange and barter.",
    copyrightLaw: "Copyright, Designs and Patents Act 1988 & Berne Convention international copyright protections.",
    specificDisclaimers: {
      developerExoneration: "Full waiver of liability for platform developers and administrators regarding peer interactions and user-generated adverts.",
      noFiatRule: "No British Pounds (GBP) or bank card processing. 100% peer barter and decentralized Pi Network transactions.",
      geoPrivacyRule: "Centroid-based spatial fuzzing (~2.5 km) safeguards residential privacy and prevents door-to-door tracking.",
      adRewardCommercialRule: "Voluntary ad viewership credits users with listing quota; businesses sponsor local 3D building pins via Pi SDK.",
      p2pHandshakeRule: "Secure dual-PIN handshake seals local trades; mutual help networks do not replace NHS or emergency clinical services."
    }
  },
  {
    id: "CN",
    name: "中国 (China)",
    flag: "🇨🇳",
    langCode: "zh",
    langName: "中文 (Chinese)",
    continent: "Asia",
    privacyLaw: "中华人民共和国个人信息保护法 (PIPL - Personal Information Protection Law) & 数据安全法",
    intermediaryLiabilityLaw: "中华人民共和国民法典侵权责任编 & 中华人民共和国电子商务法 (网络服务提供者避风港与中立平台免责规则)",
    commercialCurrencyLaw: "民法典合同编关于互易合同 (以物换物/二手闲置) 之规定：平台不设法币存管与资金结算，完全去中心化点对点交互与 Pi Network 支持。",
    copyrightLaw: "中华人民共和国著作权法及伯尔尼保护文学和艺术作品公约。",
    specificDisclaimers: {
      developerExoneration: "平台创始作者与技术开发团队仅提供3D地图可视化与撮合信息展示，对用户间交易争议和私下约定不承担任何法律责任。",
      noFiatRule: "绝无法币（人民币或外币）交易及资金托管功能；仅支持社区成员友好以物易物互助及外部 Pi Network 钱包直连。",
      geoPrivacyRule: "严格保护个人与家庭住址隐私：发布坐标仅模糊匹配至城市/区行政中心点（约2.5公里模糊半径），禁止暴露门牌号。",
      adRewardCommercialRule: "用户可通过自愿观看广告中心激励视频获取发布配额；商业地标与商户3D建筑点亮通过 Pi SDK 函数直接发起支付。",
      p2pHandshakeRule: "4位数数字握手PIN码用于当面交付确认；社区问答交流仅供参考，不替代任何专业医疗诊断或国家执业医师服务。"
    }
  },
  {
    id: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    langCode: "pt",
    langName: "Português",
    continent: "Americhe",
    privacyLaw: "Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)",
    intermediaryLiabilityLaw: "Marco Civil da Internet (Lei nº 12.965/2014, art. 19: Isenção de responsabilidade dos provedores de aplicação por conteúdos de terceiros)",
    commercialCurrencyLaw: "Código Civil Brasileiro (Arts. 533: Contrato de troca ou permuta): Ausência de custódia fiat e sem intermediação bancária.",
    copyrightLaw: "Lei de Direitos Autorais (Lei nº 9.610/1998) e Convenção de Berna.",
    specificDisclaimers: {
      developerExoneration: "Isenção total de responsabilidade civil para o idealizador e equipe de desenvolvimento de software em relação aos anúncios e trocas.",
      noFiatRule: "Sem circulação de moeda fiduciária (Real/Dólar); plataforma exclusiva para escambo ético e transferências Pi Network sem custódia.",
      geoPrivacyRule: "Privacidade territorial com centróides municipais e raio difuso de ~2,5 km para proteção da residência privada.",
      adRewardCommercialRule: "Visualização voluntária de anúncios no Ad-Reward Hub para obter créditos; edifícios comerciais 3D pagos diretamente via Pi SDK.",
      p2pHandshakeRule: "Aperto de mão com PIN duplo de 4 dígitos para confirmação de entrega; apoio solidário comunitário não substitui orientação médica."
    }
  },
  {
    id: "JP",
    name: "日本 (Japan)",
    flag: "🇯🇵",
    langCode: "ja",
    langName: "日本語 (Japanese)",
    continent: "Asia",
    privacyLaw: "個人情報の保護に関する法律 (APPI - Act on the Protection of Personal Information)",
    intermediaryLiabilityLaw: "特定電気通信役務提供者の損害賠償責任の制限及び発信者情報の開示に関する法律 (プロバイダ責任制限法)",
    commercialCurrencyLaw: "民法第586条（交換契約）：法定通貨の預託や為替取引を一切行わず、純粋なP2P物品交換および外部Pi Network直結。",
    copyrightLaw: "著作権法及び文学的及び美術的著作物の保護に関するベルヌ条約。",
    specificDisclaimers: {
      developerExoneration: "開発者および考案者は、ユーザー間の取引、約束、紛争に対して一切の民事上・刑事上の責任を負いません。",
      noFiatRule: "法定通貨（日本円等）の取り扱いは一切ありません。個人間の物々交換または外部Piウォレットによる直接決済のみ対応します。",
      geoPrivacyRule: "厳格な位置情報プライバシー：市町村の中心点（約2.5kmのぼかし半径）でのみ表示され、個人の自宅住所は一切記録・公開されません。",
      adRewardCommercialRule: "広告動画の自主視聴により投稿クレジットを獲得可能；商業3D建物のハイライトはPi SDK関数経由で決済されます。",
      p2pHandshakeRule: "4桁のデジタル握手PINコードによる受け渡し確認；コミュニティ内の助言は医療診断や法的アドバイスに代わるものではありません。"
    }
  },
  {
    id: "GLOBAL",
    name: "Convenzioni Internazionali & Altri Paesi",
    flag: "🌐",
    langCode: "en",
    langName: "International Treaty Framework",
    continent: "Mondo",
    privacyLaw: "United Nations Universal Declaration of Human Rights (Art. 12 Right to Privacy), OECD Privacy Guidelines & Cross-Border Privacy Rules (CBPR)",
    intermediaryLiabilityLaw: "UNCITRAL Model Law on Electronic Commerce (1996) & Manila Principles on Intermediary Liability",
    commercialCurrencyLaw: "Non-Custodial Barter and Decentralized Crypto-Asset Standard: Zero fiat holding, zero depository intermediation, direct P2P sovereign exchange.",
    copyrightLaw: "WIPO Berne Convention for the Protection of Literary and Artistic Works (Universal software and intellectual genesis protection under Genesis Seal BOW-2026).",
    specificDisclaimers: {
      developerExoneration: "Software is provided as-is with total exemption of developer and genesis creator liability under international tort and contract standards.",
      noFiatRule: "Universal exclusion of fiat currency. Sovereign peer-to-peer barter, human reciprocity, and non-custodial Pi Network utility token transfers.",
      geoPrivacyRule: "Global centroid obfuscation protocol (~2.5km blur radius) protecting human residences across all UN sovereign territories.",
      adRewardCommercialRule: "Decentralized Ad-Reward Hub for free community listing credits; commercial building pins sponsored directly via Pi SDK payment mandating.",
      p2pHandshakeRule: "Universal 4-digit dual cryptographic PIN handshake finalizing face-to-face peer swaps; peer solidarity never substitutes for emergency clinical services."
    }
  }
];

// Helper per trovare il framework legale di una nazione o fallback
export function getCountryCompliance(countryCode?: string): CountryComplianceLaw {
  if (!countryCode) return INTERNATIONAL_COMPLIANCE_COUNTRIES[0]; // Default Italia
  const upper = countryCode.toUpperCase();
  const match = INTERNATIONAL_COMPLIANCE_COUNTRIES.find(c => c.id === upper);
  if (match) return match;

  // Fallback a quadro generale europeo se in UE, o globale
  return INTERNATIONAL_COMPLIANCE_COUNTRIES.find(c => c.id === "GLOBAL") || INTERNATIONAL_COMPLIANCE_COUNTRIES[0];
}
