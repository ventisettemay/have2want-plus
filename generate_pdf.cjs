
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
`export type InteractionIntent =\n` +
`  | 'VENDO'             // Vendita regolata esclusivamente in Pi Coin (pi)\n` +
`  | 'BARATTO_SCAMBIO'   // Scambio merceologico diretto, baratto paritario o tempo\n` +
`  | 'ACQUISTO_CERCO';   // Annuncio di ricerca e fabbisogno per beni o servizi`
);

addSubSectionTitle("3.2 L'Entita Annuncio Principale (HaveWantListing)");
addCodeBlock(
`export interface HaveWantListing {\n` +
`  id: string;\n` +
`  intent: InteractionIntent;\n` +
`  title: string;\n` +
`  description: string;\n` +
`  category: RealCategoryKey;\n` +
`  subcategory: RealSubcategoryKey;\n` +
`  piPrice: number; // Obbligatorio e > 0 se intent === 'VENDO', 0 per baratto/cerco\n` +
`  concreteExchange?: {\n` +
`    offer?: { item: string; quantity: number; unit: string; condition?: string; };\n` +
`    wanted?: { item: string; quantity: number; unit: string; };\n` +
`    territorialScope?: 'stesso_quartiere' | 'citta_area' | 'provincia' | 'nazionale';\n` +
`  };\n` +
`  author: { name: string; username: string; avatar: string; reputation: number; city: string; };\n` +
`  lat: number; lng: number; locationArea: string; isFuzzyLocation?: boolean;\n` +
`  imageUrl?: string; createdAt: string; tags: string[]; status: 'active' | 'matched';\n` +
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
