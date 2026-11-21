import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COUNTRIES, getCountryForListing } from '@/data/countries';
import { ITALIAN_REGIONS, SPONSORED_BUSINESSES } from '@/data/regions';
import { WORLD_COUNTRIES, findNearestCountry } from '@/lib/worldAtlas';
import { createPoliticalGlobeTexture } from '@/lib/politicalGlobeTexture';
import { classifyMerchantPin } from '@/lib/merchantPinClassifier';
import { ACTIVE_CHAT_USERS } from '@/data/chatUsers';
import { Globe, RefreshCw, Compass, ZoomIn, ZoomOut, Eye, Sparkles, MapPin, ArrowRight, Layers, Plus, Minus, Disc, X, Maximize2, Minimize2, CloudRain, CloudSun } from 'lucide-react';
import { toast } from 'sonner';

import { INITIAL_SATELLITES_CATALOG, satelliteEngine } from '@/lib/satelliteModularEngine';
import { buildEngineeredSpacecraft, createSharedAerospaceMaterials } from '@/components/have2want/spacecraft3D/SpacecraftModelsBuilder';
import { composeRainViewerGlobeCanvas } from '@/lib/rainViewerGlobeLayer';

// Database unificato ad altissima copertura per il raycasting su qualsiasi territorio del pianeta
const ALL_COUNTRIES_DATA = (() => {
  const map = new Map();

  // 1. Inserisci tutti i paesi da WORLD_COUNTRIES
  WORLD_COUNTRIES.forEach((wc) => {
    const code = (wc.code || '').toLowerCase();
    map.set(code, {
      id: code,
      code: wc.code,
      name: wc.name,
      capital: wc.capital,
      flag: wc.flag,
      lat: wc.lat,
      lng: wc.lng,
      currency: `${wc.currency?.code || 'EUR'} (${wc.currency?.symbol || '€'})`,
      currencyData: wc.currency,
      lang: wc.language?.name || 'Locale',
      language: wc.language,
      timezone: wc.timezone,
      description: `${wc.name} • Capitale: ${wc.capital} • Lingua: ${wc.language?.name || 'Locale'}`,
    });
  });

  // 2. Unisci/integra con COUNTRIES
  COUNTRIES.forEach((c) => {
    const id = (c.id || '').toLowerCase();
    const existing = map.get(id);
    if (existing) {
      map.set(id, {
        ...existing,
        ...c,
        flag: c.flag || existing.flag,
        lat: c.lat ?? existing.lat,
        lng: c.lng ?? existing.lng,
      });
    } else {
      map.set(id, {
        ...c,
        flag: c.flag || '🌍',
        description: `${c.name} • Capitale: ${c.capital || ''}`,
      });
    }
  });

  return Array.from(map.values());
})();

export const SATELLITES_CONFIG = [
  {
    type: 'KMZERO',
    code: 'KM0',
    name: 'Km 0',
    label: 'Km 0',
    sublabel: 'Produttori Locali',
    desc: 'Accesso diretto ai produttori agricoli del territorio e filiera corta a Km 0',
    color: '#10b981',
    foilColor: 0xd4af37, // Oro termico MLI
    orbitMultiplier: 1.22,
    speed: 0.0012,
    inclination: 0.65,
    angle: 0.8,
  },
  {
    type: 'WEATHER',
    code: 'METEO',
    name: 'Meteo Live',
    label: 'Meteo Live',
    sublabel: 'Clima in Tempo Reale',
    desc: 'Previsioni e rilevamento meteorologico in tempo reale Open-Meteo per ogni territorio',
    color: '#38bdf8',
    foilColor: 0xe2e8f0,
    orbitMultiplier: 1.30,
    speed: 0.0007,
    inclination: 0.12,
    angle: 2.1,
  },
  {
    type: 'MONDO',
    code: 'MARKETPLACE',
    name: 'Marketplace Globale',
    label: 'Marketplace',
    sublabel: 'Prodotti dal Mondo',
    desc: 'Supermarket globale con compravendite internazionali, valute reali e spedizioni tracciate',
    color: '#a855f7',
    foilColor: 0xd4af37,
    orbitMultiplier: 1.38,
    speed: 0.0009,
    inclination: -0.52,
    angle: 3.5,
  },
  {
    type: 'P2P',
    code: 'LAVORO',
    name: 'Lavoro P2P',
    label: 'Lavoro P2P',
    sublabel: 'Bacheca & Servizi',
    desc: 'Rete autonoma di annunci, compravendite, offerte di lavoro e scambi tra privati',
    color: '#00ff66',
    foilColor: 0xe2e8f0,
    orbitMultiplier: 1.46,
    speed: 0.0011,
    inclination: 0.40,
    angle: 4.8,
  },
  {
    type: 'RADAR',
    code: 'RADAR',
    name: 'Radar Territoriale',
    label: 'Radar',
    sublabel: 'Scansione di Prossimità',
    desc: 'Scansione geografica locale e raggio di vicinanza P2P (Near You / Community)',
    color: '#f59e0b',
    foilColor: 0xd4af37,
    orbitMultiplier: 1.54,
    speed: 0.0008,
    inclination: -0.25,
    angle: 1.4,
  },
  {
    type: 'COMUNITA',
    code: 'COMUNITÀ',
    name: 'Comunità & Soccorso',
    label: 'Comunità',
    sublabel: 'Mutuo Aiuto',
    desc: 'Rete solidale di emergenza civica, soccorso mutuo e carpooling solidale',
    color: '#ef4444',
    foilColor: 0xe2e8f0,
    orbitMultiplier: 1.62,
    speed: 0.0010,
    inclination: 0.55,
    angle: 5.7,
  },
  {
    type: 'BARATTO',
    code: 'BARATTO',
    name: 'Baratto Puro & WANT',
    label: 'Baratto',
    sublabel: 'Scambio Senza Denaro',
    desc: 'Filtro esclusivo scambio merci reciproco e matching desideri WANT',
    color: '#ec4899',
    foilColor: 0xd4af37,
    orbitMultiplier: 1.70,
    speed: 0.0013,
    inclination: -0.45,
    angle: 0.2,
  },
  {
    type: 'STRADARIO',
    code: 'STRADARIO',
    name: 'Stradario & 360°',
    label: 'Stradario',
    sublabel: 'Vista Panoramica Reale',
    desc: 'Passeggiata stradale a 360 gradi, incroci e viabilità territoriale reale',
    color: '#06b6d4',
    foilColor: 0xe2e8f0,
    orbitMultiplier: 1.78,
    speed: 0.0006,
    inclination: 0.35,
    angle: 2.9,
  },
];

export default function Globo3D({
  listings = [],
  allListings = [],
  onSelectListing,
  onCountrySelect,
  onZoneIdentified,
  onZoneZoomArrived,
  selectedCountryId,
  resetWorldTrigger = 0,
  focusItalyTrigger = 0,
  onZoomModeChange,
  onEnterUrban3D,
  isGeoMode = false,
  isFullscreen = false,
  onToggleFullscreen = null,
  onOpenSatellite = null,
  sponsoredBusinesses = SPONSORED_BUSINESSES,
  onSelectSponsor = null,
  activeChannel = null,
  activeChatUsers = ACTIVE_CHAT_USERS,
  onSelectChatUser = null,
}) {
  const containerRef = useRef(null);
  const onSelectSponsorRef = useRef(onSelectSponsor);
  onSelectSponsorRef.current = onSelectSponsor;
  const onSelectChatUserRef = useRef(onSelectChatUser);
  onSelectChatUserRef.current = onSelectChatUser;
  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;
  const sponsoredBusinessesRef = useRef(sponsoredBusinesses);
  sponsoredBusinessesRef.current = sponsoredBusinesses;
  const activeChatUsersRef = useRef(activeChatUsers);
  activeChatUsersRef.current = activeChatUsers;
  // Di default la Terra ruota dolcemente e naturalmente sul suo asse inclinato astronomico (23.44°) come nella realtà
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  isRotatingRef.current = isRotating;

  // Modalità filtro territori nella barra: 'ITALIA' o 'MONDO'
  const [territoryTab, setTerritoryTab] = useState('ITALIA');
  const flyToSatelliteRef = useRef(null);

  // Zoom status state: true = Macro (national markers visible), false = Urban/close (national markers hidden)
  const [isMacroZoom, setIsMacroZoom] = useState(true);
  const isMacroRef = useRef(true);

  // Active identified zone state for floating UI
  const [activeZone, setActiveZone] = useState(null);
  const [isZoomingIn, setIsZoomingIn] = useState(false);

  // Callback refs to always access latest callbacks inside Three.js loop without re-running useEffect
  const listingsRef = useRef(listings);
  listingsRef.current = listings.length > 0 ? listings : allListings;
  const onSelectListingRef = useRef(onSelectListing);
  onSelectListingRef.current = onSelectListing;
  const onCountrySelectRef = useRef(onCountrySelect);
  onCountrySelectRef.current = onCountrySelect;
  const onZoneIdentifiedRef = useRef(onZoneIdentified);
  onZoneIdentifiedRef.current = onZoneIdentified;
  const onZoneZoomArrivedRef = useRef(onZoneZoomArrived);
  onZoneZoomArrivedRef.current = onZoneZoomArrived;
  const onZoomModeChangeRef = useRef(onZoomModeChange);
  onZoomModeChangeRef.current = onZoomModeChange;
  const onEnterUrban3DRef = useRef(onEnterUrban3D);
  onEnterUrban3DRef.current = onEnterUrban3D;
  const onOpenSatelliteRef = useRef(onOpenSatellite);
  onOpenSatelliteRef.current = onOpenSatellite;

  // Ref to hold the fly-to reset function to be called from triggers or buttons
  const flyToResetRef = useRef(null);
  const flyToCountryRef = useRef(null);
  const positionReticleRef = useRef(null);
  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const togglePoliticalRevealRef = useRef(null);
  const toggleWeatherRef = useRef(null);
  const [isPoliticalRevealed, setIsPoliticalRevealed] = useState(false);
  const [isWeatherActive, setIsWeatherActive] = useState(true);

  // Helper per creare badge compatto per la bandiera e il nome nazione (con indicatore annunci presenti)
  const createCountrySprite = (country, isSelected, listingsCount = 0) => {
    const canvas = document.createElement('canvas');
    canvas.width = 210;
    canvas.height = 56;
    const ctx = canvas.getContext('2d');

    const isItaly = country.id === 'it';

    // Sfondo del badge con angoli arrotondati (Nero Puro #000000, Bordo Neon #00ff66)
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = isSelected ? '#00ff66' : isItaly ? '#00ff66' : '#ffffff';
    ctx.lineWidth = 2.5;

    const x = 3, y = 3, w = 204, h = 50, r = 10;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Emoji bandiera
    ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(country.flag || '🌍', 10, 28);

    // Nome paese (Bianco puro su Nero)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    const maxLen = listingsCount > 0 ? 8 : 11;
    const displayName = country.name.length > maxLen ? country.name.slice(0, maxLen - 1) + '…' : country.name;
    ctx.fillText(displayName, 46, 28);

    // Badge con conteggio annunci presenti nel territorio (Nero su Verde Neon)
    if (listingsCount > 0) {
      const bx = 180, by = 28, br = 13;
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(listingsCount), bx, by);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const sprite = new THREE.Sprite(spriteMat);
    // Scala compatta ed elegante (non copre interi continenti)
    sprite.scale.set(4.1, 1.15, 1);
    sprite.userData = { ...country, isNationalMarker: true, listingsCount, baseOpacity: 0.95 };
    return { sprite, texture, material: spriteMat };
  };

  // Helper per creare badge 3D dell'annuncio (Listing)
  const createListingSprite = (listing) => {
    const canvas = document.createElement('canvas');
    canvas.width = 210;
    canvas.height = 54;
    const ctx = canvas.getContext('2d');

    const isCarpool = listing.subcategory === 'trasferte_passaggi_carpool' || 
      (listing.tags && listing.tags.some(t => /trasfert|carpool|passagg/i.test(t))) ||
      /trasfert|carpool|passagg/i.test(listing.title || '');
    const isSell = (listing.intent === 'VENDO' || listing.action_type === 'vendo') && !isCarpool;
    const isCerco = (listing.intent === 'ACQUISTO_CERCO' || listing.intent === 'CERCO' || listing.action_type === 'acquisto_cerco') && !isCarpool;
    const isSwap = (listing.intent === 'BARATTO_SCAMBIO' || listing.action_type === 'baratto' || listing.action_type === 'baratto_scambio') && !isCarpool;
    const isBook = listing.category === 'libri_scuola_cultura' && !isCarpool;
    const isService = (listing.intent === 'OFFRO_SERVIZIO' || listing.category === 'servizi_lavoro_buoni') && !isCarpool;

    // Tema rigoroso Bianco/Nero e Verde Neon: Sfondo nero puro, bordo neon o bianco
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2.0;

    const x = 3, y = 3, w = 204, h = 48, r = 8;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Icona del tipo annuncio distinto
    const icon = isCarpool ? '🚗' : isSell ? '📦' : isCerco ? '🔍' : isSwap ? '🔄' : isBook ? '📚' : isService ? '🛠️' : '✨';
    ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 10, 27);

    // Titolo e città annuncio
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    const city = listing.author?.city || listing.city || '';
    const rawTitle = listing.title || '';
    const titleText = rawTitle.length > 11 ? rawTitle.slice(0, 10) + '…' : rawTitle;
    const label = city ? `${city} • ${titleText}` : titleText;
    ctx.fillText(label, 38, 27);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.4, 0.92, 1);
    sprite.userData = { isListingMarker: true, listing, baseOpacity: 0.95 };
    return { sprite, texture, material: spriteMat };
  };

  // Helper per creare badge 3D dell'attività commerciale / sponsor sul globo
  const createMerchantSprite = (biz, pinVisual) => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 56;
    const ctx = canvas.getContext('2d');

    const isDouble = pinVisual.type === 'DOUBLE_RING';
    const isPi = pinVisual.type === 'PI_ACCEPTED';

    ctx.fillStyle = isPi ? '#1e1b4b' : '#05070f';
    ctx.strokeStyle = pinVisual.primaryColor;
    ctx.lineWidth = isDouble ? 3.0 : 2.5;

    const x = 3, y = 3, w = 234, h = 50, r = 10;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isDouble) {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    }

    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(pinVisual.icon, 10, 27);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    const rawName = biz.name || 'Attività';
    const nameText = rawName.length > 13 ? rawName.slice(0, 12) + '…' : rawName;
    ctx.fillText(nameText, 44, 20);

    ctx.fillStyle = pinVisual.secondaryColor;
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    const sub = isDouble ? 'Doppio Anello: Pi + Volantino' : isPi ? 'Accetta Pagamenti Pi Coin' : 'Volantino & Pubblicità';
    ctx.fillText(sub, 44, 38);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0.98,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.4, 1.15, 1);
    sprite.userData = { isMerchantPin: true, biz, pinVisual, name: biz.name, lat: biz.lat, lng: biz.lng };
    return { sprite, texture, material: spriteMat };
  };

  // Helper per creare badge 3D dell'utente attivo nella Chat (👨 Uomo o 👩 Donna)
  const createChatUserSprite = (user) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = user.gender === 'woman' ? '#ec4899' : '#38bdf8';
    ctx.lineWidth = 2.0;

    const x = 3, y = 3, w = 194, h = 44, r = 10;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.avatarSymbol || (user.gender === 'woman' ? '👩' : '👨'), 10, 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(user.displayName, 42, 18);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillText(`• ${user.city}`, 42, 34);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.8, 1.05, 1);
    sprite.userData = { isChatUserPin: true, user, name: user.displayName, lat: user.lat, lng: user.lng };
    return { sprite, texture, material: spriteMat };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. SCENA SPAZIALE DARK MODE (#000000 - Nero Assoluto e Alto Contrasto)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 2. TELECAMERA ORBITALE (Centratura elevata: il globo è sollevato verticalmente per liberare la parte inferiore)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    const isInitialPortrait = width < height;
    const initialMobileRatio = isInitialPortrait ? Math.max(1.15, (height / width) * 0.6) : 1.0;
    // Puntamento leggermente abbassato sul target (0, -8, 0) o sollevamento camera per mostrare il globo alto e chiaro
    const defaultCameraPos = new THREE.Vector3(20, 36, 155 * initialMobileRatio);
    const defaultCameraTarget = new THREE.Vector3(0, -6, 0);
    camera.position.copy(defaultCameraPos);

    // 3. RENDERER WEBGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    // 4. CONTROLLI ORBITALI TOUCH E MOUSE STABILI E FLUIDI (NON BALLERINI)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultCameraTarget);
    camera.lookAt(defaultCameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // Frena dolcemente, previene scivolamenti o oscillazioni eccessive
    controls.rotateSpeed = 0.35; // Risposta controllata, fluida e precisa senza scatti repentini
    controls.minDistance = 61; // Permette zoom super ravvicinato sul territorio senza bloccarsi
    controls.maxDistance = 260; // Vista panoramica macro
    controls.zoomSpeed = 1.25; // Zoom touch/pinch e rotella reattivo ed immediato
    controls.enablePan = false;
    controls.update();

    let isUserInteracting = false;
    let interactionTimeout = null;

    controls.addEventListener('start', () => {
      isUserInteracting = true;
      if (interactionTimeout) clearTimeout(interactionTimeout);
    });

    controls.addEventListener('end', () => {
      // Breve pausa di 3.5 secondi prima di riprendere la dolce rotazione naturale
      if (interactionTimeout) clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        isUserInteracting = false;
      }, 3500);
    });

    // 5. ILLUMINAZIONE CALIBRATA E RIPOSANTE (Zero abbagliamento agli occhi, contrasto naturale)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.25); // Luce solare bilanciata
    sunLight.position.set(130, 80, 130);
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x7dd3fc, 0.4); // Luce d'atmosfera morbida
    cyanRimLight.position.set(-130, -30, -100);
    scene.add(cyanRimLight);

    const spaceAmbient = new THREE.AmbientLight(0xffffff, 0.75); // Luce ambiente uniforme e riposante
    scene.add(spaceAmbient);

    // 6. CAMPO STELLARE CON PARTICELLE BLU E VERDI
    const starsCount = 950;
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const radius = 550 + Math.random() * 350;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = radius * Math.cos(phi);

      const rand = Math.random();
      if (rand > 0.6) {
        starColors[i * 3] = 0.2; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1.0;
      } else if (rand > 0.3) {
        starColors[i * 3] = 0.1; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.6;
      } else {
        starColors[i * 3] = 0.8; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.95;
      }
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starsMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // 7. GLOBO 3D INTERATTIVO CON INCLINAZIONE REALE ASSE TERRESTRE (23.44° astronomici)
    const globeGroup = new THREE.Group();
    // Obliquità dell'eclittica: inclinazione esatta di 23.44° rispetto alla perpendicolare
    const EARTH_AXIAL_TILT = (23.44 * Math.PI) / 180;
    globeGroup.rotation.z = EARTH_AXIAL_TILT;
    scene.add(globeGroup);

    const raggioGlobo = 60;
    const textureLoader = new THREE.TextureLoader();

    // Sfera base con texture terrestre ad alta definizione
    const globoGeo = new THREE.SphereGeometry(raggioGlobo, 64, 64);
    const earthTexture = textureLoader.load('/textures/earth_atmos_2048.jpg');
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    const earthNight = textureLoader.load('/textures/earth_night.jpg');
    earthNight.colorSpace = THREE.SRGBColorSpace;
    const earthNormal = textureLoader.load('/textures/earth_normal_2048.jpg');
    const earthSpecular = textureLoader.load('/textures/earth_specular_2048.jpg');

    const sunNormalizedDir = sunLight.position.clone().normalize();

    // Shader PBR fotorealistico Terra Giorno/Notte con coordinate mondiali, bump map normale e illuminazione solare astronomica
    const initialGeo = Boolean(isGeoMode);
    const earthShaderDef = {
      uniforms: {
        uDayTexture: { value: earthTexture },
        uNightTexture: { value: earthNight },
        uNormalMap: { value: earthNormal },
        uSpecularMap: { value: earthSpecular },
        uSunDirection: { value: sunNormalizedDir },
        uCameraWorldPos: { value: camera.position.clone() },
        uOpacity: { value: initialGeo ? 0.0 : 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D uDayTexture;
        uniform sampler2D uNightTexture;
        uniform sampler2D uNormalMap;
        uniform sampler2D uSpecularMap;
        uniform vec3 uSunDirection;
        uniform vec3 uCameraWorldPos;
        uniform float uOpacity;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 worldNormal = normalize(vWorldNormal);
          vec3 viewDir = normalize(uCameraWorldPos - vWorldPosition);

          // Calcolo perturbazione normale orografica sicura (anti-NaN)
          vec3 bump = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
          vec3 perturbedNormal = normalize(worldNormal + bump * 0.20);
          if (length(perturbedNormal) < 0.05) {
            perturbedNormal = worldNormal;
          }

          // Orientamento solare
          float sunDot = dot(perturbedNormal, uSunDirection);

          // Campionamento texture giorno e notte con fallback base anti-schermo nero
          vec4 daySample = texture2D(uDayTexture, vUv);
          vec3 dayColor = daySample.rgb;
          // Se la texture sta ancora caricando, applica base colore oceanico/continentale immediata
          if (length(dayColor) < 0.04) {
            dayColor = vec3(0.06, 0.22, 0.42);
          }

          vec4 nightSample = texture2D(uNightTexture, vUv);
          // Luci cittadine dorate NASA Black Marble
          vec3 cityLights = nightSample.rgb * vec3(1.6, 1.35, 0.90) * 3.2;

          // Riflesso speculare marino naturale e riposante (luccichio oceanico elegante, mai disco bianco bruciato)
          float specMask = texture2D(uSpecularMap, vUv).r;
          vec3 halfDir = normalize(uSunDirection + viewDir);
          float specAngle = max(dot(perturbedNormal, halfDir), 0.0);
          float spec = pow(specAngle, 72.0) * specMask * 0.40;
          vec3 specularColor = vec3(0.82, 0.92, 1.0) * spec * smoothstep(0.05, 0.35, sunDot);

          // Transizione fluida giorno/notte
          float dayFactor = smoothstep(-0.20, 0.22, sunDot);

          // Bagliore dorato atmosferico lungo il terminatore (Alba e Tramonto)
          float twilight = clamp(1.0 - abs(sunDot) / 0.28, 0.0, 1.0);
          vec3 sunsetGlow = vec3(1.0, 0.52, 0.18) * pow(twilight, 2.5) * 0.60;

          // Fondo oceanico notturno visibile (chiaro contrasto contro lo spazio profondo, mai buco nero invisibile)
          vec3 deepNight = dayColor * vec3(0.24, 0.30, 0.45) + vec3(0.02, 0.04, 0.08);

          // Superficie diurna illuminata dal sole con ambient
          vec3 sunlitDay = dayColor * (0.85 + 0.35 * max(sunDot, 0.0));

          vec3 finalColor = mix(deepNight + cityLights, sunlitDay + specularColor + sunsetGlow, dayFactor);

          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,
      transparent: true,
      depthWrite: true,
    };
    const globoMat = new THREE.ShaderMaterial(earthShaderDef);
    globoMat.opacity = initialGeo ? 0.0 : 1.0;
    const globoMesh = new THREE.Mesh(globoGeo, globoMat);
    globeGroup.add(globoMesh);

    // 8. ALONE ATMOSFERICO FRESNEL (Bagliore zaffiro a dispersione Rayleigh a 61.25 di raggio)
    const atmosGeo = new THREE.SphereGeometry(raggioGlobo + 1.25, 64, 64);
    const atmosShaderDef = {
      uniforms: {
        uSunDirection: { value: sunNormalizedDir },
        uCameraWorldPos: { value: camera.position.clone() },
        uOpacity: { value: initialGeo ? 0.0 : 1.0 },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform vec3 uSunDirection;
        uniform vec3 uCameraWorldPos;
        uniform float uOpacity;

        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(uCameraWorldPos - vWorldPosition);
          vec3 worldNormal = normalize(vWorldNormal);

          // Effetto Fresnel periferico per l'atmosfera terrestre
          float fresnel = pow(1.0 - max(dot(viewDir, worldNormal), 0.0), 2.8);

          // Modulazione illuminazione solare dell'atmosfera
          float sunDot = dot(worldNormal, uSunDirection);
          float sunFactor = smoothstep(-0.30, 0.35, sunDot);

          // Bagliore zaffiro brillante con riflesso azzurro spaziale
          vec3 atmosColor = mix(vec3(0.08, 0.42, 0.98), vec3(0.42, 0.82, 1.0), fresnel);
          // Accento dorato crepuscolare
          float twilight = clamp(1.0 - abs(sunDot) / 0.28, 0.0, 1.0);
          vec3 rimGlow = mix(atmosColor, vec3(1.0, 0.58, 0.24), pow(twilight, 2.8) * 0.42);

          // Alone visibile a 360° con intensificazione solare (0.35 baseline halo garantisce silhouette perfetta)
          float alpha = fresnel * 0.95 * (0.35 + 0.65 * sunFactor) * uOpacity;

          gl_FragColor = vec4(rimGlow, alpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    };
    const atmosMat = new THREE.ShaderMaterial(atmosShaderDef);
    atmosMat.opacity = initialGeo ? 0.0 : 1.0;
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    if (initialGeo) {
      atmosMesh.visible = false;
    }
    globeGroup.add(atmosMesh);

    // 9. RADAR METEOROLOGICO REALE RAINVIEWER (Doppler Precipitazioni + Infrarosso Satellitare)
    const radarCanvas = document.createElement('canvas');
    radarCanvas.width = 1024;
    radarCanvas.height = 512;
    const radarTexture = new THREE.CanvasTexture(radarCanvas);
    radarTexture.colorSpace = THREE.SRGBColorSpace;
    radarTexture.minFilter = THREE.LinearFilter;
    radarTexture.magFilter = THREE.LinearFilter;

    const cloudsGeo = new THREE.SphereGeometry(raggioGlobo + 0.58, 64, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: radarTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    if (initialGeo) {
      cloudsMesh.visible = false;
    }
    globeGroup.add(cloudsMesh);

    const refreshRealRadarOverlay = async () => {
      try {
        const result = await composeRainViewerGlobeCanvas(radarCanvas);
        if (isAlive && result.tilesLoaded > 0) {
          radarTexture.needsUpdate = true;
          cloudsMat.needsUpdate = true;
        }
      } catch {
        // Fallback silenzioso in assenza rete
      }
    };
    refreshRealRadarOverlay();
    const radarRefreshInterval = setInterval(refreshRealRadarOverlay, 5 * 60 * 1000);

    // Weather state reference inside Three.js
    let weatherEnabled = true;
    toggleWeatherRef.current = (forceValue) => {
      const next = typeof forceValue === 'boolean' ? forceValue : !weatherEnabled;
      weatherEnabled = next;
      setIsWeatherActive(next);
      if (!isPoliticalActiveRef.current) {
        cloudsMesh.visible = next;
      }
      return next;
    };

    // 7B. DISSOLVENZA STANDARD ↔ GEOPOLITICO (2 MESH SEPARATI, RAGGIO 60 vs 60.02 ANTI Z-FIGHTING)
    const politicalTexture = createPoliticalGlobeTexture();

    // Mesh Geopolitico dedicato con raggio 60.02 per evitare z-fighting
    const globoPoliticoGeo = new THREE.SphereGeometry(raggioGlobo + 0.02, 64, 64);
    const globoPoliticoMat = new THREE.MeshStandardMaterial({
      map: politicalTexture,
      roughness: 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: initialGeo ? 1.0 : 0.0,
      depthWrite: true,
    });
    const globoPoliticoMesh = new THREE.Mesh(globoPoliticoGeo, globoPoliticoMat);
    globoPoliticoMesh.visible = initialGeo;
    globeGroup.add(globoPoliticoMesh);

    if (initialGeo) {
      cloudsMesh.visible = false;
      atmosMesh.visible = false;
      sunLight.intensity = 0.95;
      spaceAmbient.intensity = 0.85;
      cyanRimLight.intensity = 0.15;
      setIsPoliticalRevealed(true);
    }
    const isPoliticalActiveRef = { current: initialGeo };

    // Crossfade fluido a 600ms ease-in-out cubic tra i due mesh
    let crossfadeAnimationId = null;
    togglePoliticalRevealRef.current = (forceValue) => {
      const nextActive = typeof forceValue === 'boolean' 
        ? forceValue 
        : !isPoliticalActiveRef.current;
      isPoliticalActiveRef.current = nextActive;
      setIsPoliticalRevealed(nextActive);

      if (crossfadeAnimationId) {
        cancelAnimationFrame(crossfadeAnimationId);
      }

      globoPoliticoMesh.visible = true;
      globoMesh.visible = true;
      atmosMesh.visible = true;

      const startPhotoOpacity = globoMat.opacity;
      const startPolOpacity = globoPoliticoMat.opacity;
      const targetPhotoOpacity = nextActive ? 0.0 : 1.0;
      const targetPolOpacity = nextActive ? 1.0 : 0.0;
      const startTime = performance.now();
      const duration = 600; // 600ms da specifica

      const stepCrossfade = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        // Easing cubico ease-in-out: 4*t^3 oppure 1 - (-2t+2)^3 / 2
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentPhotoOpacity = startPhotoOpacity + (targetPhotoOpacity - startPhotoOpacity) * ease;
        globoMat.opacity = currentPhotoOpacity;
        if (globoMat.uniforms && globoMat.uniforms.uOpacity) {
          globoMat.uniforms.uOpacity.value = currentPhotoOpacity;
        }
        if (atmosMat.uniforms && atmosMat.uniforms.uOpacity) {
          atmosMat.uniforms.uOpacity.value = currentPhotoOpacity;
        }
        atmosMat.opacity = currentPhotoOpacity;

        globoPoliticoMat.opacity = startPolOpacity + (targetPolOpacity - startPolOpacity) * ease;
        globoMat.needsUpdate = true;
        atmosMat.needsUpdate = true;
        globoPoliticoMat.needsUpdate = true;

        if (progress < 1.0) {
          crossfadeAnimationId = requestAnimationFrame(stepCrossfade);
        } else {
          crossfadeAnimationId = null;
          globoPoliticoMesh.visible = nextActive;
          globoMesh.visible = !nextActive;
          atmosMesh.visible = !nextActive;
          if (nextActive) {
            cloudsMesh.visible = false;
            atmosMesh.visible = false;
            sunLight.intensity = 0.95;
            spaceAmbient.intensity = 0.85;
            cyanRimLight.intensity = 0.15;
          } else {
            cloudsMesh.visible = weatherEnabled;
            atmosMesh.visible = true;
            sunLight.intensity = 1.25;
            spaceAmbient.intensity = 0.75;
          }
        }
      };

      crossfadeAnimationId = requestAnimationFrame(stepCrossfade);
      return nextActive;
    };

    // 10A. RIFERIMENTI E CONTROLLO TERRESTRE REALE SFERICO
    // Nessun modello o animazione fittizia: solo Terra sferica geospaziale reale.

    // Conversione Coordinate Geografiche (Lat, Lng) in Coordinate Cartesiane 3D
    // Matematica esatta per texture equirettangolare su Three.js SphereGeometry:
    function convertiCoordinate(lat, lng, raggio) {
      const theta = (90 - lat) * (Math.PI / 180);
      const phi = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -raggio * Math.cos(phi) * Math.sin(theta),
        raggio * Math.cos(theta),
        raggio * Math.sin(phi) * Math.sin(theta)
      );
    }

    // 11. GRUPPO PUNTI GEOGRAFICI & ANNUNCI (PRECISIONE MILLIMETRICA SUL GLOBO)
    // Punti fissati rigidamente alle coordinate reali: Spagna in Spagna, Cina in Cina, Italia in Italia.
    const nationalMarkersGroup = new THREE.Group();
    globeGroup.add(nationalMarkersGroup);

    const clickableNodes = [];
    const pulsingRings = [];
    const piBlinkingMaterials = [];
    const createdResources = [];
    // 🛰️ COSTRUZIONE DELLA FLOTTA SPAZIALE INGEGNERISTICA (8 SATELLITI AUTONOMI 3D)
    // Ciascun veicolo spaziale possiede geometrie PBR dedicate (MLI oro/argento, celle solari blu, pannelli radar SAR, specchi Cassegrain, antenne a tromba)
    const sharedAerospaceMaterials = createSharedAerospaceMaterials();
    Object.values(sharedAerospaceMaterials).forEach((mat) => {
      createdResources.push({ mat });
    });

    const activeSatellites = [];
    const satellitesData = INITIAL_SATELLITES_CATALOG.map((sat) => ({
      ...sat,
      orbitRadius: raggioGlobo * sat.orbitMultiplier,
    }));

    satellitesData.forEach((sat) => {
      // 1. Linea orbitale 3D visibile nello spazio intorno alla Terra
      const orbitPoints = [];
      const orbitSegments = 128;
      for (let i = 0; i <= orbitSegments; i++) {
        const theta = (i / orbitSegments) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          sat.orbitRadius * Math.cos(theta),
          sat.orbitRadius * Math.sin(theta) * Math.sin(sat.inclination),
          sat.orbitRadius * Math.sin(theta) * Math.cos(sat.inclination)
        ));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(sat.color),
        transparent: true,
        opacity: 0.12,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      globeGroup.add(orbitLine);
      createdResources.push({ geo: orbitGeo, mat: orbitMat });

      // 2. Modello ingegneristico 3D del veicolo spaziale
      const { craftGroup, clickables, strobeBeacons, radarPulse } = buildEngineeredSpacecraft(
        sat,
        sharedAerospaceMaterials,
        textureLoader
      );
      globeGroup.add(craftGroup);

      // Sincronizzazione immediata visibilità iniziale dallo stato dell engine (Zero sprechi GPU)
      const isActiveInitial = satelliteEngine.isSatelliteActive(sat.id);
      craftGroup.visible = isActiveInitial;
      orbitLine.visible = isActiveInitial;

      clickables.forEach((mesh) => {
        clickableNodes.push(mesh);
      });

      activeSatellites.push({
        ...sat,
        craftGroup,
        orbitLine,
        strobeBeacons: strobeBeacons || [],
        radarPulse,
        angle: sat.startAngle ?? sat.angle ?? 0,
        orbitRadius: sat.orbitRadius,
        inclination: sat.inclination,
        speed: sat.speed,
      });
    });

    // Sottoscrizione reattiva al satelliteModularEngine: toggle ON/OFF istantaneo senza MAI distruggere o ricreare le mesh Three.js
    const unsubscribeEngine = satelliteEngine.subscribe((states) => {
      activeSatellites.forEach((sat) => {
        const active = states[sat.id] !== false;
        if (sat.craftGroup) {
          sat.craftGroup.visible = active;
        }
        if (sat.orbitLine) {
          sat.orbitLine.visible = active;
        }
      });
    });

    // A) BANDIERE E INDICATORI DEI PAESI (Sempre visibili sul globo per capire dove si trovano gli annunci)
    const sourceListings = (allListings && allListings.length > 0) ? allListings : (listings || []);
    const countryListingsMap = new Map();
    sourceListings.forEach((item) => {
      const c = getCountryForListing(item, COUNTRIES);
      if (c && c.id) {
        if (!countryListingsMap.has(c.id)) {
          countryListingsMap.set(c.id, []);
        }
        countryListingsMap.get(c.id).push(item);
      }
    });

    COUNTRIES.forEach((country) => {
      const countryItems = countryListingsMap.get(country.id) || [];
      const listingsCount = countryItems.length;

      // Mostriamo la bandiera se ci sono annunci nel paese, oppure per i paesi pioniere principali
      const isKeyHub = ['it', 'fr', 'es', 'de', 'gb', 'ch', 'us', 'jp', 'eg', 'za', 'ng', 'ke', 'ma', 'gh', 'ci', 'sn', 'dz', 'tn'].includes(country.id);
      if (listingsCount === 0 && !isKeyHub) return;

      const pos = convertiCoordinate(country.lat, country.lng, raggioGlobo);
      const normal = pos.clone().normalize();

      const isSelected = selectedCountryId === country.id;
      // Bianco e Verde Neon ad alto contrasto (#00ff66)
      const pinColor = isSelected ? 0x00ff66 : (country.id === 'it' ? 0x00ff66 : 0xffffff);

      // 1. Perno verticale 3D ancorato alla superficie terrestre
      const stemHeight = 2.8;
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: pinColor, opacity: 0.85, transparent: true });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      const stemPos = pos.clone().add(normal.clone().multiplyScalar(stemHeight * 0.5));
      stemMesh.position.copy(stemPos);
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stemMesh.userData = { ...country, isNationalMarker: true, listingsCount };
      nationalMarkersGroup.add(stemMesh);
      clickableNodes.push(stemMesh);
      createdResources.push({ geo: stemGeo, mat: stemMat });

      // 2. Nucleo luminoso sferico in cima al perno
      const pinHeadGeo = new THREE.SphereGeometry(0.75, 14, 14);
      const pinHeadMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinHeadMesh = new THREE.Mesh(pinHeadGeo, pinHeadMat);
      pinHeadMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight)));
      pinHeadMesh.userData = { ...country, isNationalMarker: true, listingsCount };
      nationalMarkersGroup.add(pinHeadMesh);
      clickableNodes.push(pinHeadMesh);
      createdResources.push({ geo: pinHeadGeo, mat: pinHeadMat });

      // 3. Mini-anello radar alla base
      const baseRingGeo = new THREE.RingGeometry(0.4, 1.4, 16);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.2)));
      baseRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      nationalMarkersGroup.add(baseRing);
      pulsingRings.push({ ring: baseRing, baseScale: 1.0 });
      createdResources.push({ geo: baseRingGeo, mat: baseRingMat });

      // Mostra l'etichetta solo se il paese ha annunci attivi o è attualmente selezionato, per evitare sovrapposizioni illeggibili
      if (isSelected || listingsCount > 0) {
        const { sprite, texture, material } = createCountrySprite(country, isSelected, listingsCount);
        sprite.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight + 1.8)));
        nationalMarkersGroup.add(sprite);
        clickableNodes.push(sprite);
        createdResources.push({ texture, mat: material });
      }
    });

    // B) MARKER PUNTUALI PER GLI ANNUNCI FILTRATI
    const activeListingsList = (listings && Array.isArray(listings)) ? listings : [];

    activeListingsList.forEach((listing) => {
      if (typeof listing.lat !== 'number' || typeof listing.lng !== 'number') return;

      const pos = convertiCoordinate(listing.lat, listing.lng, raggioGlobo);
      const normal = pos.clone().normalize();

      const isCarpool = listing.subcategory === 'trasferte_passaggi_carpool' || 
        (listing.tags && listing.tags.some(t => /trasfert|carpool|passagg/i.test(t))) ||
        /trasfert|carpool|passagg/i.test(listing.title || '');
      const isSell = (listing.intent === 'VENDO' || listing.action_type === 'vendo') && !isCarpool;
      const isCerco = (listing.intent === 'ACQUISTO_CERCO' || listing.intent === 'CERCO' || listing.action_type === 'acquisto_cerco') && !isCarpool;
      const isSwap = (listing.intent === 'BARATTO_SCAMBIO' || listing.action_type === 'baratto' || listing.action_type === 'baratto_scambio') && !isCarpool;
      const isBook = listing.category === 'libri_scuola_cultura' && !isCarpool;
      const isService = (listing.intent === 'OFFRO_SERVIZIO' || listing.category === 'servizi_lavoro_buoni') && !isCarpool;

      // Palette rigorosa Bianco e Verde Neon (#00ff66) per gli annunci
      const pinColor = (isSell || isCarpool || isService) ? 0x00ff66 : 0xffffff;

      // 1. Sottile perno verticale 3D ancorato alla superficie
      const stemHeight = 2.4;
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: pinColor, opacity: 0.85, transparent: true });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      // Posiziona il perno lungo la normale
      const stemPos = pos.clone().add(normal.clone().multiplyScalar(stemHeight * 0.5));
      stemMesh.position.copy(stemPos);
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stemMesh.userData = { isListingMarker: true, listing, name: listing.title, lat: listing.lat, lng: listing.lng };
      nationalMarkersGroup.add(stemMesh);
      clickableNodes.push(stemMesh);
      createdResources.push({ geo: stemGeo, mat: stemMat });

      // 2. Nucleo luminoso sferico in cima al perno
      const pinHeadGeo = new THREE.SphereGeometry(0.85, 14, 14);
      const pinHeadMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinHeadMesh = new THREE.Mesh(pinHeadGeo, pinHeadMat);
      pinHeadMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight)));
      pinHeadMesh.userData = { isListingMarker: true, listing, name: listing.title, lat: listing.lat, lng: listing.lng };
      nationalMarkersGroup.add(pinHeadMesh);
      clickableNodes.push(pinHeadMesh);
      createdResources.push({ geo: pinHeadGeo, mat: pinHeadMat });

      // 3. Mini-anello radar alla base dell'annuncio
      const baseRingGeo = new THREE.RingGeometry(0.3, 1.2, 16);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.2)));
      baseRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      nationalMarkersGroup.add(baseRing);
      pulsingRings.push({ ring: baseRing, baseScale: 1.0 });
      createdResources.push({ geo: baseRingGeo, mat: baseRingMat });

      // 4. Badge compatto descrittivo dell'annuncio (Billboard 3D)
      const { sprite, texture, material } = createListingSprite(listing);
      sprite.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight + 1.6)));
      nationalMarkersGroup.add(sprite);
      clickableNodes.push(sprite);
      createdResources.push({ texture, mat: material });
    });

    // C) SISTEMA PIN COMMERCIANTI & PUBBLICITÀ (STANDARD UFFICIALE A 3 CATEGORIE)
    // 1. VIOLA E ORO LAMPEGGIANTE: Attività che accettano e utilizzano Pi
    // 2. ORO PURO: Attività che pubblicizzano il proprio esercizio
    // 3. DOPPIO ANELLO: Attività che utilizzano Pi E pubblicizzano
    const currentBizList = sponsoredBusinessesRef.current || SPONSORED_BUSINESSES;
    currentBizList.forEach((biz) => {
      if (typeof biz.lat !== 'number' || typeof biz.lng !== 'number') return;
      const pinVisual = classifyMerchantPin(biz);

      const pos = convertiCoordinate(biz.lat, biz.lng, raggioGlobo);
      const normal = pos.clone().normalize();

      const isDouble = pinVisual.type === 'DOUBLE_RING';
      const isPiOnly = pinVisual.type === 'PI_ACCEPTED';
      const stemColor = pinVisual.threeColorHex;

      // 1. Perno 3D dorato o viola
      const stemHeight = isDouble ? 3.2 : 2.8;
      const stemGeo = new THREE.CylinderGeometry(0.14, 0.14, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({
        color: stemColor,
        transparent: true,
        opacity: 0.92,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      const stemPos = pos.clone().add(normal.clone().multiplyScalar(stemHeight * 0.5));
      stemMesh.position.copy(stemPos);
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stemMesh.userData = { isMerchantPin: true, biz, pinVisual, name: biz.name, lat: biz.lat, lng: biz.lng };
      nationalMarkersGroup.add(stemMesh);
      clickableNodes.push(stemMesh);
      createdResources.push({ geo: stemGeo, mat: stemMat });

      // 2. Testa sferica del PIN
      const pinHeadGeo = new THREE.SphereGeometry(isDouble ? 0.95 : 0.85, 16, 16);
      const pinHeadMat = new THREE.MeshBasicMaterial({ color: stemColor });
      const pinHeadMesh = new THREE.Mesh(pinHeadGeo, pinHeadMat);
      pinHeadMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight)));
      pinHeadMesh.userData = { isMerchantPin: true, biz, pinVisual, name: biz.name, lat: biz.lat, lng: biz.lng };
      nationalMarkersGroup.add(pinHeadMesh);
      clickableNodes.push(pinHeadMesh);
      createdResources.push({ geo: pinHeadGeo, mat: pinHeadMat });

      // 3. Sistema Anelli alla base
      if (isDouble) {
        // DOPPIO ANELLO CONCENTRICO: Oro esterno (24k) + Viola interno (Pi Network)
        const outerRingGeo = new THREE.RingGeometry(0.7, 1.8, 24);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.25)));
        outerRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        nationalMarkersGroup.add(outerRing);
        pulsingRings.push({ ring: outerRing, baseScale: 1.1 });
        createdResources.push({ geo: outerRingGeo, mat: outerRingMat });

        const innerRingGeo = new THREE.RingGeometry(0.25, 0.65, 20);
        const innerRingMat = new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.28)));
        innerRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        nationalMarkersGroup.add(innerRing);
        pulsingRings.push({ ring: innerRing, baseScale: 0.9 });
        createdResources.push({ geo: innerRingGeo, mat: innerRingMat });
      } else {
        // Anello singolo pulsante: Viola/Oro lampeggiante se accetta Pi; Oro puro fisso se pubblicità
        const baseRingGeo = new THREE.RingGeometry(0.4, 1.4, 20);
        const baseRingMat = new THREE.MeshBasicMaterial({
          color: pinVisual.threeRingHex,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        baseRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.22)));
        baseRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        nationalMarkersGroup.add(baseRing);
        pulsingRings.push({ ring: baseRing, baseScale: 1.0 });
        createdResources.push({ geo: baseRingGeo, mat: baseRingMat });
        if (isPiOnly) {
          piBlinkingMaterials.push({ headMat: pinHeadMat, ringMat: baseRingMat, stemMat });
        }
      }

      // 4. Cartello 3D descrittivo dell'attività (Billboard Sprite)
      const { sprite, texture, material } = createMerchantSprite(biz, pinVisual);
      sprite.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight + 1.8)));
      nationalMarkersGroup.add(sprite);
      clickableNodes.push(sprite);
      createdResources.push({ texture, mat: material });
    });

    // D) CANALE CHAT: UTENTI ATTIVI PIONEER CON SIMBOLI 👨 E 👩
    const chatUsersList = activeChatUsersRef.current || ACTIVE_CHAT_USERS;
    chatUsersList.forEach((user) => {
      if (typeof user.lat !== 'number' || typeof user.lng !== 'number') return;

      const pos = convertiCoordinate(user.lat, user.lng, raggioGlobo);
      const normal = pos.clone().normalize();
      const userColor = user.gender === 'woman' ? 0xec4899 : 0x38bdf8;

      // Perno snello per l'utente
      const stemHeight = 2.6;
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, stemHeight, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: userColor, transparent: true, opacity: 0.85 });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      const stemPos = pos.clone().add(normal.clone().multiplyScalar(stemHeight * 0.5));
      stemMesh.position.copy(stemPos);
      stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      stemMesh.userData = { isChatUserPin: true, user, name: user.displayName, lat: user.lat, lng: user.lng };
      nationalMarkersGroup.add(stemMesh);
      clickableNodes.push(stemMesh);
      createdResources.push({ geo: stemGeo, mat: stemMat });

      // Anello pulsante dell'utente attivo
      const userRingGeo = new THREE.RingGeometry(0.3, 1.2, 16);
      const userRingMat = new THREE.MeshBasicMaterial({
        color: userColor,
        transparent: true,
        opacity: 0.70,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const userRing = new THREE.Mesh(userRingGeo, userRingMat);
      userRing.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.2)));
      userRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      nationalMarkersGroup.add(userRing);
      pulsingRings.push({ ring: userRing, baseScale: 1.0 });
      createdResources.push({ geo: userRingGeo, mat: userRingMat });

      // Badge con simbolo 👨 Uomo o 👩 Donna
      const { sprite, texture, material } = createChatUserSprite(user);
      sprite.position.copy(pos.clone().add(normal.clone().multiplyScalar(stemHeight + 1.6)));
      nationalMarkersGroup.add(sprite);
      clickableNodes.push(sprite);
      createdResources.push({ texture, mat: material });
    });

    // 11B. RETICOLO VISIVO 3D DI INDIVIDUAZIONE ZONA (Target Reticle)
    const zoneReticleGroup = new THREE.Group();
    zoneReticleGroup.visible = false;
    globeGroup.add(zoneReticleGroup);

    const reticleInnerRingGeo = new THREE.RingGeometry(2.2, 2.9, 36);
    const reticleInnerRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const reticleInnerRing = new THREE.Mesh(reticleInnerRingGeo, reticleInnerRingMat);
    zoneReticleGroup.add(reticleInnerRing);

    const reticleOuterRingGeo = new THREE.RingGeometry(4.0, 4.6, 36);
    const reticleOuterRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const reticleOuterRing = new THREE.Mesh(reticleOuterRingGeo, reticleOuterRingMat);
    zoneReticleGroup.add(reticleOuterRing);

    // Punto faro centrale brillante
    const reticleCenterGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const reticleCenterMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const reticleCenter = new THREE.Mesh(reticleCenterGeo, reticleCenterMat);
    zoneReticleGroup.add(reticleCenter);

    createdResources.push(
      { geo: reticleInnerRingGeo, mat: reticleInnerRingMat },
      { geo: reticleOuterRingGeo, mat: reticleOuterRingMat },
      { geo: reticleCenterGeo, mat: reticleCenterMat }
    );

    const positionZoneReticle = (country) => {
      if (!country) {
        zoneReticleGroup.visible = false;
        return;
      }
      const pos = convertiCoordinate(country.lat, country.lng, raggioGlobo + 0.65);
      const normal = pos.clone().normalize();
      zoneReticleGroup.position.copy(pos);
      zoneReticleGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      zoneReticleGroup.visible = true;
    };
    positionReticleRef.current = positionZoneReticle;

    // 12. LOGICA FLY-TO E ANIMAZIONI TELECAMERA
    let flyAnimationId = null;
    let isFlying = false;

    function flyTo(targetPosition, targetLookAt, duration = 1000, onComplete = null) {
      isFlying = true;
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const startTime = performance.now();

      // Disattiva comandi utente durante il volo controllato
      controls.enabled = false;

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        // Easing cubico fluido: 1 - (1 - progress)^3
        const ease = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(startPos, targetPosition, ease);
        controls.target.lerpVectors(startTarget, targetLookAt, ease);
        controls.update();

        if (progress < 1.0) {
          flyAnimationId = requestAnimationFrame(step);
        } else {
          flyAnimationId = null;
          isFlying = false;
          controls.enabled = true;
          if (onComplete) onComplete();
        }
      }

      if (flyAnimationId) cancelAnimationFrame(flyAnimationId);
      flyAnimationId = requestAnimationFrame(step);
    }

    // Funzione Reset "Mondo": riporta la telecamera alla vista macro globale intera
    const flyToGlobalView = (showToast = true) => {
      zoneReticleGroup.visible = false;
      setActiveZone(null);
      setIsZoomingIn(false);

      flyTo(defaultCameraPos, defaultCameraTarget, 950, () => {
        // Garantisce che il gruppo marker torni visibile in macro view
        nationalMarkersGroup.visible = true;
        setIsMacroZoom(true);
        isMacroRef.current = true;
        if (onZoomModeChange) onZoomModeChange('MACRO');
        if (showToast) {
          toast.success("🌍 Vista Globale ripristinata", {
            description: "Telecamera centrata sulla panoramica macro del Mondo",
            duration: 2500,
          });
        }
      });
    };
    flyToResetRef.current = flyToGlobalView;

    // Funzione Fly-To su un paese o annuncio specifico con ingrandimento concreto
    const flyToCountry = (country, onArrivedCallback = null, triggerZoneArrival = true) => {
      if (!country) return;
      positionZoneReticle(country);
      setActiveZone(country);
      setIsZoomingIn(true);

      const countryPos = convertiCoordinate(country.lat, country.lng, raggioGlobo);
      // Trasforma le coordinate locali rispetto alla rotazione e inclinazione reale della sfera
      globeGroup.updateMatrixWorld(true);
      const worldPos = globeGroup.localToWorld(countryPos.clone());
      const direction = worldPos.clone().normalize();

      // INGRANDIMENTO CONCRETO: telecamera scende a quota ravvicinata (~74 vs raggio 60) per visualizzare grandi e chiari nazioni e territori
      const targetPos = direction.multiplyScalar(74);
      const targetLookAt = new THREE.Vector3(0, 0, 0);

      flyTo(targetPos, targetLookAt, 1050, () => {
        setIsZoomingIn(false);
        if (onArrivedCallback) {
          onArrivedCallback(country);
        }
        if (triggerZoneArrival && onZoneZoomArrivedRef.current) {
          onZoneZoomArrivedRef.current(country);
        }
      });
    };
    flyToCountryRef.current = flyToCountry;

    // Funzione Fly-To su un satellite specifico nello spazio con inquadratura ravvicinata
    const flyToSatellite = (satIdOrType) => {
      const sat = activeSatellites.find((s) => s.id === satIdOrType || s.type === satIdOrType || s.legacyType === satIdOrType);
      if (!sat || !sat.craftGroup) return;

      // Se il satellite era spento, accendilo per permettere all utente di vederlo
      if (!sat.craftGroup.visible) {
        satelliteEngine.setSatelliteActive(sat.id, true);
      }

      zoneReticleGroup.visible = false;
      setActiveZone(null);

      // Calcola posizione orbitale reale del satellite
      globeGroup.updateMatrixWorld(true);
      const satWorldPos = new THREE.Vector3();
      sat.craftGroup.getWorldPosition(satWorldPos);

      const dir = satWorldPos.clone().normalize();
      // Quota di inquadratura: distanza ideale per ammirare il veicolo spaziale ingegneristico
      const camPos = satWorldPos.clone().add(dir.clone().multiplyScalar(24)).add(new THREE.Vector3(0, 8, 12));

      flyTo(camPos, satWorldPos, 950, () => {
        toast.info(`🛰️ ${sat.name}`, {
          description: `${sat.codeName} • ${sat.h2wRole}`,
          duration: 3500,
        });
        if (onOpenSatelliteRef.current) {
          onOpenSatelliteRef.current(sat.id || sat.type);
        }
      });
    };
    flyToSatelliteRef.current = flyToSatellite;

    // Zoom manuale incrementale controllato (avvicina/allontana senza MAI resettare)
    const zoomInManual = () => {
      if (!camera || !controls) return;
      const dir = camera.position.clone().sub(controls.target).normalize();
      const currentDist = camera.position.distanceTo(controls.target);

      // Se siamo già vicini al globo, ingrandisci passando alla cartina con edifici 3D
      if (currentDist <= 76 && onEnterUrban3DRef.current) {
        const target = activeZone || { lat: 41.8902, lng: 12.4922, name: 'Roma', countryName: 'Italia', flag: '🇮🇹' };
        toast.info(`🏙️ Ingrandimento Edifici 3D: Apertura vista urbana su ${target.name}...`);
        onEnterUrban3DRef.current(target);
        return;
      }

      const newDist = Math.max(controls.minDistance + 1, currentDist - 28);
      camera.position.copy(controls.target.clone().add(dir.multiplyScalar(newDist)));
      controls.update();
    };
    zoomInRef.current = zoomInManual;

    const zoomOutManual = () => {
      if (!camera || !controls) return;
      const dir = camera.position.clone().sub(controls.target).normalize();
      const currentDist = camera.position.distanceTo(controls.target);
      const newDist = Math.min(controls.maxDistance - 5, currentDist + 28);
      camera.position.copy(controls.target.clone().add(dir.multiplyScalar(newDist)));
      controls.update();
    };
    zoomOutRef.current = zoomOutManual;

    // 13. GESTIONE GESTI, TAP E INDIVIDUAZIONE ZONA (ROBUSTA ED ANTI-SCATTO)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownX = 0;
    let pointerDownY = 0;
    let pointerDownTime = 0;
    let isDragging = false;
    let isMultiTouchActive = false;
    let multiTouchEndTime = 0;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const handlePointerDown = (clientX, clientY) => {
      pointerDownX = clientX;
      pointerDownY = clientY;
      pointerDownTime = performance.now();
      isDragging = false;
    };

    const handlePointerMove = (clientX, clientY) => {
      const moveDist = Math.hypot(clientX - pointerDownX, clientY - pointerDownY);
      if (moveDist > 14) {
        isDragging = true;
      }
    };

    const handlePointerUp = (clientX, clientY) => {
      // Se l'utente era in pinch-to-zoom o ha appena finito un gesto multi-touch,
      // blocca rigorosamente il tap per evitare qualsiasi ripristino involontario
      if (isMultiTouchActive || (performance.now() - multiTouchEndTime < 450)) {
        return;
      }

      const elapsed = performance.now() - pointerDownTime;
      const moveDist = Math.hypot(clientX - pointerDownX, clientY - pointerDownY);

      // FILTRO ANTI-TOCCHI ACCIDENTALI:
      // Tolleranza naturale per smartphone e dita: fino a 700ms e 14px di spostamento
      if (isDragging || elapsed > 700 || moveDist > 14) return;

      // Riconoscimento Double-Tap / Doppio tocco rapido per ingrandire
      const now = performance.now();
      const isDoubleTap = (now - lastTapTime < 360) && (Math.hypot(clientX - lastTapX, clientY - lastTapY) < 28);
      lastTapTime = now;
      lastTapX = clientX;
      lastTapY = clientY;

      if (isDoubleTap) {
        if (activeZone && onEnterUrban3DRef.current) {
          toast.info(`🏙️ Ingrandimento su ${activeZone.name}: Apertura mappa dettagliata...`);
          onEnterUrban3DRef.current(activeZone);
          return;
        } else {
          zoomInManual();
          return;
        }
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Controllo occlusione sferica: interseca il globo terrestre e i nodi marker
      const earthHits = raycaster.intersectObjects([globoMesh], false);
      const nodeHits = raycaster.intersectObjects(clickableNodes, false);

      let targetCountryData = null;

      // 1. Priorità: se l'utente ha toccato direttamente un marker annuncio o un badge nazione
      if (nodeHits.length > 0) {
        const hit = nodeHits[0];

        // Se la superficie terrestre è intersecata a distanza inferiore rispetto al marker,
        // significa che il marker si trova sul retro o dietro la curva del globo: scarta l'interazione!
        if (!(earthHits.length > 0 && earthHits[0].distance < hit.distance - 0.5)) {
          const markerObj = hit.object;

          // Se è un satellite orbitante (uno degli 8 satelliti dello spazio H2W)
          if (markerObj.userData && markerObj.userData.isSatellite) {
            const sat = markerObj.userData;
            toast.info(`🛰️ ${sat.name}`, {
              description: sat.description || `${sat.scientificModel || ''} • ${sat.satData?.role || ''}`,
            });
            if (onOpenSatelliteRef.current) {
              onOpenSatelliteRef.current(sat.satelliteId || sat.satelliteType);
            }
            return;
          }

          // Se è un marker di un annuncio reale (Listing)
          if (markerObj.userData && markerObj.userData.isListingMarker && markerObj.userData.listing) {
            const item = markerObj.userData.listing;
            if (onSelectListingRef.current) {
              onSelectListingRef.current(item);
            }
            toast.info(`📍 Annuncio selezionato: ${item.title}`, {
              description: `${item.author?.city || item.city || ''} • Clicca sulla scheda in basso per entrare nei dettagli`,
            });
            flyToCountry({
              lat: item.lat,
              lng: item.lng,
              name: item.title,
              flag: '📍',
              description: `${item.author?.city || item.city || ''} • ${item.intent || 'ANNUNCIO'}`,
            });
            return;
          }

          // Se è un marker di un'attività commerciale / sponsor (3 categorie: Doppio Anello, Viola Pi, Oro Puro)
          if (markerObj.userData && markerObj.userData.isMerchantPin && markerObj.userData.biz) {
            const biz = markerObj.userData.biz;
            const pinVisual = markerObj.userData.pinVisual;
            toast.success(`${pinVisual.icon} ${biz.name}`, {
              description: `${pinVisual.badgeLabel} • ${biz.city}`,
            });
            if (onSelectSponsorRef.current) {
              onSelectSponsorRef.current(biz);
            }
            flyToCountry({
              lat: biz.lat,
              lng: biz.lng,
              name: biz.name,
              flag: pinVisual.icon,
              description: `${biz.city} • ${pinVisual.badgeLabel}`,
            });
            return;
          }

          // Se è un utente attivo della Chat (👨 Uomo o 👩 Donna)
          if (markerObj.userData && markerObj.userData.isChatUserPin && markerObj.userData.user) {
            const user = markerObj.userData.user;
            toast.info(`${user.avatarSymbol} ${user.displayName}`, {
              description: `${user.username} • ${user.city} • ${user.statusText}`,
            });
            if (onSelectChatUserRef.current) {
              onSelectChatUserRef.current(user);
            }
            flyToCountry({
              lat: user.lat,
              lng: user.lng,
              name: user.displayName,
              flag: user.avatarSymbol,
              description: `${user.city} • Utente Attivo`,
            });
            return;
          }

          const countryData = markerObj.userData;
          if (countryData && countryData.name) {
            const markerWorldPos = new THREE.Vector3();
            markerObj.getWorldPosition(markerWorldPos);
            const camDir = camera.position.clone().sub(markerWorldPos).normalize();
            const normal = markerWorldPos.clone().normalize();
            if (normal.dot(camDir) >= 0.05) {
              // Trova i dettagli completi per assicurare la bandiera e i dati corretti
              const matchedCountry = ALL_COUNTRIES_DATA.find(
                (c) => c.id === countryData.id || c.name.toLowerCase() === countryData.name.toLowerCase()
              );
              targetCountryData = matchedCountry || countryData;
            }
          }
        }
      }

      // 2. Se l'utente ha toccato la superficie del globo terrestre:
      // Rispetta l'intento dell'utente: NON mostrare luoghi o stati predefiniti casuali.
      // Cerca se esiste un annuncio attivo tra quelli cercati/filtrati vicino al punto cliccato.
      if (!targetCountryData && earthHits.length > 0) {
        const hitPoint = earthHits[0].point;
        const localHit = globeGroup.worldToLocal(hitPoint.clone());

        // Controlla se c'è un annuncio attivo vicino al punto toccato
        let nearestListing = null;
        let minListingDist = Infinity;
        if (activeListingsList && activeListingsList.length > 0) {
          for (const item of activeListingsList) {
            if (typeof item.lat === 'number' && typeof item.lng === 'number') {
              const pos = convertiCoordinate(item.lat, item.lng, raggioGlobo);
              const dist = localHit.distanceTo(pos);
              if (dist < minListingDist) {
                minListingDist = dist;
                nearestListing = item;
              }
            }
          }
        }

        if (nearestListing && minListingDist < 7.5) {
          if (onSelectListingRef.current) {
            onSelectListingRef.current(nearestListing);
          }
          flyToCountry({
            lat: nearestListing.lat,
            lng: nearestListing.lng,
            name: nearestListing.title,
            flag: '📍',
            description: `${nearestListing.author?.city || nearestListing.city || ''}`,
          }, null, false);
          return;
        }

        // Quando l'utente tocca un punto sulla superficie del globo con il dito:
        // Identifica con precisione astronomica il Paese o Territorio cliccato
        const normLocal = localHit.clone().normalize();
        const latClicked = 90 - Math.acos(Math.max(-1, Math.min(1, normLocal.y))) * (180 / Math.PI);
        const lngClicked = ((Math.atan2(normLocal.z, -normLocal.x) * (180 / Math.PI)) - 180 + 540) % 360 - 180;

        const nearest = findNearestCountry(latClicked, lngClicked);
        const resolvedCountry = nearest ? {
          id: nearest.code.toLowerCase(),
          code: nearest.code,
          name: nearest.name,
          countryName: nearest.name,
          capital: nearest.capital,
          flag: nearest.flag,
          lat: nearest.lat,
          lng: nearest.lng,
          currency: `${nearest.currency?.code || 'EUR'} (${nearest.currency?.symbol || '€'})`,
          currencyData: nearest.currency,
          lang: nearest.language?.name || 'Locale',
          language: nearest.language,
          timezone: nearest.timezone,
          continent: nearest.continent,
          description: `${nearest.name} (${nearest.continent}) • Capitale: ${nearest.capital}`,
        } : {
          lat: latClicked,
          lng: lngClicked,
          name: "Territorio",
          flag: "🌍",
        };

        if (togglePoliticalRevealRef.current) {
          togglePoliticalRevealRef.current(true);
        }
        positionZoneReticle(resolvedCountry);
        setActiveZone(resolvedCountry);
        flyToCountry(resolvedCountry, (c) => {
          if (onCountrySelectRef.current) {
            onCountrySelectRef.current(c);
          }
        }, true);
        if (onZoneIdentifiedRef.current) {
          onZoneIdentifiedRef.current(resolvedCountry);
        }
        return;
      }

      // Se abbiamo individuato una regione o stato tramite tocco del marker, attiva lo strato politico e sincronizza
      if (targetCountryData) {
        if (togglePoliticalRevealRef.current) {
          togglePoliticalRevealRef.current(true);
        }
        positionZoneReticle(targetCountryData);
        setActiveZone(targetCountryData);
        flyToCountry(targetCountryData, (c) => {
          if (onCountrySelectRef.current) {
            onCountrySelectRef.current(c);
          }
        }, true);
        if (onZoneIdentifiedRef.current) {
          onZoneIdentifiedRef.current(targetCountryData);
        }
      }
    };

    const onMouseDown = (e) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = (e) => handlePointerUp(e.clientX, e.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length > 1) {
        isMultiTouchActive = true;
      } else if (e.touches.length === 1) {
        isMultiTouchActive = false;
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length > 1) {
        isMultiTouchActive = true;
      } else if (e.touches.length === 1 && !isMultiTouchActive) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = (e) => {
      if (isMultiTouchActive || e.touches.length > 0) {
        multiTouchEndTime = performance.now();
        if (e.touches.length === 0) {
          setTimeout(() => {
            isMultiTouchActive = false;
          }, 350);
        }
        return; // Non innescare mai tap durante o al termine di gesti pinch zoom
      }
      if (e.changedTouches.length === 1) {
        handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: true });
    domEl.addEventListener('touchend', onTouchEnd, { passive: true });

    // 14. ANIMATION LOOP & ROTAZIONE FLUIDA
    let animationId;
    let isAlive = true;
    const MACRO_ZOOM_THRESHOLD = 118; // Soglia tra vista macro globale e ingrandimento

    const animate = () => {
      if (!isAlive) return;
      animationId = requestAnimationFrame(animate);

      const currentCameraDist = camera.position.distanceTo(controls.target);
      const isMacro = currentCameraDist > MACRO_ZOOM_THRESHOLD;

      // I MARKER E LE REGIONI RESTANO SEMPRE VISIBILI: MAI NASCONDERLI QUANDO SI INGRANDISCE!
      nationalMarkersGroup.visible = true;

      if (isMacro !== isMacroRef.current) {
        isMacroRef.current = isMacro;
        setIsMacroZoom(isMacro);
        if (onZoomModeChange) {
          onZoomModeChange(isMacro ? 'MACRO' : 'URBANO');
        }
      }

      // Calcolo astronomico della posizione reale del Sole basata sull'ora UTC corrente e declinazione solare
      const nowUtc = new Date();
      const utcHours = nowUtc.getUTCHours() + nowUtc.getUTCMinutes() / 60 + nowUtc.getUTCSeconds() / 3600;
      const solarLng = -((utcHours - 12.0) / 24.0) * Math.PI * 2.0;
      const startOfYear = new Date(Date.UTC(nowUtc.getUTCFullYear(), 0, 1));
      const dayOfYear = Math.floor((nowUtc.getTime() - startOfYear.getTime()) / (24 * 3600 * 1000)) + 1;
      const declinationRad = (23.44 * Math.PI / 180) * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));

      const celestialDist = 350;
      sunLight.position.set(
        celestialDist * Math.cos(declinationRad) * Math.cos(solarLng),
        celestialDist * Math.sin(declinationRad),
        celestialDist * Math.cos(declinationRad) * Math.sin(solarLng)
      );
      const liveSunDir = sunLight.position.clone().normalize();

      if (globoMat.uniforms.uSunDirection) {
        globoMat.uniforms.uSunDirection.value.copy(liveSunDir);
      }
      if (globoMat.uniforms.uCameraWorldPos) {
        globoMat.uniforms.uCameraWorldPos.value.copy(camera.position);
      }
      if (atmosMat.uniforms.uSunDirection) {
        atmosMat.uniforms.uSunDirection.value.copy(liveSunDir);
      }
      if (atmosMat.uniforms.uCameraWorldPos) {
        atmosMat.uniforms.uCameraWorldPos.value.copy(camera.position);
      }

      const canAutoRotate = !isUserInteracting && !isFlying;
      if (canAutoRotate) {
        globeGroup.rotation.y += 0.0007; // Rotazione cinematografica lenta e morbida
      }

      // Lo strato radar reale RainViewer resta ancorato alle coordinate geografiche di globeGroup

      // Animazione pulsazione del reticolo di individuazione zona
      if (zoneReticleGroup.visible) {
        const timeNow = Date.now() * 0.004;
        const s1 = 1.0 + Math.sin(timeNow) * 0.16;
        reticleInnerRing.scale.set(s1, s1, 1);
        reticleOuterRing.scale.set(1.15 - Math.sin(timeNow) * 0.12, 1.15 - Math.sin(timeNow) * 0.12, 1);
        reticleOuterRing.rotation.z += 0.015;
      }

      // Lampeggio distintivo Viola (#8b5cf6) <-> Oro (#f59e0b) per i PIN che accettano Pi
      if (piBlinkingMaterials.length > 0) {
        const useGold = Math.sin(Date.now() * 0.0065) > 0;
        const headHex = useGold ? 0xf59e0b : 0x8b5cf6;
        const ringHex = useGold ? 0x8b5cf6 : 0xffd700;
        for (let i = 0; i < piBlinkingMaterials.length; i++) {
          const pair = piBlinkingMaterials[i];
          pair.headMat.color.setHex(headHex);
          pair.ringMat.color.setHex(ringHex);
          if (pair.stemMat) pair.stemMat.color.setHex(headHex);
        }
      }

      // Pulsazione anelli radar marker
      if (isMacro) {
        const time = Date.now() * 0.003;
        const ringScale = 1.0 + Math.sin(time) * 0.22;
        const ringAlpha = 0.45 + Math.sin(time) * 0.35;
        for (let i = 0; i < pulsingRings.length; i++) {
          const item = pulsingRings[i];
          item.ring.scale.set(ringScale * item.baseScale, ringScale * item.baseScale, 1);
          item.ring.material.opacity = ringAlpha;
        }
      }

      // Movimento continuo orbitale 3D degli 8 veicoli spaziali ingegnerizzati
      const strobeTime = Date.now() * 0.007;
      const strobeOn = Math.sin(strobeTime) > 0;

      activeSatellites.forEach((sat) => {
        // Se il satellite è disattivato dall utente (OFF), salta completamente i calcoli fisici e di rendering (0 CPU/GPU)
        if (!sat.craftGroup || !sat.craftGroup.visible) return;

        sat.angle += sat.speed;
        const r = sat.orbitRadius;
        const inc = sat.inclination;
        // Orbita circolare inclinata 3D nello spazio
        const x = r * Math.cos(sat.angle);
        const y = r * Math.sin(sat.angle) * Math.sin(inc);
        const z = r * Math.sin(sat.angle) * Math.cos(inc);

        sat.craftGroup.position.set(x, y, z);

        // Orientamento cinematico lungo la traiettoria orbitale con asse nadir orientato al centro della Terra
        const vx = -r * Math.sin(sat.angle);
        const vy = r * Math.cos(sat.angle) * Math.sin(inc);
        const vz = r * Math.cos(sat.angle) * Math.cos(inc);
        const forward = new THREE.Vector3(vx, vy, vz).normalize();
        const up = new THREE.Vector3(x, y, z).normalize();
        const matrix = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), forward, up);
        sat.craftGroup.quaternion.setFromRotationMatrix(matrix);

        if (sat.radarPulse) {
          sat.pulsePhase = (sat.pulsePhase || 0) + 0.035;
          const s = 1.0 + (Math.sin(sat.pulsePhase) + 1) * 0.14;
          sat.radarPulse.scale.set(s, s, s);
          if (sat.radarPulse.material) {
            sat.radarPulse.material.opacity = Math.max(0.08, 0.5 - (s - 1.0) * 1.5);
          }
        }
        if (sat.strobeBeacons && sat.strobeBeacons.length > 0) {
          sat.strobeBeacons.forEach((b) => {
            b.visible = strobeOn;
          });
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 15. RESIZE HANDLER ROBUSTO CON RESIZEOBSERVER
    const handleResize = () => {
      if (!container || !isAlive) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Aggiorna la vista globale proporzionale su orientamento o ridimensionamento
      const port = width < height;
      const ratio = port ? Math.max(1.15, (height / width) * 0.6) : 1.0;
      defaultCameraPos.set(20, 36, 155 * ratio);
      defaultCameraTarget.set(0, -6, 0);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    // Doppio resize su frame successivo per garantire il calcolo corretto dopo il layout CSS
    requestAnimationFrame(handleResize);
    setTimeout(handleResize, 150);

    // 16. CLEANUP UNMOUNT
    return () => {
      isAlive = false;
      clearInterval(radarRefreshInterval);
      cancelAnimationFrame(animationId);
      if (flyAnimationId) cancelAnimationFrame(flyAnimationId);
      if (crossfadeAnimationId) cancelAnimationFrame(crossfadeAnimationId);

      unsubscribeEngine();
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      domEl.removeEventListener('mousedown', onMouseDown);
      domEl.removeEventListener('touchstart', onTouchStart);
      domEl.removeEventListener('touchmove', onTouchMove);
      domEl.removeEventListener('touchend', onTouchEnd);

      controls.dispose();
      renderer.dispose();
      globoGeo.dispose();
      globoMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      globoPoliticoGeo.dispose();
      globoPoliticoMat.dispose();
      politicalTexture.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      radarTexture.dispose();
      starsGeo.dispose();
      starsMat.dispose();

      createdResources.forEach((res) => {
        if (res.geo) res.geo.dispose();
        if (res.mat) res.mat.dispose();
        if (res.texture) res.texture.dispose();
      });

      if (container && domEl && container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []); // Dipendenze vuote: la scena Three.js e OrbitControls restano stabili senza MAI resettare la vista durante lo zoom

  // Ascolta trigger esterno di reset al Mondo
  useEffect(() => {
    if (resetWorldTrigger > 0 && flyToResetRef.current) {
      flyToResetRef.current(true);
    }
  }, [resetWorldTrigger]);

  // Ascolta trigger esterno di centratura rapida sull'Italia
  useEffect(() => {
    if (focusItalyTrigger > 0 && flyToCountryRef.current) {
      const italy = COUNTRIES.find((c) => c.id === 'it');
      if (italy) {
        flyToCountryRef.current(italy);
      }
    }
  }, [focusItalyTrigger]);

  // Sincronizza la modalità Geopolitica / Fotografica con il selettore esterno
  useEffect(() => {
    if (togglePoliticalRevealRef.current) {
      togglePoliticalRevealRef.current(isGeoMode);
    }
  }, [isGeoMode]);

  // Se il paese o regione selezionata cambia e flyToCountryRef è pronto, orienta la sfera
  useEffect(() => {
    if (selectedCountryId && flyToCountryRef.current) {
      const match =
        COUNTRIES.find((c) => c.id === selectedCountryId) ||
        ITALIAN_REGIONS.find((r) => r.id === selectedCountryId);
      if (match) {
        flyToCountryRef.current(match);
      }
    }
  }, [selectedCountryId]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black select-none">
      {/* 3D Canvas Contenitore Sfera Wireframe Blu/Verde */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          touchAction: 'none',
        }}
      />



      {/* DOCK VERTICALE ESSENZIALE (IN ALTO A DESTRA, NERO/BIANCO/NEON SENZA CORNICI APPESANTITE) */}
      <div className="absolute top-4 right-3 sm:right-4 z-20 pointer-events-auto flex flex-col items-center gap-1.5 bg-black/90 p-1.5 rounded-xl border border-zinc-900 shadow-xl">
        {/* Toggle Espandi Schermo Intero / Allarga Cartina */}
        {onToggleFullscreen && (
          <button
            id="btn-globe-toggle-fullscreen"
            onClick={onToggleFullscreen}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 border ${
              isFullscreen
                ? 'bg-[#00ff66] text-black font-black border-[#00ff66]'
                : 'bg-zinc-950 text-[#00ff66] hover:bg-zinc-900 border-zinc-800'
            }`}
            title={isFullscreen ? 'Riduci cartina alla vista standard' : 'Allarga cartina a schermo intero (100% display)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}



        {/* Controllo Flotta 8 Satelliti Spaziali & Preset */}
        <button
          id="btn-globe-satellites-fleet"
          onClick={() => {
            if (onOpenSatelliteRef.current) {
              onOpenSatelliteRef.current("FLEET_CONTROLS");
            }
          }}
          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500 flex items-center justify-center text-sm transition-colors cursor-pointer active:scale-95 shadow-md shadow-emerald-500/10"
          title="Centro Controllo Flotta Spaziale: Interruttori ON/OFF degli 8 Satelliti, 8 Preset & Dati di Volo"
        >
          <span>🛰️</span>
        </button>

        {/* Vista Urbana 3D Edifici & Verifica Sponsor sul Posto */}
        <button
          id="btn-globe-to-urban-3d"
          onClick={() => {
            if (onEnterUrban3DRef.current) {
              const target = activeZone || { lat: 41.8902, lng: 12.4922, name: 'Roma', countryName: 'Italia', flag: '🇮🇹' };
              toast.info(`🏙️ Apertura Vista Edifici 3D su ${target.name}...`);
              onEnterUrban3DRef.current(target);
            }
          }}
          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-amber-400/20 text-amber-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-400 flex items-center justify-center text-sm transition-colors cursor-pointer active:scale-95 shadow-md shadow-amber-500/10"
          title="Vista Edifici 3D: guarda i palazzi volumetrici a livello strada e verifica gli sponsor sul luogo"
        >
          <span>🏙️</span>
        </button>

        {/* Centra Italia */}
        <button
          id="btn-globe-flyto-italy"
          onClick={() => {
            const italy = COUNTRIES.find((c) => c.id === 'it');
            if (italy && flyToCountryRef.current) {
              flyToCountryRef.current(italy);
            }
          }}
          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-[#00ff66]/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer active:scale-95"
          title="Centra istantaneamente sull'Italia e le sue 20 Regioni"
        >
          <span>🇮🇹</span>
        </button>

        {/* Vista Macro Mondo */}
        <button
          id="btn-globe-flyto-world"
          onClick={() => {
            if (flyToResetRef.current) {
              flyToResetRef.current(true);
            }
          }}
          className="w-8 h-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center text-sm transition-colors cursor-pointer active:scale-95"
          title="Reset telecamera: Torna alla vista macro globale intera"
        >
          <span>🌍</span>
        </button>

        {/* Pulsante Selettore Mappa: Fotografica vs Geopolitica (Sulla stessa identica sfera) */}
        <button
          id="btn-globe-toggle-political-layer"
          onClick={() => {
            if (togglePoliticalRevealRef.current) {
              const active = togglePoliticalRevealRef.current();
              if (active) {
                toast.success("🗺️ Mappa Geopolitica attivata", {
                  description: "Confini degli Stati e territori mondiali",
                  duration: 2000,
                });
              } else {
                toast.info("🌍 Mappa Fotografica 3D ripristinata", {
                  description: "Superficie fotorealistica attiva",
                  duration: 2000,
                });
              }
            }
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 border ${
            isPoliticalRevealed
              ? 'bg-[#00ff66] text-black font-black border-[#00ff66]'
              : 'bg-zinc-950 text-zinc-300 hover:text-white border-zinc-800'
          }`}
          title={isPoliticalRevealed ? 'Torna a Mappa Fotografica 3D' : 'Attiva Mappa Geopolitica (Stati e territori)'}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Toggle Meteo Dinamico: Nuvole & Pioggia 3D (Satellite 1) */}
        <button
          id="btn-globe-toggle-weather"
          onClick={() => {
            if (toggleWeatherRef.current) {
              const active = toggleWeatherRef.current();
              if (active) {
                toast.success("⛅ Meteo Dinamico Attivato", {
                  description: "Nuvole troposferiche e precipitazioni 3D attive",
                  duration: 2500,
                });
              } else {
                toast.info("☀️ Meteo Disabilitato", {
                  description: "Cielo limpido e superficie visibile al 100%",
                  duration: 2000,
                });
              }
            }
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 border ${
            isWeatherActive
              ? 'bg-sky-500 text-white font-black border-sky-400'
              : 'bg-zinc-950 text-zinc-400 hover:text-white border-zinc-800'
          }`}
          title={isWeatherActive ? "Disabilita Nuvole & Pioggia Dinamica" : "Attiva Nuvole & Pioggia Dinamica"}
        >
          {isWeatherActive ? <CloudRain className="w-4 h-4" /> : <CloudSun className="w-4 h-4" />}
        </button>

        {/* Pausa / Attiva Rotazione Asse Terrestre Reale (Inclinazione 23.44°) */}
        <button
          id="btn-globe-toggle-rotation"
          onClick={() => {
            const next = !isRotating;
            setIsRotating(next);
            if (next) {
              toast.success("🌍 Rotazione Asse Terrestre Attiva", {
                description: "Inclinazione astronomica reale di 23.44°",
                duration: 2500,
              });
            } else {
              toast.info("⏸️ Rotazione Terrestre in Pausa", {
                description: "Visuale fissa per esplorazione statica",
                duration: 2000,
              });
            }
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
            isRotating
              ? 'bg-[#00ff66] text-black font-black'
              : 'bg-zinc-950 text-zinc-400 hover:text-white'
          }`}
          title={isRotating ? 'Pausa rotazione asse terrestre (23.44°)' : 'Attiva rotazione naturale asse terrestre (23.44°)'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
        </button>
      </div>

      {/* Scheda Territoriale Fluttuante con Ingresso Diretto (Spostata in alto per liberare totalmente il fondo) */}
      {activeZone && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="px-4 py-2.5 rounded-xl bg-black border border-zinc-800 shadow-2xl flex flex-col sm:flex-row items-center gap-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{activeZone.flag || '🌍'}</span>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span className="text-[#00ff66]">{activeZone.name}</span>
                  {activeZone.capital && (
                    <span className="text-[11px] text-zinc-400">({activeZone.capital})</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {activeZone.description || `Lat: ${activeZone.lat?.toFixed(2)} • Lng: ${activeZone.lng?.toFixed(2)}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-globe-enter-urban"
                onClick={() => {
                  if (onEnterUrban3DRef.current) {
                    onEnterUrban3DRef.current(activeZone);
                  } else if (onZoneZoomArrivedRef.current) {
                    onZoneZoomArrivedRef.current(activeZone);
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-[#00ff66]/20"
                title={`Ingrandisci la cartina di ${activeZone.name} con strade, luoghi ed edifici 3D`}
              >
                <span>🔍 Ingrandisci Cartina Dettagliata ({activeZone.name})</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                onClick={() => {
                  setActiveZone(null);
                  if (positionReticleRef.current) {
                    positionReticleRef.current(null);
                  }
                }}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                title="Chiudi avviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
