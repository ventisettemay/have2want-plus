# HAVE2WANT — SPECIFICHE TECNICHE COMPLETE DEL PROGETTO
## Documento Ufficiale di Architettura, Modello Dati, Frontend, Backend, Dipendenze ed Evoluzione del Codice
### Dalle Origini (Ex BIS) alla Versione Consolidata Attuale

* **Denominazione Ufficiale:** HAVE2WANT (acronimo informale: H2W)
* **Denominazione Originaria di Genesi:** BIS
* **Tagline & Payoff:** Simply Discreet
* **Principio Guida:** What you have → What you want
* **Titolare e Creatore Originario:** brandoriginalword@gmail.com
* **Data di Consolidamento:** 2 Settembre 2026
* **Stato del Progetto:** Release Consolidata & Funzionante (Produzione / Anteprima AI Studio)

---

# 1. ORIGINE, VISIONE E PRINCIPI GUIDA

### 1.1 Genesi e Transizione BIS → HAVE2WANT
Il progetto nasce originariamente con il nome in codice provvisorio **BIS**, concepito per ridefinire radicalmente i paradigmi di interazione umana ed economica nel contesto digitale contemporaneo. Nei marketplace tradizionali e nelle piattaforme di annunci convenzionali, l'utente è ridotto a una mera controparte transazionale, sottoposto a tracciamento aggressivo, intermediazione speculativa, commissioni percentuali invasive e continue sollecitazioni commerciali algoritmiche.

La transizione nominale ed evolutiva da **BIS** a **HAVE2WANT (H2W)** ha consolidato la visione fondativa in un'architettura completa:
1. **Centralità della Persona e della Comunità:** La piattaforma non spinge all'acquisto impulsivo, ma crea lo spazio per far emergere spontaneamente bisogni materiali, immateriali, saperi, talenti e disponibilità.
2. **What you have → What you want:** In ogni collettività, ciascun individuo possiede risorse, strumenti, competenze o tempo (HAVE) che possono essere di vitale utilità per un altro individuo; specularmente, chiunque può trovarsi in una condizione temporanea di necessità (WANT).
3. **Simply Discreet (L'Assistente Discreto):** L'intelligenza artificiale e la tecnologia operano come mediatori silenziosi ed empatici, non come guardoni digitali o motori pubblicitari aggressivi.

---

# 2. ARCHITETTURA DI SISTEMA E PARADIGMA TECNOLOGICO

### 2.1 Architettura Full-Stack Ibrida (Client-First con Gateway Node/Express)
L'applicazione è strutturata secondo una solida architettura **Single Page Application (SPA) Reattiva** basata su standard moderni del Web, con un layer server Node.js/Express per l'orchestrazione sicura delle API, dei servizi di intelligenza artificiale server-side e del routing verso i Google 3D Tiles geospaziali.

* **Core Runtime:** Node.js (Ambiente Container Cloud Run / Sandboxed AI Studio su Porta 3000)
* **Linguaggio Primario:** TypeScript 5.8+ (Strict Type Checking, Zero Any, compilazione tipizzata)
* **Frontend Framework:** React 19 (Hooks, Concurrent Rendering, Suspense, State Management Reattivo)
* **Build Tool & Bundler:** Vite 6.2+ con Hot Module Replacement controllato
* **Styling & Design System:** Tailwind CSS v4 (Design Tokens, Palette Neutri Caldi e Freddi, Micro-Interazioni)
* **Animation & Transition Engine:** Motion (motion/react v12) con transizioni layout fluide
* **3D Visual Engine:** Three.js (WebGL Canvas rendering per Città 3D, Orbit Controls, Shader e particellari)
* **Data Visualization & GIS:** Integrazione con Google Earth 3D Tiles, mappe geospaziali e bacheche radar georeferenziate

---

# 3. MODELLO DATI E SCHEMI TYPESCRIPT (DATA LAYER)

Il file `src/types.ts` costituisce l'ontologia rigorosa di tutti i tipi e le strutture dati dell'applicazione. Di seguito vengono analizzate tutte le entità fondamentali.

### 3.1 I Tre Intenti Rigidi Operativi (InteractionIntent)
Per eliminare qualsiasi ambiguità semantica tra modalità astratte e azioni reali, il flusso è vincolato all'enum dei 3 intenti:
```typescript
export type InteractionIntent = 
  | 'VENDO'             // Vendita regolata esclusivamente in Pi Coin (π)
  | 'BARATTO_SCAMBIO'   // Scambio merceologico diretto, baratto paritario o scambio di tempo
  | 'ACQUISTO_CERCO';   // Annuncio di ricerca e fabbisogno per beni o servizi desiderati
```

### 3.2 L'Entità Annuncio Principale (HaveWantListing)
```typescript
export interface HaveWantListing {
  id: string;
  intent: InteractionIntent;
  title: string;
  description: string;
  category: RealCategoryKey;
  subcategory: RealSubcategoryKey;
  piPrice: number; // Obbligatorio e > 0 se intent === 'VENDO', 0 per baratto/cerco
  concreteExchange?: {
    offer?: {
      item: string;
      quantity: number;
      unit: string;
      condition?: string;
    };
    wanted?: {
      item: string;
      quantity: number;
      unit: string;
    };
    territorialScope?: 'stesso_quartiere' | 'citta_area' | 'provincia' | 'nazionale';
  };
  author: {
    name: string;
    username: string;
    avatar: string;
    reputation: number;
    isPioneerVerified: boolean;
    city: string;
    province?: string;
  };
  lat: number;
  lng: number;
  locationArea: string; // Es: "Asti (AT)" - Mascheramento privacy
  isFuzzyLocation?: boolean; // True per centroidi urbani senza tracciamento dell'indirizzo privato
  imageUrl?: string;
  createdAt: string;
  tags: string[];
  status: 'active' | 'matched' | 'completed';
  planetId: string;
  satelliteId: string;
}
```

### 3.3 Tassonomia Merceologica e Categorie Reali (`src/categories.ts`)
Le inserzioni e i nodi di scambio sono organizzati in 7 macro-categorie concrete del mondo reale:
1. **`casa_fai_da_te`**: Arredamento e Mobili, Elettrodomestici, Utensileria e Attrezzi, Giardinaggio, Materiali Edili.
2. **`auto_moto_veicoli`**: Automobili, Scooter e Moto, Biciclette, Monopattini e Mobilità Elettrica, Ricambi e Accessori.
3. **`elettronica_informatica`**: Smartphone e Tablet, Computer e Laptop, Componenti Hardware, Fotografia, Audio e Video.
4. **`libri_scuola_cultura`**: Libri Scolastici, Saggistica e Narrativa, Fumetti e Collezionismo, Strumenti Musicali, Materiale Didattico.
5. **`servizi_lavoro_buoni`**: Riparazioni e Manutenzioni, Lezioni e Ripetizioni, Assistenza Informatica, Aiuto Domestico e Traslochi.
6. **`abbigliamento_accessori`**: Abbigliamento Uomo/Donna, Scarpe e Calzature, Accessori e Borse, Abbigliamento Bambino.
7. **`rete_specialisti_supporto`**: Professionisti Solidali, Artigiani di Fiducia, Consulenze Tecniche a Vetrina Gratuita.

### 3.4 Utente Pioniere e Reputazione a 5 Stelle (`PioneerUser`)
* Identità verificata nel Pi Network
* Wallet pubblico per transazioni peer-to-peer dirette
* Reputazione media basata su scambi conclusi positivamente
* Storico delle interazioni solidali e rispetto del codice deontologico comunitario

---

# 4. FRONTEND, COMPONENTI E MODULI FUNZIONALI

L'interfaccia utente è articolata in una suite modulare di viste reattive, collegate da un header sticky con navigazione contestuale:

### 4.1 Bacheca Home P2P (`HomeFeedView.tsx`)
* **Visual Grid & Product Cards:** Griglia reattiva (1/2/3 colonne) con immagini reali, badge d'intento color-coded (Verde = Vendo $\pi$, Ambra = Baratto, Azzurro = Cerco), prezzo in Pi Coin ben visibile e reputazione dell'autore.
* **I 3 Switch d'Azione:** Filtri con contatori numerici dinamici per segmentare istantaneamente il mercato circolare.
* **Filtro Territoriale & Categorie:** Selezione geografica per provincia/città e scorrimento orizzontale delle categorie merceologiche.
* **Modale di Pubblicazione Rapida (`+ Pubblica Annuncio`):** Interfaccia guidata con calcolo del prezzo in Pi Coin, specifiche di scambio materiale e geolocalizzazione fuzzy.
* **Chat P2P Diretta:** Finestra di dialogo istantanea per accordarsi sui dettagli dell'incontro.

### 4.2 La Città Viva & Mappa 3D Geospaziale (`LivingCityExplorer.tsx` & `GeographicMapBridge.tsx`)
* **Google 3D Tiles / WebGL Engine:** Visualizzazione tridimensionale interattiva della terra reale con render fotorealistico degli edifici e degli spazi urbani.
* **Pin Georeferenziati:** Nodi territoriali che mostrano visivamente le inserzioni e gli specialisti attivi nel raggio d'interesse.
* **Bacheca Urbana del Quartiere:** Finestra per consultare gli scambi attivi via per via, proteggendo la privacy dell'utente tramite raggio fuzzy (offset centroidale).

### 4.3 Universo Cosmico & Albero della Vita (`RealisticCosmicUniverse.tsx` & `TreeOfLifeExplorer.tsx`)
* Rappresentazione visuale delle relazioni umane e dei nodi di conoscenza sotto forma di rami e costellazioni.
* Ogni ramo rappresenta un ambito vitale (Possibilità, Vita Comunitaria, Memoria).

### 4.4 Guide e Memoria Collettiva (`SalvavatuttoPlanet.tsx`)
* Archivio permanente di guide pratiche, manuali fai-da-te, riparazioni artigianali e soluzioni collaudate dalla comunità per combattere l'obsolescenza programmata e valorizzare i saperi locali.

### 4.5 Assistente AI Discreto (`DiscreetAIAssistant.tsx`)
* Integrazione con `@google/genai` (SDK Gemini 2.5 Flash server-side).
* Supporto intelligente per la formulazione di scambi equi, suggerimento di categorie e supporto linguistico.

### 4.6 Blindatura Legale & Moderazione (`LegalShieldAndModeration.tsx` & `LegalWelcomeShield.tsx`)
* **Termini di Servizio P2P:** Esonero esplicito di responsabilità per la piattaforma (ruolo di mero bacheca/facilitatore tecnologico).
* **Scudo Sanitario:** Divieto tassativo di compravendita o prescrizione di farmaci, terapie o diagnosi mediche non autorizzate.
* **Protezione Privacy GDPR:** Nessun dato sensibile memorizzato senza consenso; anonimizzazione geografica.
* **Sistema Anti-Abuso:** Segnalazione immediata per comportamenti scorretti, violazioni deontologiche o tentativi di truffa.

### 4.7 Backup e Sincronizzazione Google Drive (`DriveExporter.tsx`)
* Possibilità per il titolare e gli utenti di esportare in qualsiasi momento il backup strutturato JSON e Markdown dei propri dati direttamente su Google Drive.

---

# 5. MODELLO ECONOMICO E INTEGRAZIONE PI NETWORK

### 5.1 Il Ruolo Esclusivo di Pi Network ($\pi$)
* **Zero Valute Fiat & Zero Commissioni Bancarie:** Tutte le transazioni monetarie interne avvengono unicamente tramite la blockchain Pi Network in valuta nativa $\pi$.
* **Scambio Puro Senza Intermediari:** Il baratto e la donazione sono esenti al 100% da qualsiasi costo o commissione.
* **Scudo Anti-AutoSponsorizzazione:** Gli annunci non possono essere "scalati" artificialmente pagando denaro; la visibilità è determinata dalla prossimità geografica, dalla freschezza dell'annuncio e dal rating di reputazione comunitaria.
* **Rete Specialisti Solidali:** Gli artigiani e i professionisti ottengono una vetrina gratuita permanente, con l'impegno di accettare Pi Coin o baratti solidali per una quota delle loro prestazioni.

---

# 6. DIPENDENZE TECNICHE E PACCHETTI SOFTWARE

Di seguito l'elenco analitico delle dipendenze presenti in `package.json`:

| Pacchetto | Versione | Ambito | Scopo e Motivazione Architetturale |
| :--- | :--- | :--- | :--- |
| `react` | `^19.0.1` | Frontend Core | Motore reattivo dell'applicazione |
| `react-dom` | `^19.0.1` | Frontend DOM | Render engine per il browser |
| `vite` | `^6.2.3` | Build Tool | Bundler iper-veloce e dev server su porta 3000 |
| `typescript` | `~5.8.2` | Compilatore | Tipizzazione statica e prevenzione bug a runtime |
| `@google/genai` | `^2.4.0` | Server AI | SDK moderno Gemini per l'Assistente Discreto |
| `tailwindcss` | `^4.1.14` | Styling | Framework CSS atomico per interfaccia responsive e pulita |
| `@tailwindcss/vite` | `^4.1.14` | Styling Plugin | Integrazione diretta di Tailwind v4 in Vite |
| `motion` | `^12.23.24` | Animazioni | Motore di transizioni layout fluide e modali |
| `three` | `^0.185.1` | 3D Engine | Rendering WebGL per Città Viva e Mappa 3D |
| `@types/three` | `^0.185.4` | Tipi 3D | Definizioni TypeScript per Three.js |
| `lucide-react` | `^0.546.0` | Icone | Libreria iconografica coerente |
| `express` | `^4.21.2` | Backend Server | Gateway API, proxy per chiavi e static serving |
| `jspdf` | `^4.2.1` | Documenti | Generazione client e server di documenti PDF |
| `html2canvas` | `^1.4.1` | Snapshot DOM | Rendering di porzioni di pagina per export grafico |
| `dotenv` | `^17.2.3` | Configurazione | Gestione sicura delle variabili d'ambiente |
| `tsx` | `^4.21.0` | Server Runtime | Esecuzione diretta di file TypeScript in ambiente Node |
| `esbuild` | `^0.25.0` | Bundler Server | Compilazione di server.ts in bundle autonomo CommonJS |

---

# 7. EVOLUZIONE CRONOLOGICA DEL CODICE E CHANGELOG STORICO

### Fase 1: Genesi Concettuale e Prototipazione (Progetto BIS)
* Nascita del concept orientato alla valorizzazione del tempo, delle competenze e del baratto.
* Definizione delle 9 forme di interazione libera (Aiuto, Dono, Prestito, Condivisione, Collaborazione, Conoscenza, Scambio, Servizio, Vendita).
* Primi schemi architetturali e stesura del manifesto "What you have → What you want".

### Fase 2: Consolidamento del Brand e Transizione in HAVE2WANT (H2W)
* Ridenominazione ufficiale in HAVE2WANT con tagline "Simply Discreet".
* Strutturazione dell'Albero della Vita e dei Pianeti della Conoscenza (Possibilità, Vita, Salvavatutto).
* Redazione e pubblicazione del documento maestro *HAVE2WANT Master Specification v1.0*.

### Fase 3: Architettura Geospaziale e Mappe 3D
* Implementazione del motore WebGL Three.js e del ponte con Google Earth 3D Tiles (`GeographicMapBridge.tsx`).
* Creazione del sistema di georeferenziazione fuzzy con protezione della privacy dell'indirizzo privato dei pionieri.
* Implementazione del modulo "Città Viva" (`LivingCityExplorer.tsx`) per visualizzare la bacheca integrata nello spazio urbano.

### Fase 4: Integrazione Pi Network e Blindatura Giuridica
* Creazione dell'infrastruttura Pi Official Bridge e dei modelli per pagamenti peer-to-peer in sole unità Pi ($\pi$).
* Redazione dello Scudo Legale, dell'Esonero P2P, della dichiarazione di conformità GDPR e dello Scudo Sanitario preventivo.
* Aggiunta della modale di accettazione obbligatoria dei termini (`LegalWelcomeShield.tsx`).

### Fase 5: Epurazione Architetturale e Normalizzazione degli Intenti
* Eliminazione di tutti i tipi astratti e ridondanti (`InteractionMode`, `ListingType`).
* Consolidamento definitivo nei 3 intenti chiari: `VENDO`, `BARATTO_SCAMBIO`, `ACQUISTO_CERCO`.
* Allineamento di tutti i componenti alla tassonomia merceologica reale (`src/categories.ts`).
* Risoluzione al 100% degli errori di compilazione e linter TypeScript (`tsc --noEmit`).

### Fase 6: Realizzazione della Bacheca Home P2P (`HomeFeedView.tsx`)
* Implementazione della nuova vista principale di atterraggio per rendere l'esperienza utente immediata, chiara e ordinata.
* Visualizzazione a schede con foto, localizzazione geografica, badge di reputazione a 5 stelle e prezzo in Pi Coin / Baratto.
* Filtri rapidi con contatori dinamici, modale di pubblicazione annunci semplificata e chat P2P integrata.
* Generazione della presente specifica tecnica completa in formato PDF e Markdown scaricabile.

---
*Fine del Documento di Specifiche Tecniche — HAVE2WANT Project*
