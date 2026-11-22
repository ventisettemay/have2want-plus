#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HAVE2WANT - Estrattore e Generatore Specifiche Tecniche Complete
Genera:
1. /public/specifiche_tecniche_progetto.pdf
2. /public/specifiche_tecniche_progetto.md
3. /public/specifiche_tecniche_progetto.html
4. ./specifiche_tecniche_progetto.pdf
"""

import os
import json
import subprocess

MD_CONTENT = """# HAVE2WANT — SPECIFICHE TECNICHE COMPLETE DEL PROGETTO
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
* **3D Visual Engine:** Three.js (WebGL Canvas rendering per Globo 3D, Urbano 3D, Orbit Controls, Shader e particellari)
* **Data Visualization & GIS:** Integrazione con MapLibre GL, OSRM routing, mappe geospaziali e bacheche radar georeferenziate

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

### 4.2 Interfaccia Territoriale 3D (`Globo3D.jsx`, `Urbano3D.jsx`, `MapView3DContainer.jsx`)
* **Globo 3D (Three.js):** Vista macroscopica della Terra con orbite satelliti operative, geo-privacy basata su centroide comunale (raggio 2–2,5 km), rendering 60fps ottimizzato per mobile.
* **Mappa Urbano 3D (MapLibre GL + OSRM):** Navigazione territoriale stradale, routing reale, pin georeferenziati annunci e specialisti, layer satelliti toggle ON/OFF.
* **Bacheca Territoriale Integrata:** HomeFeedView sincronizzata con vista mappa, filtro raggio 1–50 km, clustering annunci per performance.

### 4.3 11 Satelliti Operativi (`OrbitalSatellitesHub.tsx`, `satelliteModularEngine.ts`)
* Canali territoriali con toggle persistente, preset (SOLO_TERRITORIO, ESPLORAZIONE, LAVORO, EMERGENZA), filtro raggio dinamico.
* Satelliti: METEO (Open-Meteo), KM0 (produttori locali), WEBCAM (traffico/meteo), METEO_NAV (meteo lungo percorso), CHAT (stanze territoriali), MARKETPLACE (vetrine), CONOSCENZE_MESTIERI (archivio guide), BUSINESS_ADS (vetrine professionali), ACTION_FLOW (patto/mano), PI_ADS (circuito ufficiale), REWARDS (punti fedeltà).

### 4.4 Assistente AI Discreto (`DiscreetAIAssistant.tsx`)
* Integrazione con `@google/genai` (SDK Gemini 2.5 Flash server-side).
* Correlazione semantica discreta tra dialoghi, annunci HAVE/WANT e archivio Conoscenze & Mestieri.
* Indicatori contestuali non invasivi, zero "Stella delle Possibilità".

### 4.5 Backup e Sincronizzazione Google Drive (`DriveExporter.tsx`)
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
| `three` | `^0.185.1` | 3D Engine | Rendering WebGL per Globo 3D, Urbano 3D |
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
* Redazione e pubblicazione del documento maestro *HAVE2WANT Master Specification v1.0*.

### Fase 3: Architettura Territoriale 3D e Satelliti Operativi
* Implementazione del motore WebGL Three.js (Globo 3D) e integrazione MapLibre GL (Urbano 3D) con routing OSRM reale.
* Creazione del sistema di geo-privacy (centroide comunale, raggio 2–2,5 km) e bacheca territoriale integrata.
* Implementazione dei 11 Satelliti Operativi con canali territoriali, toggle persistente e preset contestuali.

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
"""

def main():
    print("=== AVVIO GENERAZIONE SPECIFICHE TECNICHE COMPLETE ===")
    
    # Assicuriamo l'esistenza delle directory
    os.makedirs("public", exist_ok=True)
    
    # 1. Scrittura del file Markdown
    md_path_public = os.path.join("public", "specifiche_tecniche_progetto.md")
    md_path_root = "specifiche_tecniche_progetto.md"
    
    with open(md_path_public, "w", encoding="utf-8") as f:
        f.write(MD_CONTENT)
    with open(md_path_root, "w", encoding="utf-8") as f:
        f.write(MD_CONTENT)
    print(f"✓ File Markdown generato con successo: {md_path_public} e {md_path_root}")

    # 2. Scrittura del file HTML elegante per anteprima e stampa
    html_content = f"""<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAVE2WANT — Specifiche Tecniche Complete del Progetto</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    :root {{
      --primary: #f59e0b;
      --primary-dark: #d97706;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --emerald: #10b981;
      --sky: #0ea5e9;
    }}

    @page {{
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.6;
      font-size: 13.5px;
      padding: 30px;
    }}

    .header-box {{
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 24px;
      border-left: 6px solid #f59e0b;
    }}

    .header-box h1 {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 6px;
    }}

    .header-box h2 {{
      font-size: 14px;
      font-weight: 600;
      color: #f59e0b;
      margin-bottom: 12px;
    }}

    .meta-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;
      color: #cbd5e1;
      border-top: 1px solid #334155;
      padding-top: 12px;
      margin-top: 8px;
    }}

    .meta-item strong {{
      color: #ffffff;
    }}

    h1, h2, h3, h4 {{
      color: #0f172a;
      font-weight: 800;
    }}

    h1 {{
      font-size: 18px;
      margin-top: 28px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      color: #0f172a;
    }}

    h2 {{
      font-size: 15px;
      margin-top: 20px;
      margin-bottom: 8px;
      color: #1e293b;
    }}

    h3 {{
      font-size: 13.5px;
      margin-top: 14px;
      margin-bottom: 6px;
      color: #334155;
    }}

    p {{
      margin-bottom: 10px;
      color: #334155;
      text-align: justify;
    }}

    ul, ol {{
      margin-left: 20px;
      margin-bottom: 12px;
      color: #334155;
    }}

    li {{
      margin-bottom: 4px;
    }}

    code {{
      font-family: 'JetBrains Mono', monospace;
      background: #f1f5f9;
      color: #b45309;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 11.5px;
      border: 1px solid #e2e8f0;
    }}

    pre {{
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      overflow-x: auto;
      margin: 12px 0;
      border: 1px solid #1e293b;
    }}

    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }}

    th, td {{
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }}

    th {{
      background-color: #f8fafc;
      font-weight: 700;
      color: #0f172a;
    }}

    tr:nth-child(even) {{
      background-color: #f8fafc;
    }}

    .badge {{
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10.5px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }}

    .badge-vendo {{
      background: #dcfce7;
      color: #15803d;
    }}

    .badge-baratto {{
      background: #fef3c7;
      color: #b45309;
    }}

    .badge-cerco {{
      background: #e0f2fe;
      color: #0369a1;
    }}

    .page-break {{
      page-break-after: always;
    }}

    .download-bar {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}

    .btn {{
      background: #f59e0b;
      color: #0f172a;
      font-weight: 800;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}

    @media print {{
      body {{
        padding: 0;
      }}
      .download-bar {{
        display: none;
      }}
    }}
  </style>
</head>
<body>

  <div class="download-bar">
    <div>
      <strong>Specifiche Tecniche Ufficiali HAVE2WANT</strong> — Pronto per download e conservazione
    </div>
    <a href="/specifiche_tecniche_progetto.pdf" download class="btn">
      ⬇ Scarica File PDF Diretto
    </a>
  </div>

  <div class="header-box">
    <h1>HAVE2WANT — SPECIFICHE TECNICHE COMPLETE</h1>
    <h2>Documento Ufficiale di Architettura, Modello Dati, Frontend, Backend, Dipendenze ed Evoluzione del Codice</h2>
    <div class="meta-grid">
      <div class="meta-item"><strong>Denominazione Ufficiale:</strong> HAVE2WANT (H2W)</div>
      <div class="meta-item"><strong>Denominazione di Genesi:</strong> BIS</div>
      <div class="meta-item"><strong>Principio Guida:</strong> What you have → What you want</div>
      <div class="meta-item"><strong>Tagline:</strong> Simply Discreet</div>
      <div class="meta-item"><strong>Titolare del Progetto:</strong> brandoriginalword@gmail.com</div>
      <div class="meta-item"><strong>Data di Consolidamento:</strong> 2 Settembre 2026</div>
    </div>
  </div>

  <h1>1. Origine, Visione e Principi Guida</h1>
  <h3>1.1 Genesi e Transizione BIS &rarr; HAVE2WANT</h3>
  <p>
    Il progetto nasce originariamente con il nome in codice provvisorio <strong>BIS</strong>, concepito per ridefinire radicalmente i paradigmi di interazione umana ed economica nel contesto digitale contemporaneo. Nei marketplace tradizionali e nelle piattaforme di annunci convenzionali, l'utente è ridotto a una mera controparte transazionale, sottoposto a tracciamento aggressivo, intermediazione speculativa, commissioni percentuali invasive e continue sollecitazioni commerciali algoritmiche.
  </p>
  <p>
    La transizione nominale ed evolutiva da <strong>BIS</strong> a <strong>HAVE2WANT (H2W)</strong> ha consolidato la visione fondativa in un'architettura completa basata su tre pilastri:
  </p>
  <ul>
    <li><strong>Centralità della Persona e della Comunità:</strong> La piattaforma non spinge all'acquisto compulsivo, ma crea lo spazio per far emergere spontaneamente bisogni materiali, immateriali, saperi, talenti e disponibilità.</li>
    <li><strong>What you have &rarr; What you want:</strong> In ogni collettività, ciascun individuo possiede risorse, strumenti, competenze o tempo (HAVE) che possono essere di vitale utilità per un altro individuo; specularmente, chiunque può trovarsi in una condizione temporanea di necessità (WANT).</li>
    <li><strong>Simply Discreet (L'Assistente Discreto):</strong> L'intelligenza artificiale e la tecnologia operano come mediatori silenziosi ed empatici, non come guardoni digitali o motori pubblicitari invasivi.</li>
  </ul>

  <h1>2. Architettura di Sistema e Paradigma Tecnologico</h1>
  <p>
    L'applicazione è strutturata secondo una solida architettura <strong>Single Page Application (SPA) Reattiva</strong> basata su standard moderni del Web, con un layer server Node.js/Express per l'orchestrazione sicura delle API, dei servizi di intelligenza artificiale server-side e del routing verso i Google 3D Tiles geospaziali.
  </p>
  <ul>
    <li><strong>Core Runtime:</strong> Node.js (Ambiente Container Cloud Run / Sandboxed AI Studio su Porta 3000)</li>
    <li><strong>Linguaggio Primario:</strong> TypeScript 5.8+ (Strict Type Checking, Zero Any, compilazione tipizzata)</li>
    <li><strong>Frontend Framework:</strong> React 19 (Hooks, Concurrent Rendering, Suspense, State Management Reattivo)</li>
    <li><strong>Build Tool & Bundler:</strong> Vite 6.2+ con Hot Module Replacement controllato</li>
    <li><strong>Styling & Design System:</strong> Tailwind CSS v4 (Design Tokens, Palette Neutri Caldi e Freddi, Micro-Interazioni)</li>
    <li><strong>Animation Engine:</strong> Motion (motion/react v12) con transizioni layout fluide</li>
    <li><strong>3D Visual Engine:</strong> Three.js (WebGL Canvas rendering per Città 3D, Orbit Controls, Shader e particellari)</li>
    <li><strong>Data Visualization & GIS:</strong> Integrazione con Google Earth 3D Tiles, mappe geospaziali e bacheche radar georeferenziate</li>
  </ul>

  <h1>3. Modello Dati e Schemi TypeScript (Data Layer)</h1>
  <p>
    Il file <code>src/types.ts</code> costituisce l'ontologia rigorosa di tutti i tipi e le strutture dati dell'applicazione.
  </p>
  <h3>3.1 I Tre Intenti Rigidi Operativi (InteractionIntent)</h3>
  <pre><code>export type InteractionIntent = 
  | 'VENDO'             // Vendita regolata esclusivamente in Pi Coin (π)
  | 'BARATTO_SCAMBIO'   // Scambio merceologico diretto, baratto paritario o scambio di tempo
  | 'ACQUISTO_CERCO';   // Annuncio di ricerca e fabbisogno per beni o servizi desiderati</code></pre>

  <h3>3.2 L'Entità Annuncio Principale (HaveWantListing)</h3>
  <pre><code>export interface HaveWantListing {{
  id: string;
  intent: InteractionIntent;
  title: string;
  description: string;
  category: RealCategoryKey;
  subcategory: RealSubcategoryKey;
  piPrice: number; // Obbligatorio e > 0 se intent === 'VENDO', 0 per baratto/cerco
  concreteExchange?: {{
    offer?: {{ item: string; quantity: number; unit: string; condition?: string; }};
    wanted?: {{ item: string; quantity: number; unit: string; }};
    territorialScope?: 'stesso_quartiere' | 'citta_area' | 'provincia' | 'nazionale';
  }};
  author: {{
    name: string;
    username: string;
    avatar: string;
    reputation: number;
    isPioneerVerified: boolean;
    city: string;
    province?: string;
  }};
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
}}</code></pre>

  <h3>3.3 Tassonomia Merceologica e Categorie Reali (<code>src/categories.ts</code>)</h3>
  <ol>
    <li><strong><code>casa_fai_da_te</code>:</strong> Arredamento e Mobili, Elettrodomestici, Utensileria e Attrezzi, Giardinaggio, Materiali Edili.</li>
    <li><strong><code>auto_moto_veicoli</code>:</strong> Automobili, Scooter e Moto, Biciclette, Monopattini e Mobilità Elettrica, Ricambi e Accessori.</li>
    <li><strong><code>elettronica_informatica</code>:</strong> Smartphone e Tablet, Computer e Laptop, Componenti Hardware, Fotografia, Audio e Video.</li>
    <li><strong><code>libri_scuola_cultura</code>:</strong> Libri Scolastici, Saggistica e Narrativa, Fumetti e Collezionismo, Strumenti Musicali, Materiale Didattico.</li>
    <li><strong><code>servizi_lavoro_buoni</code>:</strong> Riparazioni e Manutenzioni, Lezioni e Ripetizioni, Assistenza Informatica, Aiuto Domestico e Traslochi.</li>
    <li><strong><code>abbigliamento_accessori</code>:</strong> Abbigliamento Uomo/Donna, Scarpe e Calzature, Accessori e Borse, Abbigliamento Bambino.</li>
    <li><strong><code>rete_specialisti_supporto</code>:</strong> Professionisti Solidali, Artigiani di Fiducia, Consulenze Tecniche a Vetrina Gratuita.</li>
  </ol>

  <h1>4. Frontend, Componenti e Moduli Funzionali</h1>
  <h3>4.1 Bacheca Home P2P (<code>HomeFeedView.tsx</code>)</h3>
  <p>
    La nuova vista principale offre una bacheca pulita, ordinata e fruibile su qualsiasi dispositivo: griglia prodotti responsive, visualizzazione immediata dei prezzi in Pi Coin (<span class="badge badge-vendo">VENDO</span>), delle proposte di baratto (<span class="badge badge-baratto">BARATTO</span>) e delle ricerche (<span class="badge badge-cerco">CERCO</span>). Include filtri territoriali per provincia, categorie e modale di pubblicazione annunci rapida.
  </p>

  <h3>4.2 Interfaccia Territoriale 3D (<code>Globo3D.jsx</code>, <code>Urbano3D.jsx</code>, <code>MapView3DContainer.jsx</code>)</h3>
  <p>
    Globo 3D (Three.js) con vista macroscopica, orbite satelliti e geo-privacy (centroide comunale). Mappa Urbano 3D (MapLibre GL + OSRM) con routing reale, pin georeferenziati, layer satelliti toggle ON/OFF. Bacheca territoriale integrata con filtro raggio 1–50 km.
  </p>

  <h3>4.3 11 Satelliti Operativi (<code>OrbitalSatellitesHub.tsx</code>, <code>satelliteModularEngine.ts</code>)</h3>
  <p>
    Canali territoriali con toggle persistente, preset (SOLO_TERRITORIO, ESPLORAZIONE, LAVORO, EMERGENZA). Satelliti: METEO, KM0, WEBCAM, METEO_NAV, CHAT, MARKETPLACE, CONOSCENZE_MESTIERI, BUSINESS_ADS, ACTION_FLOW, PI_ADS, REWARDS.
  </p>

  <h3>4.4 Assistente AI Discreto (<code>DiscreetAIAssistant.tsx</code>)</h3>
  <p>
    Correlazione semantica discreta tra dialoghi, annunci HAVE/WANT e archivio Conoscenze & Mestieri. Indicatori contestuali non invasivi, zero "Stella delle Possibilità".
  </p>

  <h3>4.5 Backup e Sincronizzazione Google Drive (<code>DriveExporter.tsx</code>)</h3>
  <p>
    Esportazione backup strutturato JSON e Markdown dei propri dati direttamente su Google Drive.
  </p>

  <h1>5. Modello Economico e Integrazione Pi Network</h1>
  <ul>
    <li><strong>Valuta Nativa Pi Network (&pi;):</strong> Regolamento delle transazioni monetarie esclusivamente in Pi Coin, senza commissioni bancarie né percentuali di piattaforma.</li>
    <li><strong>Baratto Gratuito:</strong> Scambio merceologico e banca del tempo 100% liberi e gratuiti.</li>
    <li><strong>Scudo Anti-AutoSponsorizzazione:</strong> Visibilità basata unicamente su prossimità territoriale, freschezza e reputazione, non su sponsorizzazioni a pagamento.</li>
    <li><strong>Rete Specialisti Solidali:</strong> Vetrina promozionale gratuita per professionisti e artigiani disponibili ad accettare Pi o scambi etici.</li>
  </ul>

  <h1>6. Dipendenze Tecniche e Stack Software</h1>
  <table>
    <thead>
      <tr>
        <th>Pacchetto</th>
        <th>Versione</th>
        <th>Ambito</th>
        <th>Scopo Architetturale</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>react</code> / <code>react-dom</code></td>
        <td><code>^19.0.1</code></td>
        <td>Frontend</td>
        <td>Core reattivo e Concurrent Rendering</td>
      </tr>
      <tr>
        <td><code>vite</code></td>
        <td><code>^6.2.3</code></td>
        <td>Build Tool</td>
        <td>Bundler rapido e dev server porta 3000</td>
      </tr>
      <tr>
        <td><code>typescript</code></td>
        <td><code>~5.8.2</code></td>
        <td>Linguaggio</td>
        <td>Tipizzazione statica e Type Safety</td>
      </tr>
      <tr>
        <td><code>@google/genai</code></td>
        <td><code>^2.4.0</code></td>
        <td>AI Backend</td>
        <td>SDK Gemini 2.5 per l'Assistente Discreto</td>
      </tr>
      <tr>
        <td><code>tailwindcss</code> / <code>@tailwindcss/vite</code></td>
        <td><code>^4.1.14</code></td>
        <td>Styling</td>
        <td>Design System atomico e layout fluidi</td>
      </tr>
      <tr>
        <td><code>motion</code></td>
        <td><code>^12.23.24</code></td>
        <td>Animazioni</td>
        <td>Transizioni di stato e modali fluide</td>
      </tr>
      <tr>
        <td><code>three</code> / <code>@types/three</code></td>
        <td><code>^0.185.1</code></td>
        <td>3D Engine</td>
        <td>WebGL Canvas per Città Viva e Mappa 3D</td>
      </tr>
      <tr>
        <td><code>lucide-react</code></td>
        <td><code>^0.546.0</code></td>
        <td>Iconografia</td>
        <td>Icone SVG coerenti e leggere</td>
      </tr>
      <tr>
        <td><code>express</code></td>
        <td><code>^4.21.2</code></td>
        <td>Backend</td>
        <td>Gateway API e static file serving</td>
      </tr>
      <tr>
        <td><code>jspdf</code></td>
        <td><code>^4.2.1</code></td>
        <td>Documenti</td>
        <td>Generazione e download PDF</td>
      </tr>
    </tbody>
  </table>

  <h1>7. Evoluzione Cronologica del Codice e Changelog</h1>
  <ul>
    <li><strong>Fase 1 (Progetto BIS):</strong> Genesi concettuale, definizione delle 9 forme di interazione libera e modello ontologico HAVE/WANT.</li>
    <li><strong>Fase 2 (Transizione HAVE2WANT):</strong> Consolidamento brand e redazione Master Specification v1.0.</li>
    <li><strong>Fase 3 (Architettura Territoriale 3D & Satelliti):</strong> Motore Three.js (Globo 3D), MapLibre GL (Urbano 3D) con OSRM, geo-privacy centroide comunale, 11 Satelliti Operativi con canali territoriali.</li>
    <li><strong>Fase 4 (Pi Network & Blindatura Giuridica):</strong> Integrazione Pi Official Bridge, Esonero P2P, Scudo Sanitario e Welcome Shield.</li>
    <li><strong>Fase 5 (Epurazione Tipi e Normalizzazione):</strong> Rimozione modalità astratte e consolidamento nei 3 intenti rigidi (VENDO, BARATTO_SCAMBIO, ACQUISTO_CERCO).</li>
    <li><strong>Fase 6 (Bacheca Home P2P & Release Consolidata):</strong> Nuova interfaccia HomeFeedView con griglia prodotti responsive, filtri territoriali e generatore PDF delle specifiche tecniche.</li>
  </ul>

</body>
</html>
"""
    
    html_path_public = os.path.join("public", "specifiche_tecniche_progetto.html")
    with open(html_path_public, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"✓ File HTML generato con successo: {html_path_public}")

    # 3. Generazione del PDF tramite script Node.js con jsPDF
    node_script = """
const { jsPDF } = require('jspdf');
const fs = require('fs');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 15;
const contentWidth = pageWidth - (margin * 2);
let currentY = 18;

function checkPageBreak(requiredHeight) {
  if (currentY + requiredHeight > pageHeight - 20) {
    doc.addPage();
    currentY = 18;
    drawHeaderFooter();
  }
}

function drawHeaderFooter() {
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 160);
  doc.text("HAVE2WANT — SPECIFICHE TECNICHE COMPLETE DEL PROGETTO", margin, 10);
  doc.text("Pagina " + doc.internal.getNumberOfPages(), pageWidth - margin - 20, 10);
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, 12, pageWidth - margin, 12);
  
  // Footer
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text("Documento Riservato • Titolare: brandoriginalword@gmail.com • Data: 02/09/2026", margin, pageHeight - 8);
}

// FIRST PAGE HEADER
doc.setFillColor(15, 23, 42); // slate-900
doc.roundedRect(margin, currentY, contentWidth, 36, 3, 3, 'F');

doc.setDrawColor(245, 158, 11); // amber-500
doc.setLineWidth(1.5);
doc.line(margin + 2, currentY + 3, margin + 2, currentY + 33);

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.setTextColor(255, 255, 255);
doc.text("HAVE2WANT — SPECIFICHE TECNICHE COMPLETE", margin + 6, currentY + 10);

doc.setFontSize(10);
doc.setTextColor(245, 158, 11);
doc.text("Documento Ufficiale di Architettura, Modello Dati, Frontend, Backend ed Evoluzione", margin + 6, currentY + 17);

doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(203, 213, 225);
doc.text("Genesi Originaria: BIS | Titolare: brandoriginalword@gmail.com | Data: 2 Settembre 2026", margin + 6, currentY + 24);
doc.text("Principio Guida: What you have -> What you want | Tagline: Simply Discreet", margin + 6, currentY + 30);

currentY += 44;

function addSectionTitle(title) {
  checkPageBreak(16);
  currentY += 4;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin + 3, currentY + 5.5);
  currentY += 12;
}

function addSubSectionTitle(title) {
  checkPageBreak(10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(title, margin, currentY);
  currentY += 5;
}

function addParagraph(text) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, contentWidth);
  checkPageBreak(lines.length * 4.2 + 2);
  doc.text(lines, margin, currentY);
  currentY += lines.length * 4.2 + 3;
}

function addBullet(bulletTitle, bulletDesc) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const fullText = "• " + bulletTitle + (bulletDesc ? ": " + bulletDesc : "");
  const lines = doc.splitTextToSize(fullText, contentWidth - 4);
  checkPageBreak(lines.length * 4 + 1);
  doc.text(lines, margin + 2, currentY);
  currentY += lines.length * 4 + 2;
}

function addCodeBlock(code) {
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  const lines = doc.splitTextToSize(code, contentWidth - 8);
  const blockHeight = lines.length * 3.4 + 6;
  checkPageBreak(blockHeight);
  
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, blockHeight, 2, 2, 'F');
  
  doc.setTextColor(248, 250, 252);
  doc.text(lines, margin + 4, currentY + 4.5);
  currentY += blockHeight + 4;
}

// 1. ORIGINI E VISIONE
addSectionTitle("1. ORIGINE, VISIONE E PRINCIPI GUIDA");
addSubSectionTitle("1.1 Genesi e Transizione BIS -> HAVE2WANT");
addParagraph("Il progetto nasce originariamente con il nome in codice provvisorio BIS, concepito per ridefinire radicalmente i paradigmi di interazione umana ed economica nel contesto digitale contemporaneo. Nei marketplace tradizionali e nelle piattaforme di annunci convenzionali, l'utente e ridotto a una mera controparte transazionale, sottoposto a tracciamento aggressivo, intermediazione speculativa, commissioni percentuali invasive e continue sollecitazioni commerciali algoritmiche.");
addParagraph("La transizione nominale ed evolutiva da BIS a HAVE2WANT (H2W) ha consolidato la visione fondativa in un'architettura completa:");
addBullet("Centralita della Persona e della Comunita", "La piattaforma non spinge all'acquisto compulsivo, ma crea lo spazio per far emergere spontaneamente bisogni materiali, immateriali, saperi, talenti e disponibilita.");
addBullet("What you have -> What you want", "In ogni collettivita, ciascun individuo possiede risorse, strumenti, competenze o tempo (HAVE) che possono essere di vitale utilita per un altro individuo; specularmente, chiunque puo trovarsi in una condizione temporanea di necessita (WANT).");
addBullet("Simply Discreet (L'Assistente Discreto)", "L'intelligenza artificiale e la tecnologia operano come mediatori silenziosi ed empatici, non come guardoni digitali o motori pubblicitari invasivi.");

// 2. ARCHITETTURA DI SISTEMA
addSectionTitle("2. ARCHITETTURA DI SISTEMA E PARADIGMA TECNOLOGICO");
addParagraph("L'applicazione e strutturata secondo una solida architettura Single Page Application (SPA) Reattiva basata su standard moderni del Web, con un layer server Node.js/Express per l'orchestrazione sicura delle API, dei servizi di intelligenza artificiale server-side e del routing verso i Google 3D Tiles geospaziali.");
addBullet("Core Runtime", "Node.js (Ambiente Container Cloud Run / Sandboxed AI Studio su Porta 3000)");
addBullet("Linguaggio Primario", "TypeScript 5.8+ (Strict Type Checking, Zero Any, compilazione tipizzata)");
addBullet("Frontend Framework", "React 19 (Hooks, Concurrent Rendering, Suspense, State Management Reattivo)");
addBullet("Build Tool & Bundler", "Vite 6.2+ con Hot Module Replacement controllato");
addBullet("Styling & Design System", "Tailwind CSS v4 (Design Tokens, Palette Neutri Caldi e Freddi, Micro-Interazioni)");
addBullet("Animation Engine", "Motion (motion/react v12) con transizioni layout fluide");
addBullet("3D Visual Engine", "Three.js (WebGL Canvas rendering per Citta 3D, Orbit Controls, Shader e particellari)");
addBullet("Data Visualization & GIS", "Integrazione con Google Earth 3D Tiles, mappe geospaziali e bacheche radar georeferenziate");

// 3. MODELLO DATI E SCHEMI TYPESCRIPT
addSectionTitle("3. MODELLO DATI E SCHEMI TYPESCRIPT (DATA LAYER)");
addSubSectionTitle("3.1 I Tre Intenti Rigidi Operativi (InteractionIntent)");
addCodeBlock(
`export type InteractionIntent =\\n` +
`  | 'VENDO'             // Vendita regolata esclusivamente in Pi Coin (pi)\\n` +
`  | 'BARATTO_SCAMBIO'   // Scambio merceologico diretto, baratto paritario o tempo\\n` +
`  | 'ACQUISTO_CERCO';   // Annuncio di ricerca e fabbisogno per beni o servizi`
);

addSubSectionTitle("3.2 L'Entita Annuncio Principale (HaveWantListing)");
addCodeBlock(
`export interface HaveWantListing {\\n` +
`  id: string;\\n` +
`  intent: InteractionIntent;\\n` +
`  title: string;\\n` +
`  description: string;\\n` +
`  category: RealCategoryKey;\\n` +
`  subcategory: RealSubcategoryKey;\\n` +
`  piPrice: number; // Obbligatorio e > 0 se intent === 'VENDO', 0 per baratto/cerco\\n` +
`  concreteExchange?: {\\n` +
`    offer?: { item: string; quantity: number; unit: string; condition?: string; };\\n` +
`    wanted?: { item: string; quantity: number; unit: string; };\\n` +
`    territorialScope?: 'stesso_quartiere' | 'citta_area' | 'provincia' | 'nazionale';\\n` +
`  };\\n` +
`  author: { name: string; username: string; avatar: string; reputation: number; city: string; };\\n` +
`  lat: number; lng: number; locationArea: string; isFuzzyLocation?: boolean;\\n` +
`  imageUrl?: string; createdAt: string; tags: string[]; status: 'active' | 'matched';\\n` +
`}`
);

addSubSectionTitle("3.3 Tassonomia Merceologica e Categorie Reali");
addBullet("casa_fai_da_te", "Arredamento e Mobili, Elettrodomestici, Utensileria e Attrezzi, Giardinaggio, Materiali Edili");
addBullet("auto_moto_veicoli", "Automobili, Scooter e Moto, Biciclette, Monopattini e E-Mobility, Ricambi e Accessori");
addBullet("elettronica_informatica", "Smartphone e Tablet, Computer e Laptop, Componenti Hardware, Fotografia, Audio/Video");
addBullet("libri_scuola_cultura", "Libri Scolastici, Saggistica e Narrativa, Fumetti, Strumenti Musicali, Didattica");
addBullet("servizi_lavoro_buoni", "Riparazioni e Manutenzioni, Lezioni, Assistenza Informatica, Aiuto Domestico");
addBullet("abbigliamento_accessori", "Abbigliamento Uomo/Donna/Bambino, Scarpe, Borse e Accessori");
addBullet("rete_specialisti_supporto", "Professionisti Solidali, Artigiani di Fiducia, Consulenze Tecniche a Vetrina Gratuita");

// 4. FRONTEND E COMPONENTI
addSectionTitle("4. FRONTEND, COMPONENTI E MODULI FUNZIONALI");
addSubSectionTitle("4.1 Bacheca Home P2P (HomeFeedView.tsx)");
addParagraph("La nuova vista principale offre una bacheca pulita e reattiva: griglia prodotti responsive, visualizzazione immediata dei prezzi in Pi Coin (VENDO), delle proposte di baratto (BARATTO) e delle ricerche (CERCO). Include filtri territoriali per provincia, categorie e modale di pubblicazione annunci rapida.");

addSubSectionTitle("4.2 Interfaccia Territoriale 3D (Globo3D.jsx, Urbano3D.jsx, MapView3DContainer.jsx)");
addParagraph("Globo 3D (Three.js) con vista macroscopica, orbite satelliti e geo-privacy (centroide comunale). Mappa Urbano 3D (MapLibre GL + OSRM) con routing reale, pin georeferenziati, layer satelliti toggle ON/OFF. Bacheca territoriale integrata con filtro raggio 1-50 km.");

addSubSectionTitle("4.3 11 Satelliti Operativi (OrbitalSatellitesHub.tsx, satelliteModularEngine.ts)");
addParagraph("Canali territoriali con toggle persistente, preset (SOLO_TERRITORIO, ESPLORAZIONE, LAVORO, EMERGENZA). Satelliti: METEO, KM0, WEBCAM, METEO_NAV, CHAT, MARKETPLACE, CONOSCENZE_MESTIERI, BUSINESS_ADS, ACTION_FLOW, PI_ADS, REWARDS.");

addSubSectionTitle("4.4 Assistente AI Discreto (DiscreetAIAssistant.tsx)");
addParagraph("Correlazione semantica discreta tra dialoghi, annunci HAVE/WANT e archivio Conoscenze & Mestieri. Indicatori contestuali non invasivi, zero Stella delle Possibilita.");

addSubSectionTitle("4.5 Backup e Sincronizzazione Google Drive (DriveExporter.tsx)");
addParagraph("Esportazione backup strutturato JSON e Markdown dei propri dati direttamente su Google Drive.");

// 5. MODELLO ECONOMICO PI NETWORK
addSectionTitle("5. MODELLO ECONOMICO E INTEGRAZIONE PI NETWORK");
addBullet("Valuta Nativa Pi Network (pi)", "Regolamento delle transazioni monetarie esclusivamente in Pi Coin, senza commissioni bancarie ne percentuali di piattaforma.");
addBullet("Baratto Gratuito", "Scambio merceologico e banca del tempo 100% liberi e gratuiti.");
addBullet("Scudo Anti-AutoSponsorizzazione", "Visibilita basata unicamente su prossimita territoriale, freschezza e reputazione, non su sponsorizzazioni a pagamento.");
addBullet("Rete Specialisti Solidali", "Vetrina promozionale gratuita per professionisti e artigiani disponibili ad accettare Pi o scambi etici.");

// 6. DIPENDENZE TECNICHE
addSectionTitle("6. DIPENDENZE TECNICHE E STACK SOFTWARE");
addBullet("react / react-dom (^19.0.1)", "Core reattivo e Concurrent Rendering di ultima generazione.");
addBullet("vite (^6.2.3)", "Bundler rapido, static server e proxy su porta 3000.");
addBullet("typescript (~5.8.2)", "Tipizzazione statica e Type Safety sull'intera base di codice.");
addBullet("@google/genai (^2.4.0)", "SDK Gemini 2.5 per l'Assistente Discreto server-side.");
addBullet("tailwindcss (^4.1.14)", "Design System atomico, dark mode e responsive layout.");
addBullet("motion (^12.23.24)", "Transizioni fluide di layout e animazioni reattive.");
addBullet("three / @types/three (^0.185.1)", "WebGL 3D Rendering per Citta Viva e Mappa Geospaziale.");
addBullet("lucide-react (^0.546.0)", "Iconografia vettoriale moderna.");
addBullet("express (^4.21.2)", "Server backend per API routes e gestione dei pacchetti.");
addBullet("jspdf (^4.2.1)", "Generazione dinamica e download di documenti PDF.");

// 7. EVOLUZIONE CRONOLOGICA E CHANGELOG
addSectionTitle("7. EVOLUZIONE CRONOLOGICA DEL CODICE E CHANGELOG");
addBullet("Fase 1 (Progetto BIS)", "Genesi concettuale, definizione delle 9 forme di interazione libera e modello ontologico HAVE/WANT.");
addBullet("Fase 2 (Transizione HAVE2WANT)", "Consolidamento brand e redazione Master Specification v1.0.");
addBullet("Fase 3 (Architettura Territoriale 3D & Satelliti)", "Motore Three.js (Globo 3D), MapLibre GL (Urbano 3D) con OSRM, geo-privacy centroide comunale, 11 Satelliti Operativi con canali territoriali.");
addBullet("Fase 4 (Pi Network & Blindatura Giuridica)", "Integrazione Pi Official Bridge, Esonero P2P, Scudo Sanitario e Welcome Shield.");
addBullet("Fase 5 (Epurazione Tipi e Normalizzazione)", "Rimozione modalita astratte e consolidamento nei 3 intenti rigidi (VENDO, BARATTO_SCAMBIO, ACQUISTO_CERCO).");
addBullet("Fase 6 (Bacheca Home P2P & Release Consolidata)", "Nuova interfaccia HomeFeedView con griglia prodotti responsive, filtri territoriali e generatore PDF delle specifiche tecniche.");

// Save Document
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 160);
  doc.text("HAVE2WANT — SPECIFICHE TECNICHE COMPLETE DEL PROGETTO", margin, 10);
  doc.text("Pagina " + i + " di " + totalPages, pageWidth - margin - 22, 10);
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, 12, pageWidth - margin, 12);
  
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.text("Documento Riservato • Titolare: brandoriginalword@gmail.com • Data: 02/09/2026", margin, pageHeight - 8);
}

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('public/specifiche_tecniche_progetto.pdf', pdfBuffer);
fs.writeFileSync('specifiche_tecniche_progetto.pdf', pdfBuffer);
console.log('✓ File PDF generato con successo: public/specifiche_tecniche_progetto.pdf e ./specifiche_tecniche_progetto.pdf (Totale Pagine:', totalPages, ')');
""";
    
    with open("generate_pdf.cjs", "w", encoding="utf-8") as f:
        f.write(node_script)
    
    print("Esecuzione generatore PDF Node.js...")
    result = subprocess.run(["node", "generate_pdf.cjs"], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("Errori / Log stderr:", result.stderr)

    print("=== COMPLETAMENTO CON SUCCESSO ===")

if __name__ == "__main__":
    main()
