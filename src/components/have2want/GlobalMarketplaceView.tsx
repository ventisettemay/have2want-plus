import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Repeat,
  Wallet,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Star,
  Settings,
  Briefcase,
  Handshake
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GlobalProduct,
  searchGlobalProducts,
  getPartnerWalletConfig,
  savePartnerWalletConfig,
  buildMonetizedProductUrl,
  PartnerWalletConfig
} from '@/lib/globalProductsCatalog';
import { HaveWantListing, PioneerUser, RealCategoryKey, RealSubcategoryKey } from '@/types';
import { calculateRealPiEquivalent, getCachedPiRealPrice } from '@/lib/piRealPriceService';
import MarketplaceOrderModal, { MarketplaceOrderTarget } from './MarketplaceOrderModal';
import BachecaLavoroP2P from './BachecaLavoroP2P';

export type GlobalMarketSection = 'CATALOGO' | 'BARATTO' | 'LAVORO';

interface GlobalMarketplaceViewProps {
  onBack?: () => void;
  onAddWantListing?: (listing: HaveWantListing) => void;
  currentUser?: PioneerUser;
  initialSection?: GlobalMarketSection;
}

export function GlobalMarketplaceView({
  onBack,
  onAddWantListing,
  currentUser,
  initialSection = 'CATALOGO',
}: GlobalMarketplaceViewProps) {
  const [activeSection, setActiveSection] = useState<GlobalMarketSection>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [walletConfig, setWalletConfig] = useState<PartnerWalletConfig>(getPartnerWalletConfig());
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tempWalletAddress, setTempWalletAddress] = useState(walletConfig.payoutWalletAddress);
  const [tempPartnerId, setTempPartnerId] = useState(walletConfig.partnerTrackingId);
  const [orderTarget, setOrderTarget] = useState<MarketplaceOrderTarget | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Baratto / Cerco / Acquisto state
  const [barattoIntent, setBarattoIntent] = useState<'BARATTO_SCAMBIO' | 'ACQUISTO_CERCO'>('BARATTO_SCAMBIO');
  const [barattoHave, setBarattoHave] = useState('');
  const [barattoWant, setBarattoWant] = useState('');
  const [barattoCity, setBarattoCity] = useState(currentUser?.city || 'Roma');
  const [barattoItems, setBarattoItems] = useState([
    {
      id: 'brt_1',
      intent: 'BARATTO_SCAMBIO',
      title: 'Offro: Bicicletta Gravel 28" · Cerco: Trapano a batteria o Pannello Solare',
      city: 'Bologna',
      author: 'Marco R.',
    },
    {
      id: 'brt_2',
      intent: 'ACQUISTO_CERCO',
      title: 'Cerco: Forno elettrico da banco / Impastatrice per laboratorio',
      city: 'Napoli',
      author: 'Lucia M.',
    },
  ]);

  React.useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const categories = [
    { id: 'ALL', label: 'Tutti i Prodotti', icon: '🌐' },
    { id: 'tecnologia', label: 'Tech & Smartphone', icon: '📱' },
    { id: 'bricolage', label: 'Bricolage & Attrezzi', icon: '🛠️' },
    { id: 'mobilita', label: 'Bici & Mobilità', icon: '🚲' },
    { id: 'motori', label: 'Ricambi Auto & Moto', icon: '🔧' },
    { id: 'moda', label: 'Moda & Outdoor', icon: '🧥' },
    { id: 'casa', label: 'Casa & Pulizia Smart', icon: '🏠' },
  ];

  const products = useMemo(() => {
    return searchGlobalProducts(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleSaveWalletConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PartnerWalletConfig = {
      ...walletConfig,
      payoutWalletAddress: tempWalletAddress.trim() || walletConfig.payoutWalletAddress,
      partnerTrackingId: tempPartnerId.trim() || walletConfig.partnerTrackingId,
    };
    savePartnerWalletConfig(updated);
    setWalletConfig(updated);
    setShowWalletModal(false);
    toast.success('✅ Configurazione Wallet e Codice Partner salvata con successo!', {
      description: `Indirizzo accredito commissioni: ${updated.payoutWalletAddress.slice(0, 14)}...`,
      duration: 3500,
    });
  };

  const handleCreateWantFromProduct = (product: GlobalProduct) => {
    // Map category loosely to real category key
    let catKey: RealCategoryKey = 'elettronica_informatica';
    let subKey: RealSubcategoryKey = 'telefonia_smartphone';

    if (product.category === 'bricolage') {
      catKey = 'attrezzi_lavoro';
      subKey = 'elettroutensili_professionali';
    } else if (product.category === 'mobilita' || product.category === 'motori') {
      catKey = 'auto_moto_veicoli';
      subKey = 'componenti_meccanici_ricambi';
    } else if (product.category === 'moda') {
      catKey = 'abbigliamento_accessori';
      subKey = 'vestiario_abiti';
    } else if (product.category === 'casa') {
      catKey = 'arredamento_casa';
      subKey = 'illuminazione_complementi';
    }

    const wantItem: any = {
      id: `want_${Date.now()}`,
      title: `CERCO: ${product.title}`,
      description: `Cerco questo prodotto o modello equivalente per baratto o scambio in Pi Coin. Valore di mercato indicativo: ${product.formattedPrice}.`,
      have_description: 'Offro baratto con altri oggetti o accordo in Pi Coin.',
      want_description: product.title,
      category: catKey,
      subcategory: subKey,
      intent: 'ACQUISTO_CERCO',
      action_type: 'acquisto_cerco',
      originType: 'REAL_P2P',
      isExternal: false,
      piPrice: calculateRealPiEquivalent(product.priceEur, 'EUR').piAmount,
      imageUrl: product.imageUrl,
      images: [product.imageUrl],
      created_at: new Date().toISOString(),
      city: currentUser?.city || 'Roma',
      author: {
        name: currentUser?.name || 'Pioneer User',
        username: currentUser?.username || 'pioneer_me',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        city: currentUser?.city || 'Roma',
        reputation: 5.0,
        isPioneerVerified: true,
      },
    };

    if (onAddWantListing) {
      onAddWantListing(wantItem);
    }
    toast.success(`✨ Annuncio 'CERCO' pubblicato su Have2Want!`, {
      description: `La tua richiesta per "${product.title.slice(0, 35)}..." è ora attiva nella bacheca per scambi con altri Pioneer.`,
      duration: 4500,
    });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col">
      {/* Header Catalogo Globale */}
      <div className="border-b border-zinc-900 bg-black/95 backdrop-blur-md px-4 sm:px-8 py-4 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ← Torna Indietro
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>MERCATO GLOBALE</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff66] border border-emerald-500/40">
                Prodotti Fisici Veri
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">
              Spedizioni a domicilio 24-48h • Ordina online o proponi baratto nella bacheca Have2Want
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setOrderTarget(null);
              setShowOrdersModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Gestisci ordini tracciati, conferme consegna e wallet non-custodial"
          >
            <ShoppingBag className="w-4 h-4 text-[#00ff66]" />
            <span>Ordini (π)</span>
          </button>
          <button
            onClick={() => setShowWalletModal(true)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Imposta il tuo indirizzo wallet USDT per ricevere le commissioni degli ordini"
          >
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono whitespace-nowrap">
              {walletConfig.payoutWalletAddress.slice(0, 6)}...{walletConfig.payoutWalletAddress.slice(-4)}
            </span>
            <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Sotto-barra unificata: Prodotti del Mondo | Baratto / Cerco / Acquisto | Lavoro P2P */}
      <div className="border-b border-zinc-900 bg-zinc-950/90 px-4 sm:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSection('CATALOGO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer border transition-all ${
            activeSection === 'CATALOGO'
              ? 'bg-[#00ff66] text-black border-[#00ff66]'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Prodotti del Mondo</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('BARATTO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer border transition-all ${
            activeSection === 'BARATTO'
              ? 'bg-amber-400 text-black border-amber-300'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          <span>Baratto / Cerco / Acquisto</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('LAVORO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer border transition-all ${
            activeSection === 'LAVORO'
              ? 'bg-purple-500 text-white border-purple-400'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Lavoro P2P</span>
        </button>
      </div>

      {activeSection === 'LAVORO' ? (
        <div className="px-2 sm:px-6 py-4 max-w-6xl mx-auto w-full">
          <BachecaLavoroP2P isOpen={true} currentUser={currentUser} />
        </div>
      ) : activeSection === 'BARATTO' ? (
        <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!barattoWant.trim()) return;
              const titleText =
                barattoIntent === 'BARATTO_SCAMBIO'
                  ? `SCAMBIO: ${barattoHave.trim() || 'Proposta'} ➔ ${barattoWant.trim()}`
                  : `CERCO: ${barattoWant.trim()}`;
              const newItem = {
                id: `baratto_${Date.now()}`,
                intent: barattoIntent,
                title: titleText,
                city: barattoCity || 'Territorio',
                author: currentUser?.name || 'Utente Have2Want',
              };
              setBarattoItems((prev) => [newItem, ...prev]);
              if (onAddWantListing) {
                onAddWantListing({
                  id: newItem.id,
                  title: titleText,
                  description: `${barattoIntent === 'BARATTO_SCAMBIO' ? 'Proposta baratto diretto' : 'Richiesta acquisto / cerco'} su Mercato Globale.`,
                  have_description: barattoHave.trim() || 'Oggetto / prestazione da concordare',
                  want_description: barattoWant.trim(),
                  category: 'casa_fai_da_te',
                  subcategory: 'accessori_varie',
                  intent: barattoIntent,
                  action_type: barattoIntent === 'BARATTO_SCAMBIO' ? 'baratto_scambio' : 'acquisto_cerco',
                  originType: 'REAL_P2P',
                  isExternal: false,
                  piPrice: 0,
                  created_at: new Date().toISOString(),
                  city: newItem.city,
                  author: {
                    name: newItem.author,
                    username: currentUser?.username || 'pioneer_me',
                    city: newItem.city,
                    reputation: 5.0,
                    isPioneerVerified: true,
                  },
                } as any);
              }
              setBarattoHave('');
              setBarattoWant('');
              toast.success('Proposta Baratto / Cerco pubblicata');
            }}
            className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-amber-300 uppercase">
                Pubblica Scambio Diretto, Baratto o Richiesta Acquisto
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBarattoIntent('BARATTO_SCAMBIO')}
                  className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    barattoIntent === 'BARATTO_SCAMBIO' ? 'bg-amber-400 text-black' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  Baratto / Scambio
                </button>
                <button
                  type="button"
                  onClick={() => setBarattoIntent('ACQUISTO_CERCO')}
                  className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    barattoIntent === 'ACQUISTO_CERCO' ? 'bg-sky-400 text-black' : 'bg-zinc-900 text-zinc-300'
                  }`}
                >
                  Cerco / Acquisto
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={barattoHave}
                onChange={(e) => setBarattoHave(e.target.value)}
                placeholder={barattoIntent === 'BARATTO_SCAMBIO' ? 'Cosa offri in scambio...' : 'Budget o metodo (Pi / Scambio)...'}
                className="px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white"
              />
              <input
                type="text"
                value={barattoWant}
                onChange={(e) => setBarattoWant(e.target.value)}
                placeholder="Cosa cerchi o vuoi acquistare..."
                required
                className="px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white"
              />
              <input
                type="text"
                value={barattoCity}
                onChange={(e) => setBarattoCity(e.target.value)}
                placeholder="Città / Area"
                className="px-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black cursor-pointer"
            >
              Pubblica in Bacheca P2P
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {barattoItems.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {b.intent === 'BARATTO_SCAMBIO' ? 'BARATTO / SCAMBIO' : 'CERCO / ACQUISTO'}
                </span>
                <div className="text-sm font-black text-white">{b.title}</div>
                <div className="text-[11px] text-zinc-400">
                  {b.author} • {b.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      /* Area Ricerca e Filtri per Categoria (CATALOGO) */
      <div className="px-4 sm:px-8 py-5 max-w-7xl mx-auto w-full space-y-4">
        {/* Barra di Ricerca */}
        <div className="relative w-full rounded-2xl border-2 border-zinc-800 focus-within:border-[#00ff66] bg-zinc-950 transition-all shadow-md">
          <Search className="w-4 h-4 text-[#00ff66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca prodotti fisici (es. iPhone, trapano, mountain bike, attrezzi, giacca...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-transparent text-white text-xs sm:text-sm font-medium placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categorie Orizzontali a Scorrimento */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#00ff66] text-black font-black shadow-md shadow-[#00ff66]/20'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Badge Risultati e Promemoria Logistica */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
          <span>{products.length} prodotti fisici disponibili</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Truck className="w-3.5 h-3.5" />
            Spedizioni dirette garantite con corriere espresso
          </span>
        </div>

        {/* Griglia Prodotti Fisici Reali con Foto ad Alta Definizione */}
        {products.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nessun prodotto trovato per questa ricerca</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Non trovi quello che cerchi? Puoi pubblicare subito una richiesta "CERCO" nella bacheca per chiedere alla community Pi!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {products.map((item) => {
              const buyUrl = buildMonetizedProductUrl(item, walletConfig);
              const piEquiv = calculateRealPiEquivalent(item.priceEur, 'EUR');

              return (
                <div
                  key={item.id}
                  className="rounded-3xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 group"
                >
                  {/* Foto Prodotto Fisico in Alta Definizione */}
                  <div className="relative h-60 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

                    {/* Badge Condizione e Negozio Fornitore */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-black shadow-md">
                        {item.condition}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/85 text-zinc-300 border border-zinc-700 backdrop-blur-md">
                        {item.store}
                      </span>
                    </div>

                    {/* Prezzo Reale di Vendita & Controvalore Pi Reale */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/85 p-2 rounded-xl backdrop-blur-md border border-zinc-800">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-base font-black text-white">
                            {item.formattedPrice}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40">
                            ~ {piEquiv.formattedPi}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-400 block font-mono">
                          Tasso reale: 1 π = {piEquiv.rateUsed.toFixed(2)} €
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          24-48h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dettagli e Specifiche Tecniche */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{item.rating}</span>
                        <span className="text-zinc-500 font-normal">({item.reviewsCount} recensioni verificate)</span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#00ff66] transition-colors leading-snug break-words">
                        {item.title}
                      </h3>

                      {/* Pillole Specifiche Tecniche */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(item.specifications).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300"
                          >
                            <strong className="text-zinc-400">{k}:</strong> {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* I DUE PULSANTI CHIAVE: ACQUISTO CON COMMISSIONE O BARATTO HAVE2WANT */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      {/* Pulsante 1: Ordina dal Negozio Ufficiale (Spedizione a casa + Guadagno per te) */}
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-[#00ff66]/15 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Ordina Online con Spedizione</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Pulsante 2: Trattenimento su Have2Want (Pubblica WANT per Baratto o Pi Coin) */}
                      <button
                        type="button"
                        onClick={() => handleCreateWantFromProduct(item)}
                        className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-amber-400/10 text-amber-300 hover:text-amber-200 border border-zinc-800 hover:border-amber-400/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                        title="Pubblica una richiesta di baratto o acquisto in Pi Coin nella bacheca di Have2Want"
                      >
                        <Repeat className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cerco in Baratto su Have2Want (WANT)</span>
                      </button>

                      {/* Pulsante 3: Ordine Diretto Tracciato Non-Custodial (Zero Commissioni) */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowOrdersModal(false);
                          setOrderTarget({
                            itemTitle: item.title,
                            sellerUsername: item.store || 'global_partner',
                            itemPricePi: piEquiv.piAmount,
                            defaultKmZeroPickup: false,
                            defaultShippingFeePi: 3.0,
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                        title="Registra ordine tracciato non-custodial a zero commissioni"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#00ff66]" />
                        <span>Registra Ordine Tracciato (π)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* MODALE DI CONFIGURAZIONE WALLET PARTNER & PAYOUT CRYPTO */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Configurazione Payout Crypto</h3>
                  <p className="text-[11px] text-zinc-400">Accredito delle commissioni generate dalle vendite</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWalletConfig} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-200 block text-[11px]">
                  Indirizzo Pubblico Wallet Ricezione (USDT / TRC20 o Polygon)
                </label>
                <input
                  type="text"
                  value={tempWalletAddress}
                  onChange={(e) => setTempWalletAddress(e.target.value)}
                  placeholder="Es. TFrw8xP2qM3Zk1B5vE8nH7yJ4cL9wD6sA1..."
                  className="w-full p-2.5 rounded-xl bg-black border border-zinc-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-zinc-400">
                  Inserisci l'indirizzo pubblico del tuo Trust Wallet, TronLink o wallet non-custodial.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-200 block text-[11px]">
                  Codice Partner Affiliate / Tracking Tag
                </label>
                <input
                  type="text"
                  value={tempPartnerId}
                  onChange={(e) => setTempPartnerId(e.target.value)}
                  placeholder="have2want_global"
                  className="w-full p-2.5 rounded-xl bg-black border border-zinc-800 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-zinc-400">
                  Il codice univoco associato ai link per tracciare le commissioni dei marketplace.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black"
                >
                  Salva Configurazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MarketplaceOrderModal
        isOpen={Boolean(orderTarget) || showOrdersModal}
        targetItem={orderTarget}
        currentUsername={currentUser?.username || 'pioneer_me'}
        onClose={() => {
          setOrderTarget(null);
          setShowOrdersModal(false);
        }}
      />
    </div>
  );
}
