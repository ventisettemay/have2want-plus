// Servizio di Ricerca Semantica Locale per Salvavatutto & Guide
// Usa Transformers.js (ONNX Runtime Web) per embedding client-side
// Nessuna dipendenza server, tutto locale nel browser - Privacy by Design

// NOTE: Transformers.js è pesante (~50MB). Questa è una implementazione leggera
// che simula ricerca semantica con BM25 + sinonimi per evitare il download del modello.
// Per ricerca semantica reale: import { pipeline } from '@xenova/transformers';
// const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

export interface SemanticSearchResult {
  id: string;
  score: number;
  title: string;
  summary: string;
  category: string;
  content: string;
  matchedTerms: string[];
}

export interface SearchIndexEntry {
  id: string;
  title: string;
  summary: string;
  category: string;
  content: string; // Full text for indexing
  tags: string[];
}

// Thesaurus locale per espansione query (sinonimi, termini correlati)
const LOCAL_THESAURUS: Record<string, string[]> = {
  'riparare': ['aggiustare', 'riparazione', 'fix', 'ripristinare', 'manutenzione'],
  'bicicletta': ['bici', 'ciclo', 'mtb', 'bici da corsa', 'gravel'],
  'gomma': ['pneumatico', 'camera d\'aria', 'ruota', 'copertone'],
  'forata': ['bucata', 'sfiata', 'perdita', 'puncture'],
  'cibo': ['alimento', 'viveri', 'nutrimento', 'spesa'],
  'conservare': ['preservare', 'mettere via', 'stoccare', 'conservazione', 'sottovuoto'],
  'orto': ['giardino', 'coltivazione', 'piantare', 'semina', 'ortaggi'],
  'risparmio': ['economia', 'risparmiare', 'spesa', 'budget', 'costo'],
  'energia': ['elettricità', 'corrente', 'watt', 'consumo', 'bolletta'],
  'pannello': ['fotovoltaico', 'solare', 'solar', 'modulo'],
  'batteria': ['accumulo', 'storage', 'power bank', 'carica'],
  'attrezzo': ['utensile', 'strumento', 'tool', 'chiave', 'cacciavite'],
  'saldare': ['saldatura', 'stagno', 'welding', 'giunzione'],
  'legno': ['falegnameria', 'carpentiere', 'tavola', 'asse', 'mobile'],
  'metallo': ['ferro', 'acciaio', 'alluminio', 'rame', 'saldatura'],
  'acqua': ['idrico', 'idraulico', 'tubo', 'rubinetto', 'perdita'],
  'elettrico': ['elettricità', 'cavo', 'interruttore', 'presa', 'corto circuito'],
  'motore': ['motore', 'cilindro', 'pistone', 'carburatore', 'accensione'],
  'olio': ['lubrificante', 'motore', 'cambio olio', 'filtro'],
  'freno': ['frenata', 'pastiglie', 'disco', 'tamburo', 'cavo freno'],
  'catena': ['trasmissione', 'corona', 'pignone', 'maglie', 'lubrificazione'],
  'cucina': ['cottura', 'fornello', 'forno', 'pentola', 'ricetta'],
  'fermentare': ['fermentazione', 'lievito', 'kombucha', 'kefir', 'sottaceti'],
  'essiccare': ['essiccazione', 'dehydrator', 'sole', 'forno basso'],
  'sottolio': ['sott\'olio', 'conserva', 'barattolo', 'olio extravergine'],
  'sottaceto': ['sott\'aceto', 'aceto', 'conserva', 'fermentato'],
  'marmellata': ['confettura', 'gelatina', 'frutta', 'zucchero', 'pectina'],
  'pane': ['panificazione', 'lievito', 'impasto', 'forno', 'farina'],
  'pasta': ['pastificio', 'essiccazione', 'farina', 'uova', 'essiccatore'],
  'formaggio': ['caseificio', 'caglio', 'latte', 'statuazione', 'invecchiamento'],
  'vino': ['enologia', 'fermentazione', 'uva', 'mosto', 'imbottigliamento'],
  'birra': ['birrificio', 'malto', 'luppolo', 'lievito', 'fermentazione'],
  'sapone': ['saponificazione', 'soda caustica', 'olio', 'glicerina', 'profumo'],
  'detersivo': ['sapone', 'bucato', 'lavaggio', 'ecologico', 'fai da te'],
  'pulire': ['pulizia', 'detergere', 'igienizzare', 'sgrassare', 'smacchiare'],
  'verniciare': ['vernice', 'pittura', 'smalto', 'fondo', 'finitura'],
  'isolamento': ['isolante', 'cappotto', 'termico', 'acustico', 'lana di roccia'],
  'tetto': ['copertura', 'tegole', 'guaina', 'impermeabilizzazione', 'grondaia'],
  'muro': ['parete', 'intonaco', 'pittura', 'crepa', 'riparazione'],
  'finestra': ['infisso', 'vetro', 'guarnizione', 'doppio vetro', 'persiana'],
  'porta': ['infisso', 'serratura', 'cerniera', 'guarnizione', 'maniglia'],
  'giardino': ['orto', 'prato', 'potatura', 'concime', 'irrigazione'],
  'pianta': ['vegetale', 'albero', 'arbusto', 'fiore', 'semina'],
  'potare': ['potatura', 'ramo', 'cesoie', 'stagione', 'forma'],
  'concime': ['fertilizzante', 'compost', 'letame', 'organico', 'chimico'],
  'irrigazione': ['acqua', 'goccia', 'sprinkler', 'timer', 'pozzo'],
  'compost': ['compostaggio', 'umido', 'secco', 'vermicompost', 'bokashi'],
  'vermicompost': ['lombrichi', 'humus', 'letame', 'terriccio', 'fertile'],
  'bokashi': ['fermentazione', 'effective microorganisms', 'secchio', 'scarti cucina'],
  'seme': ['semina', 'piantina', 'vivaio', 'trapianto', 'germinazione'],
  'trapianto': ['rinvaso', 'terriccio', 'radici', 'vaso', 'terra'],
  'malattia': ['parassita', 'fungo', 'insetto', 'afide', 'cocciniglia', 'trattamento'],
  'naturale': ['bio', 'organico', 'ecologico', 'senza chimici', 'permacultura'],
  'permacultura': ['design', 'sostenibile', 'autosufficiente', 'ecosistema', 'bill mollison'],
  'autosufficienza': ['indipendenza', 'produzione propria', 'baratto', 'comunità', 'resilienza'],
  'comunità': ['vicinato', 'condivisione', 'mutuo aiuto', 'solidarietà', 'rete'],
  'condivisione': ['sharing', 'prestito', 'scambio', 'biblioteca degli attrezzi', 'tool library'],
  'prestito': ['noleggio', 'affitto', 'uso condiviso', 'costo zero', 'circolare'],
  'economia circolare': ['circolare', 'rifiuti zero', 'riuso', 'riciclo', 'upcycling'],
  'upcycling': ['riuso creativo', 'trasformazione', 'valore aggiunto', 'rifiuto risorsa'],
  'rifiuto': ['scarto', 'spazzatura', 'discarica', 'raccolta differenziata', 'rifiuti zero'],
  'riciclo': ['recupero', 'materiali', 'seconda vita', 'economia circolare', 'sostenibilità'],
  'sostenibilità': ['sostenibile', 'green', 'ecologico', 'impatto zero', 'futuro'],
};

// BM25 parameters
const K1 = 1.5;
const B = 0.75;

/**
 * Tokenizza e normalizza testo italiano
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuovi accenti
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Espande query con sinonimi dal thesaurus
 */
export function expandQuery(query: string): string[] {
  const tokens = tokenize(query);
  const expanded = new Set(tokens);
  
  for (const token of tokens) {
    if (LOCAL_THESAURUS[token]) {
      LOCAL_THESAURUS[token].forEach(syn => expanded.add(syn));
    }
    // Aggiungi anche matching parziale per termini composti
    for (const [key, syns] of Object.entries(LOCAL_THESAURUS)) {
      if (key.includes(token) || token.includes(key)) {
        syns.forEach(s => expanded.add(s));
      }
    }
  }
  
  return Array.from(expanded);
}

/**
 * Calcola IDF (Inverse Document Frequency) per ogni termine
 */
function calculateIDF(docs: SearchIndexEntry[]): Record<string, number> {
  const N = docs.length;
  const termDocFreq: Record<string, number> = {};
  
  for (const doc of docs) {
    const terms = new Set([
      ...tokenize(doc.title),
      ...tokenize(doc.summary),
      ...tokenize(doc.content),
      ...doc.tags.flatMap(t => tokenize(t))
    ]);
    
    for (const term of terms) {
      termDocFreq[term] = (termDocFreq[term] || 0) + 1;
    }
  }
  
  const idf: Record<string, number> = {};
  for (const [term, df] of Object.entries(termDocFreq)) {
    idf[term] = Math.log((N - df + 0.5) / (df + 0.5) + 1);
  }
  
  return idf;
}

/**
 * Calcola lunghezza media documento
 */
function calculateAvgDocLength(docs: SearchIndexEntry[]): number {
  let totalLen = 0;
  for (const doc of docs) {
    totalLen += tokenize(doc.title + ' ' + doc.summary + ' ' + doc.content).length;
  }
  return totalLen / docs.length;
}

/**
 * BM25 Score per un documento
 */
function bm25Score(
  queryTerms: string[],
  doc: SearchIndexEntry,
  idf: Record<string, number>,
  avgDocLen: number
): number {
  const docTerms = tokenize(doc.title + ' ' + doc.summary + ' ' + doc.content);
  const docLen = docTerms.length;
  const termFreq: Record<string, number> = {};
  
  for (const term of docTerms) {
    termFreq[term] = (termFreq[term] || 0) + 1;
  }
  
  let score = 0;
  for (const qTerm of queryTerms) {
    const tf = termFreq[qTerm] || 0;
    if (tf === 0) continue;
    
    const idfVal = idf[qTerm] || 0;
    const numerator = tf * (K1 + 1);
    const denominator = tf + K1 * (1 - B + B * (docLen / avgDocLen));
    score += idfVal * (numerator / denominator);
  }
  
  return score;
}

/**
 * Costruisce indice di ricerca da guide
 */
export function buildSearchIndex(guides: any[]): SearchIndexEntry[] {
  return guides.map(g => ({
    id: g.id,
    title: g.title,
    summary: g.summary,
    category: g.category,
    content: `${g.title} ${g.summary} ${g.steps.join(' ')} ${g.tags.join(' ')}`,
    tags: g.tags,
  }));
}

/**
 * Ricerca semantica (BM25 + espansione sinonimi)
 */
export function semanticSearch(
  query: string,
  guides: any[],
  options: { topK?: number; minScore?: number } = {}
): SemanticSearchResult[] {
  if (!query.trim() || guides.length === 0) return [];
  
  const { topK = 10, minScore = 0.1 } = options;
  
  // Espande query con sinonimi
  const expandedTerms = expandQuery(query);
  
  // Costruisce indice
  const index = buildSearchIndex(guides);
  
  // Calcola IDF e avgDocLen
  const idf = calculateIDF(index);
  const avgDocLen = calculateAvgDocLength(index);
  
  // Calcola score per ogni documento
  const results = index.map(doc => {
    const score = bm25Score(expandedTerms, doc, idf, avgDocLen);
    
    // Trova termini matched per highlight
    const docTokens = new Set(tokenize(doc.content));
    const matchedTerms = expandedTerms.filter(t => docTokens.has(t));
    
    return {
      id: doc.id,
      score,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      content: doc.content,
      matchedTerms,
    };
  });
  
  // Filtra e ordina
  return results
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Ricerca ibrida: combina ricerca testuale esatta + semantica
 */
export function hybridSearch(
  query: string,
  guides: any[],
  options: { topK?: number } = {}
): SemanticSearchResult[] {
  if (!query.trim()) return guides.slice(0, options.topK || 10).map(g => ({
    id: g.id,
    score: 1,
    title: g.title,
    summary: g.summary,
    category: g.category,
    content: '',
    matchedTerms: [],
  }));
  
  // Ricerca esatta (priorità alta)
  const q = query.toLowerCase();
  const exactMatches = guides.filter(g => 
    g.title.toLowerCase().includes(q) ||
    g.summary.toLowerCase().includes(q) ||
    g.tags.some((t: string) => t.toLowerCase().includes(q))
  );
  
  // Ricerca semantica
  const semanticResults = semanticSearch(query, guides, options);
  
  // Combina: exact matches first, poi semantic
  const exactIds = new Set(exactMatches.map(g => g.id));
  const combined = [
    ...exactMatches.map(g => ({
      id: g.id,
      score: 100, // High priority
      title: g.title,
      summary: g.summary,
      category: g.category,
      content: '',
      matchedTerms: [query],
    })),
    ...semanticResults.filter(r => !exactIds.has(r.id))
  ];
  
  return combined.slice(0, options.topK || 10);
}

export { LOCAL_THESAURUS };