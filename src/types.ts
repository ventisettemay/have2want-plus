// The 3 Rigid Real Action Switches for P2P Board (No Abstract / Deprecated Modes)
export type InteractionIntent = "VENDO" | "BARATTO_SCAMBIO" | "ACQUISTO_CERCO";

// Rigid Category and Subcategory Matrix (Real Commercial & Solidarity Taxonomy)
export type RealCategoryKey =
  | "attrezzi_lavoro"
  | "alimentari_km0"
  | "arredamento_casa"
  | "auto_moto_veicoli"
  | "elettronica_informatica"
  | "abbigliamento_accessori"
  | "libri_scuola_cultura"
  | "servizi_lavoro_buoni"
  | "rete_specialisti_supporto"
  | "casa_fai_da_te"; // Compatibilità pregressa

export type RealSubcategoryKey =
  // attrezzi_lavoro
  | "elettroutensili_professionali"
  | "utensili_manuali_officina"
  | "attrezzature_cantiere_edili"
  | "giardinaggio_agricoltura_tecnica"
  | "ferramenta_bulloneria"
  | "attrezzi_lavoro_utensili"
  // alimentari_km0
  | "ortofrutta_fresca_stagione"
  | "olio_vino_conserve"
  | "formaggi_latticini_artigianali"
  | "pane_farine_macinate_pietra"
  // arredamento_casa
  | "arredamento_mobili"
  | "tavoli_sedie_massello"
  | "armadi_credenze_restaurate"
  | "illuminazione_complementi"
  // libri_scuola_cultura
  | "scambio_libri_scolastici"
  | "saggistica_narrativa"
  // auto_moto_veicoli
  | "pneumatici_accessori"
  | "componenti_meccanici_ricambi"
  | "veicoli_usati"
  | "trasferte_passaggi_carpool"
  // abbigliamento_accessori
  | "vestiario_abiti"
  | "calzature_scarpe"
  | "accessori_moda"
  | "scarpe_antinfortunistiche_dpi"
  // elettronica_informatica
  | "telefonia_smartphone"
  | "hardware_computer"
  | "elettrodomestici"
  // servizi_lavoro_buoni
  | "carte_prepagate_buoni_carburante"
  | "manodopera_mestieri_riparazioni"
  | "ripetizioni_scolastiche"
  // rete_specialisti_supporto (Vetrina Gratis per Orientamento Solidale)
  | "medici_comunita"
  | "psicologi_ascolto"
  | "consulenza_professionale_etica";

export interface CategoryDefinition {
  key: RealCategoryKey;
  label: string;
  iconName: string;
  description: string;
  realImage: string; // Fotografia reale ad alta risoluzione
  bannerImage: string;
  badgeText?: string;
  subcategories: {
    key: RealSubcategoryKey;
    label: string;
    description: string;
    isCommunitySpecialist?: boolean; // Vetrina Gratis per supporto solidale in chat
    realImage?: string;
  }[];
}

// 5-Star Trust Rating & Anti-Self-Sponsorship Financial Lock
export interface UserTrustRating {
  averageStars: number; // 1.0 to 5.0
  totalReviewsCount: number;
  starBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  financialLockValidated: boolean; // True solo se quota X di interazione (0.10-0.25 Pi) è stata convalidata
  antiSelfSponsorshipShieldActive: boolean; // Blocco IP/Fingerprint hardware per impedire recensioni duplicate
}

// Discreet AI Review & Unsatisfied Customer Feedback Flow
export interface DiscreetAIReviewFeedback {
  id: string;
  authorUsername: string;
  authorName: string;
  targetId: string;
  targetName: string;
  stars: number; // 1 to 5
  interactionQuotaPiPaid: number; // e.g. 0.15 Pi
  isAIGeneratedCivilText: boolean; // True per valutazioni 1-3 stelle
  selectedIssues: string[]; // Micro-questionario deterministico
  civilReviewText: string; // Testo oggettivo, formale e civile generato dall'IA Discreta
  publishedAt: string;
  status: "pubblicata" | "in_replica" | "risolta";
  rightOfReply?: {
    recipientReplyText: string;
    repliedAt: string;
  };
}

// Community Specialist (Vetrina Sponsorizzata Gratuita & Orientamento Solidale)
export interface CommunitySpecialist {
  id: string;
  name: string;
  title: string; // es. "Dott. Marco Valenti - Medico di Medicina Generale"
  specialty: "medici_comunita" | "psicologi_ascolto" | "consulenza_professionale_etica";
  avatar: string;
  nation: string;
  region: string;
  province: string;
  city: string;
  lat: number;
  lng: number;
  physicalOfficeAddress: string;
  registeredOrderNumber: string; // Iscrizione Ordine / Albo
  freeChatOrientationOffered: boolean; // Offre supporto, orientamento e consigli gratuiti in chat
  permanentFreeShowcaseUnlocked: boolean; // Vetrina sponsorizzata permanente e gratuita su mappa 3D
  isPriorityOnMap: boolean; // Massima priorità visiva sui feed urbani (revocabile se rating < 3.8)
  trustRating: UserTrustRating;
  bio: string;
  availabilityHours: string;
  recentAIReviews?: DiscreetAIReviewFeedback[];
}

export interface ConcreteExchangeSpec {
  offer: {
    item: string;
    quantity: number;
    unit: "kg" | "g" | "litri" | "pezzi" | "ore_lavoro" | "confezioni" | "set";
    condition?: "fresco_giornata" | "usato_ottimo" | "nuovo" | "da_revisionare";
  };
  wanted: {
    item: string;
    quantity: number;
    unit: "kg" | "g" | "litri" | "pezzi" | "ore_lavoro" | "confezioni" | "set";
    acceptableAlternatives?: string[];
  };
  territorialScope: "locale_paese" | "citta_area" | "regionale" | "nazionale" | "globale";
  itemOrServiceAccepted?: string;
}

export interface HaveWantListing {
  id: string;
  intent: InteractionIntent; // VENDO, BARATTO_SCAMBIO, ACQUISTO_CERCO
  title: string;
  description: string;
  category: RealCategoryKey;
  subcategory: RealSubcategoryKey;
  piPrice?: number; // Price in Pi Coin
  price?: number; // Prezzo/Budget corrispondente in valuta locale (EUR, USD, etc.)
  currency?: string; // Valuta locale di riferimento (es. "EUR", "USD")
  concreteExchange?: ConcreteExchangeSpec;
  author: {
    name: string;
    username: string;
    avatar: string;
    reputation: number; // e.g. 4.9/5
    isPioneerVerified: boolean;
    city: string;
    province?: string;
  };
  // Optional Geolocation coordinates (omitted if unresolved instead of Null Island 0,0)
  lat?: number;
  lng?: number;
  countryCode?: string;
  locationArea: string; // Generic area/neighborhood (Privacy Masked)
  isFuzzyLocation?: boolean; // True if using centroid rather than private street address
  createdAt: string;
  imageUrl?: string;
  tags: string[];
  status: "active" | "matched" | "completed";
  channelId?: string; // Canale territoriale reale
  // Indicatori di provenienza: portale esterno (es. Subito, Facebook, eBay) o demo/illustrativo
  isExternal?: boolean;
  externalPortal?: string; // Es. "Subito.it", "Facebook Marketplace", "eBay Annunci", "Kijiji", "Wallapop"
  externalUrl?: string; // Link diretto opzionale verso l'annuncio su portale esterno
  isDemo?: boolean; // Flag per annunci illustrativi di esempio
}

// Tokenomics & Ad-Reward State for P2P Board Monetization
export interface AdRewardTokenomicsState {
  adsEnabled: boolean; // ON: automatic sponsor stream & auto-credits; OFF: direct Pi Wallet micro-fee
  adStreamEnabled?: boolean;
  userAdCreditBalancePi: number; // Accumulated Pi Coin credits from ad rewards or community sponsorships
  appCreditsPi?: number;
  fixedInteractionFeePi: number; // Quota X (e.g. 0.15 Pi) per chat / P2P connection (0.10 Pi - 0.25 Pi)
  totalInteractionsExecuted: number;
  savedPiViaAds: number;
  totalAdsWatched?: number;
  totalRewardEarnedPi?: number;
  unlockedChatsCount?: number;
  activeSponsorStreamTitle?: string;
}

export interface SalvavatuttoGuide {
  id: string;
  title: string;
  category: string;
  summary: string;
  steps: string[];
  author: string;
  upvotes: number;
  readTimeMin: number;
  lastUpdated: string;
  tags: string[];
  isEssential: boolean;
}

export interface CommunityChatMessage {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    badge?: string;
  };
  text: string;
  timestamp: string;
  room: "piazza-generale" | "aiuto-reciproco" | "baratto-pi" | "idee-futuro";
  likes?: number;
}

export interface CommerceShop {
  id: string;
  name: string;
  owner: {
    name: string;
    username: string;
    avatar: string;
  };
  type: "bottega_artigiana" | "bazar_usato" | "emporio_bio" | "ciclofficina" | "libreria_saperi" | "servizi_consulenza" | "pescheria" | "gelateria" | "supermercato";
  description: string;
  acceptsPi: boolean;
  acceptsBarter: boolean;
  barterConditions?: string;
  isKYCVerified: boolean;
  isLocalSponsor: boolean;
  sponsorInitiative?: string;
  itemsCount: number;
  rating: number;
  featuredOffer: string;
  realAddress?: string;
  city: string;
  // Mandatory coordinates for accurate 3D Photorealistic & Real World Geolocation
  lat: number;
  lng: number;
  externalWebsiteUrl?: string; // Deep link or merchant website for B2B redirection
  isFuzzyLocation?: boolean;
}

export interface RealGeographicHierarchy {
  country: string;
  region: string;
  province: string;
  city: string;
  district?: string;
  isFuzzyLocation: boolean;
}

export interface UserCreditBalance {
  piWalletBalance: number;
  sponsorCreditBalance: number;
  totalAvailable: number;
  autoRenewActive: boolean;
}

export interface PioneerUser {
  name: string;
  username: string;
  avatar: string;
  piBalance: number;
  reputation: number; // 1.0 to 5.0
  tradesCompleted: number;
  verifiedKYC: boolean;
  city: string;
  bio: string;
  rinnovoAutomatico?: boolean;
  creditBalance?: UserCreditBalance;
  trustRating?: UserTrustRating;
}

export interface TerritorialHierarchy {
  world: string;
  nation: string;
  region: string;
  city: string;
  districtOrVillage: string;
}

export type BazaarCondition =
  | "nuovo_garanzia"
  | "usato_ottimo"
  | "vintage_collezione"
  | "da_restaurare";

export interface TerritoryNucleus {
  id: string;
  areaName: string;
  region: string;
  nation: string;
  activeUsersCount: number;
  conversationsCount: number;
  listingsCount: number;
  shopsCount: number;
  criticalMassPercentage: number; // 0 to 100%
  status: "in_aggregazione" | "massa_critica_raggiunta" | "nuovo_paese";
  evolvedPaeseName?: string;
  firstCommerceCategory?: string;
}

// 6. Certified Neutral Meeting Points on Google Earth 3D
export type CertifiedMeetingPointType =
  | "piazza_comunale"
  | "stazione_polizia_carabinieri"
  | "parrocchia_chiesa"
  | "biblioteca_civica"
  | "stazione_ferroviaria_bus";

export interface CertifiedMeetingPoint {
  id: string;
  name: string;
  type: CertifiedMeetingPointType;
  country: string;
  region: string;
  province: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  securityFeatures: string[]; // es. "Videosorveglianza attiva H24", "Presidio pubblico", "Illuminazione notturna"
  recommendedHours: string; // es. "08:00 - 20:00"
  description: string;
}

// Digital Handshake (La Stretta di Mano Digitale)
export interface DigitalHandshakeSession {
  id: string;
  listingId: string;
  listingTitle: string;
  requesterUsername: string;
  providerUsername: string;
  oneTimePin: string; // 4-digit code generated on requester device
  status: "in_attesa_incontro" | "verificato_completato" | "annullato";
  generatedAt: string;
  completedAt?: string;
  meetingPointName?: string;
  ratingUnlocked: boolean;
}

// Listing 30-Day Persistence & Auto-Renewal Lifecycle
export interface ListingLifecycleRecord {
  listingId: string;
  publishedAt: string; // ISO date
  expiresAt: string; // ISO date (+30 days)
  autoRenewEnabled: boolean; // ON: auto-renews by deducting Pi/ad-credit; OFF: deactivates from 3D map
  notificationSent5DaysBefore: boolean;
  daysRemaining: number;
  status: "attivo" | "in_scadenza" | "scaduto_disattivato" | "rinnovato";
}

// Legal Welcome Shield & Compliance
export interface LegalShieldAgreement {
  accepted: boolean;
  acceptedAt?: string;
  version: string;
  p2pDisclaimerAccepted: boolean;
  specialistHealthShieldAccepted: boolean;
  privacyFuzzyGeocodingAccepted: boolean;
  countryCode?: string;
  noFiatAccepted?: boolean;
  developerExonerationAccepted?: boolean;
  adRewardCommercialAccepted?: boolean;
}

// Base44 BaaS Schemas & Re-exports
export type ProfileCategory = "CITADINO_PRIVATO" | "PROFESSIONISTA_SOCIALE" | "AZIENDA_STABILE";
export type ListingVisibilityLevel = "STANDARD" | "PREMIUM_ILLUMINATO" | "OFF_SPENTO";
export type ReportTargetType = "listing" | "user";

export interface Base44Profile {
  id: string;
  username: string;
  category: ProfileCategory;
  ad_completed_streak: number;
  ad_abbuoni_disponibili: number;
  ad_interrupt_count: number;
  pi_circuit_suspended_until: string | null;
  specialist_municipality_cap_verified: boolean;
  avatar_url?: string;
}

export interface Base44Listing {
  id: string;
  profile_id: string;
  have_description: string;
  want_description: string;
  visibility_level: ListingVisibilityLevel;
  visibility_expires_at: string;
  pi_testnet_tx_id: string;
  meeting_point_verified: boolean;
  handshake_pin: string;
  handshake_confirmed: boolean;
  exact_lat: number;
  exact_lng: number;
  municipality_centroid_lat: number;
  municipality_centroid_lng: number;
  privacy_mode_active: boolean;
}

export interface Base44Report {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: ReportTargetType;
  reason: string;
  details: string;
  status: "pending" | "resolved" | "dismissed";
}

// Abuse Report & Moderation Types
export type AbuseReportReason =
  | "richiesta_valuta_fiat_euro"
  | "categoria_illegale_proibita"
  | "molestie_comportamento_inappropriato"
  | "merce_contraffatta_non_conforme"
  | "abuso_consulenza_specialistica";

export interface AbuseReportPayload {
  id: string;
  reporterUsername: string;
  targetUsername: string;
  targetType: ReportTargetType; // strictly enum ['listing', 'user']
  targetId: string;
  targetTitle?: string;
  reason: AbuseReportReason;
  reasonLabel: string;
  details: string;
  timestamp: string;
  status: "inviata" | "in_esame" | "confermata_ban";
}

// Banned Accounts & Auto-Purge Record
// Banned Accounts & Auto-Purge Record
export interface BannedAccountRecord {
  username: string;
  reason: string;
  bannedAt: string;
  reportCount: number;
  averageRating: number;
  purgedListingIds: string[];
}

// 4 Satellite Constellations Configuration
export type SatelliteType = 'P2P' | 'KMZERO' | 'MONDO' | 'WEATHER';

export interface SatelliteOrbitConfigItem {
  type: SatelliteType;
  name: string;
  orbitRadiusMultiplier: number;
  speed: number;
  color: string;
  icon: string;
  description: string;
  requiresLocalUser?: boolean;
  requiresWeatherActive?: boolean;
}

export const SATELLITE_ORBIT_CONFIG: Record<SatelliteType, SatelliteOrbitConfigItem> = {
  P2P: {
    type: 'P2P',
    name: 'Costellazione Bacheca Lavoro & P2P',
    orbitRadiusMultiplier: 1.05,
    speed: 0.0008,
    color: '#00ff66',
    icon: '🤝',
    description: 'Scambi diretti tra cittadini e opportunità lavorative senza intermediari.',
  },
  KMZERO: {
    type: 'KMZERO',
    name: 'Costellazione Vetrina Km Zero',
    orbitRadiusMultiplier: 1.12,
    speed: 0.0015,
    color: '#10b981',
    icon: '🌱',
    description: 'Produttori agricoli locali e botteghe di vicinato entro 100km.',
    requiresLocalUser: true,
  },
  WEATHER: {
    type: 'WEATHER',
    name: 'Costellazione Radar Meteo Dinamico',
    orbitRadiusMultiplier: 1.25,
    speed: 0.0002,
    color: '#fbbf24',
    icon: '⛅',
    description: 'Troposfera e precipitazioni atmosferiche in tempo reale.',
    requiresWeatherActive: true,
  },
  MONDO: {
    type: 'MONDO',
    name: 'Costellazione Supermarket Globale',
    orbitRadiusMultiplier: 1.35,
    speed: 0.0004,
    color: '#06b6d4',
    icon: '🌍',
    description: 'Mercato globale trasparente: prezzo pattuito + spedizione + tracciamento.',
  },
};

// Order & Logistics Types (Separated Pricing Model)
export interface Order {
  id: string;
  buyerUsername: string;
  sellerUsername: string;
  itemTitle: string;
  itemPricePi: number;
  shippingFeePi: number;
  extraServiceFeePi: number;
  totalPi: number;
  isKmZeroPickup: boolean;
  shippingAddress?: string;
  trackingNumber?: string;
  status: 'in_attesa_pagamento' | 'pagato_in_preparazione' | 'spedito' | 'in_consegna' | 'completato_ritirato' | 'contestato';
  qrPickupCode?: string;
  qrPickupValidated: boolean;
  handshakeTxId?: string;
  createdAt: string;
  updatedAt: string;
}



