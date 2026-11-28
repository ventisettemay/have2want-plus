export interface ActionFlowAppSlot {
  slotId: 'slot_1' | 'slot_2' | 'slot_3';
  name: string;
  tagline: string;
  category: string;
  targetUrl: string;
  accentColor: string;
  icon: string;
  isConfigured: boolean;
}

const STORAGE_KEY = 'h2w_actionflow_slots_v1';

export const DEFAULT_ACTIONFLOW_APPS: ActionFlowAppSlot[] = [
  {
    slotId: 'slot_1',
    name: 'App Partner Slot #1',
    tagline: 'Collega una webapp esterna, piattaforma di prenotazione o portale community.',
    category: 'Produttività & Servizi',
    targetUrl: 'https://have2want.app',
    accentColor: '#00ff66',
    icon: '⚡',
    isConfigured: true,
  },
  {
    slotId: 'slot_2',
    name: 'App Partner Slot #2',
    tagline: 'Slot pronto per collegamento rapido a marketplace specializzati o tool P2P.',
    category: 'Ecosistema & Tool',
    targetUrl: 'https://minepi.com',
    accentColor: '#38bdf8',
    icon: '🔗',
    isConfigured: true,
  },
  {
    slotId: 'slot_3',
    name: 'App Partner Slot #3',
    tagline: 'Slot configurabile per eventi locali, mobilità condivisa o media partner.',
    category: 'Media & Territorio',
    targetUrl: 'https://www.openstreetmap.org',
    accentColor: '#f59e0b',
    icon: '🚀',
    isConfigured: true,
  },
];

export function loadActionFlowSlots(): ActionFlowAppSlot[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_ACTIONFLOW_APPS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIONFLOW_APPS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 3) return DEFAULT_ACTIONFLOW_APPS;
    return DEFAULT_ACTIONFLOW_APPS.map((def, idx) => {
      const candidate = parsed[idx];
      if (!candidate || typeof candidate !== 'object') return def;
      return {
        ...def,
        name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : def.name,
        tagline: typeof candidate.tagline === 'string' && candidate.tagline.trim() ? candidate.tagline.trim() : def.tagline,
        category: typeof candidate.category === 'string' && candidate.category.trim() ? candidate.category.trim() : def.category,
        targetUrl: isSafeExternalUrl(candidate.targetUrl) ? candidate.targetUrl : def.targetUrl,
        icon: typeof candidate.icon === 'string' && candidate.icon.trim() ? candidate.icon.trim() : def.icon,
        isConfigured: true,
      };
    });
  } catch {
    return DEFAULT_ACTIONFLOW_APPS;
  }
}

export function saveActionFlowSlots(slots: ActionFlowAppSlot[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function resetActionFlowSlots(): ActionFlowAppSlot[] {
  saveActionFlowSlots(DEFAULT_ACTIONFLOW_APPS);
  return DEFAULT_ACTIONFLOW_APPS;
}

export function isSafeExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
