import React, { useState, useEffect } from 'react';
import { useH2W } from '../../lib/h2wContext';
import PiChatUnifiedHub from './PiChatUnifiedHub';
import MarketplaceOrderModal, { MarketplaceOrderTarget } from './MarketplaceOrderModal';
import { toast } from 'sonner';
import { X, Sprout, Navigation, Plus, Video, MessageCircle, MapPin, ShoppingBag } from 'lucide-react';

interface VetrinaKmZeroProps {
  currentUser?: any;
  onOpenChat?: (merchantId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onTriggerHandshake?: (listing: any) => void;
}

export default function VetrinaKmZero({
  currentUser,
  onOpenChat,
  isOpen = true,
  onClose,
  onTriggerHandshake
}: VetrinaKmZeroProps) {
  if (!isOpen) return null;

  const { merchantPiBalance, deductMerchantSubscription } = useH2W();
  const [acceptsPi, setAcceptsPi] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [shareLocation, setShareLocation] = useState(() => localStorage.getItem('h2w_share_location') === 'true');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVideoProduct, setSelectedVideoProduct] = useState<any>(null);
  const [orderTarget, setOrderTarget] = useState<MarketplaceOrderTarget | null>(null);
  const [showOrdersHistory, setShowOrdersHistory] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    imageUrl: '',
    category: 'ORTOFRUTTA',
    location: '',
    pricePi: ''
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Arance Rosse di Sicilia IGP",
      description: "Raccolte direttamente dal campo al mattino, non trattate con buccia edibile, ideali per spremute.",
      imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80",
      category: "ORTOFRUTTA",
      location: "Lentini (SR)",
      pricePi: 0.8,
      merchantId: "m_orto",
      isDemo: true,
    },
    {
      id: 2,
      name: "Pescato Locale del Giorno",
      description: "Sbarcato al porto canale all'alba. Consegna immediata al banco ittico di prossimità per i residenti.",
      imageUrl: "https://images.unsplash.com/photo-1534948216015-843149f72be3?w=600&auto=format&fit=crop&q=80",
      category: "PESCHERIA",
      location: "Porto di Mazara del Vallo",
      pricePi: 2.5,
      merchantId: "m_porto",
      isDemo: true,
    },
    {
      id: 3,
      name: "Caciocavallo Ragusano DOP di Masseria",
      description: "Formaggio tipico a pasta filata prodotto con latte intero crudo di mucche al pascolo naturale.",
      imageUrl: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80",
      category: "CASEIFICIO",
      location: "Ragusa",
      pricePi: 1.8,
      merchantId: "m_casaro",
      isDemo: true,
    }
  ]);

  useEffect(() => {
    localStorage.setItem('h2w_share_location', String(shareLocation));
  }, [shareLocation]);

  const handlePayAndPublish = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = acceptsPi ? 10 : 20;
    const success = deductMerchantSubscription(acceptsPi ? "DAILY_SCONTO" : "DAILY");
    if (!success && merchantPiBalance < cost) {
      toast.error("Saldo Pi insufficiente per pubblicare la locandina aziendale.");
      return;
    }
    const productToAdd = {
      ...newProduct,
      id: Date.now(),
      pricePi: parseFloat(newProduct.pricePi) || 5,
      merchantId: currentUser?.id || "m_local",
      isDemo: false,
    };
    setProducts([productToAdd, ...products]);
    setShowUploadForm(false);
    setIsSubscribed(true);
    toast.success("Produzione agricola inserita nella Filiera Km 0!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  FILIERA AGRICOLA LOCALE (KM 0)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  SENTINEL-2
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Vendita diretta dal produttore: ortofrutta, cascine e produzioni agricole del territorio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOrderTarget(null);
                setShowOrdersHistory(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ordini QR</span>
            </button>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#00ff66] hover:bg-[#00e65c] text-black flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Nuova Produzione</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Corpo scorrevole */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {showUploadForm && (
            <form onSubmit={handlePayAndPublish} className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h3 className="text-sm font-black text-[#00ff66] uppercase">
                Inserisci Locandina di Vendita Diretta dal Produttore
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-white">
                <input
                  type="text"
                  placeholder="Nome Prodotto o Raccolto"
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="p-2.5 rounded-xl text-sm bg-zinc-950 border border-zinc-700 focus:outline-none focus:border-[#00ff66]"
                />
                <select
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="p-2.5 rounded-xl text-sm bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-[#00ff66]"
                >
                  <option value="ORTOFRUTTA">🥦 Ortofrutta Diretta dal Campo</option>
                  <option value="PESCHERIA">🐟 Pescato Locale di Banchina</option>
                  <option value="CASEIFICIO">🧀 Formaggi e Latticini di Masseria</option>
                  <option value="MACELLERIA">🥩 Macelleria Tradizionale & Allevamenti</option>
                  <option value="MIELE_OLIO">🍯 Miele, Olio e Conserve Artigianali</option>
                </select>
                <input
                  type="text"
                  placeholder="Località / Comune del fondo agricolo"
                  required
                  value={newProduct.location}
                  onChange={e => setNewProduct({...newProduct, location: e.target.value})}
                  className="p-2.5 rounded-xl text-sm bg-zinc-950 border border-zinc-700 focus:outline-none focus:border-[#00ff66]"
                />
                <input
                  type="number"
                  placeholder="Prezzo al pubblico (π)"
                  required
                  value={newProduct.pricePi}
                  onChange={e => setNewProduct({...newProduct, pricePi: e.target.value})}
                  className="p-2.5 rounded-xl text-sm bg-zinc-950 border border-zinc-700 focus:outline-none focus:border-[#00ff66]"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-t border-b border-zinc-800 text-xs">
                <span className="font-bold text-zinc-300">Accetti pagamenti diretti in Pi Network? (Tariffa agevolata)</span>
                <input
                  type="checkbox"
                  checked={acceptsPi}
                  onChange={(e) => setAcceptsPi(e.target.checked)}
                  className="w-4 h-4 accent-[#00ff66] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00ff66] text-black font-black uppercase cursor-pointer hover:bg-[#00e65c]"
                >
                  Pubblica Locandina
                </button>
              </div>
            </form>
          )}

          {/* Griglia Prodotti a Km 0 */}
          <div className="grid grid-cols-1 gap-3">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                      🌱
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-sm sm:text-base">{product.name}</h4>
                      {product.isDemo && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-500/30">
                          Esempio Dimostrativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{product.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#00ff66] mt-1 font-mono">
                      <MapPin className="w-3 h-3 text-[#00ff66]" />
                      <span>{product.location} • Categoria: {product.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-white">{product.pricePi} π</span>
                    <span className="text-[10px] text-zinc-400 block">Prezzo diretto</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenChat && onOpenChat(product.merchantId)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer flex items-center gap-1"
                      title="Contatta il produttore"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Contatta</span>
                    </button>
                    <button
                      onClick={() => setSelectedVideoProduct(product)}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-400 text-xs font-bold cursor-pointer flex items-center gap-1"
                      title="Ispezione video del fondo agricolo"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Video Live</span>
                    </button>
                    <button
                      onClick={() => {
                        toast.info(`Coordinate di ritiro individuate per ${product.name} a ${product.location}`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black cursor-pointer flex items-center gap-1"
                      title="Calcola percorso per il ritiro diretto sul posto"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Ritiro Km 0</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrdersHistory(false);
                        setOrderTarget({
                          itemTitle: product.name,
                          sellerUsername: product.merchantId || 'produttore_km0',
                          itemPricePi: Number(product.pricePi) || 1,
                          defaultKmZeroPickup: true,
                          defaultShippingFeePi: 0,
                          locationLabel: product.location,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer flex items-center gap-1"
                      title="Crea ordine con codice QR ritiro Km 0 a zero commissioni"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ordina QR</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedVideoProduct && (
          <PiChatUnifiedHub
            isOpen={true}
            initialTab="VIDEO"
            currentUserId={currentUser?.id || 'u1'}
            chatRoomId={`km0_${selectedVideoProduct.id}`}
            recipientName={selectedVideoProduct.name}
            onClose={() => setSelectedVideoProduct(null)}
          />
        )}

        <MarketplaceOrderModal
          isOpen={Boolean(orderTarget) || showOrdersHistory}
          targetItem={orderTarget}
          currentUsername={currentUser?.username || 'pioneer_me'}
          onClose={() => {
            setOrderTarget(null);
            setShowOrdersHistory(false);
          }}
        />
      </div>
    </div>
  );
}
