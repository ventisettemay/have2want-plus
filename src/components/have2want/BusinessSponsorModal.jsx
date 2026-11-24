import React, { useState, useEffect } from 'react';
import { Store, Megaphone, X, Calendar, Eye, Wallet, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import {
  AD_PLACEMENT_CATALOG,
  CRYPTO_PAYMENT_METHODS_META,
  getConfiguredLaunchCoefficient,
  setConfiguredLaunchCoefficient,
  getCountryAdPricingByType,
} from '@/lib/countryAdvertisingPricing';
import { executePiSdkPayment } from '@/lib/piSdkService';
import { findCountryByNameOrCode, WORLD_COUNTRIES } from '@/lib/worldAtlas';
import { spendMerchantPiBalance } from '@/lib/communityRewardsService';

export default function BusinessSponsorModal({
  isOpen = false,
  onClose = () => {},
  onAddSponsoredBusiness = () => {},
  currentLocation = { lat: 0, lng: 0, city: '', region: '', countryCode: '' }
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('artigianato');
  const [countryCode, setCountryCode] = useState(currentLocation.countryCode || 'GLOBAL');
  const [city, setCity] = useState(currentLocation.city || '');
  const [region, setRegion] = useState(currentLocation.region || '');
  const [description, setDescription] = useState('');
  const [promo, setPromo] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('Lun-Sab: 09:00 - 19:30');
  const [piAccepted, setPiAccepted] = useState(true);
  const [hasAd, setHasAd] = useState(true);

  const [adType, setAdType] = useState('EXTERNAL_GLOBE_PIN');
  const [durationTier, setDurationTier] = useState('WEEKLY');
  const [launchCoeff, setLaunchCoeff] = useState(() => getConfiguredLaunchCoefficient());
  const [paymentMethod, setPaymentMethod] = useState('PI_SDK');
  const [externalCryptoTx, setExternalCryptoTx] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (currentLocation?.countryCode) {
      setCountryCode(currentLocation.countryCode.toUpperCase());
    }
    if (currentLocation?.city) {
      setCity(currentLocation.city);
    }
    if (currentLocation?.region) {
      setRegion(currentLocation.region);
    }
  }, [isOpen, currentLocation?.countryCode, currentLocation?.city, currentLocation?.region]);

  const pricing = getCountryAdPricingByType(countryCode, adType, durationTier, launchCoeff);
  const selectedMethodMeta = CRYPTO_PAYMENT_METHODS_META[paymentMethod] || CRYPTO_PAYMENT_METHODS_META.PI_SDK;

  if (!isOpen) return null;

  const handleCoeffChange = (val) => {
    const saved = setConfiguredLaunchCoefficient(parseFloat(val) || 0.2);
    setLaunchCoeff(saved);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Compila almeno il nome dell\'attività e una breve descrizione!');
      return;
    }

    let baseLat = Number(currentLocation?.lat);
    let baseLng = Number(currentLocation?.lng);
    if (!Number.isFinite(baseLat) || !Number.isFinite(baseLng) || (baseLat === 0 && baseLng === 0)) {
      const countryEntry = findCountryByNameOrCode(countryCode) || findCountryByNameOrCode(city);
      if (countryEntry) {
        baseLat = countryEntry.lat;
        baseLng = countryEntry.lng;
      }
    }
    if (!Number.isFinite(baseLat) || !Number.isFinite(baseLng) || (baseLat === 0 && baseLng === 0)) {
      toast.error('Posizione geografica non valida. Seleziona una Nazione o centra la mappa prima di attivare la vetrina.');
      return;
    }

    setIsPaying(true);
    try {
      let resolvedTxId = '';

      if (paymentMethod === 'PI_SDK') {
        const paymentResult = await executePiSdkPayment({
          amount: pricing.currentPricePi,
          memo: `HAVE2WANT Ads (${pricing.adType}) ${pricing.durationDays}gg: ${name.trim()}`,
          metadata: {
            type: pricing.adType,
            durationTier,
            countryCode,
            pricePi: pricing.currentPricePi,
          },
          requireLivePiBrowser: true,
        });
        if (!paymentResult.success || !paymentResult.txId) {
          toast.error(
            paymentResult.error || 'Pagamento Pi SDK non completato: verifica in Pi Browser o seleziona USDT/Crediti.'
          );
          return;
        }
        resolvedTxId = paymentResult.txId;
      } else if (paymentMethod === 'PREPAID_CREDITS') {
        const spent = spendMerchantPiBalance(pricing.currentPricePi);
        if (!spent) {
          toast.error(`Saldo Crediti Prepagati insufficiente (servono ${pricing.currentPricePi} π).`);
          return;
        }
        resolvedTxId = `CREDITS-${Date.now()}`;
      } else if (paymentMethod === 'PI_AD_NETWORK') {
        resolvedTxId = `PI-AD-NET-${Date.now()}`;
      } else {
        // USDT_POLYGON or USDT_TRC20 non-custodial transaction reference
        const cleanHash = externalCryptoTx.trim();
        if (cleanHash.length < 10) {
          toast.error(`Inserisci l'hash / TX ID della transazione ${selectedMethodMeta.label} per verificare la pubblicazione.`);
          return;
        }
        resolvedTxId = cleanHash;
      }

      const effectivePi = Boolean(piAccepted);
      const effectiveAd = Boolean(hasAd || promo.trim().length > 0);
      const effectivePromo = effectiveAd ? (promo.trim() || 'Volantino promozionale attivo in vetrina') : '';

      const newBiz = {
        id: `biz-${Date.now()}`,
        name: name.trim(),
        category,
        categoryLabel:
          category === 'ospitalita'
            ? 'Hotel, B&B & Ospitalità'
            : category === 'ristorazione'
            ? 'Ristorazione & Bar'
            : category === 'tecnologia'
            ? 'Informatica & Rigenerazione'
            : category === 'bio_agricoltura'
            ? 'Prodotti Bio & KM0'
            : 'Artigianato & Servizi',
        badge: effectivePi && effectiveAd ? 'Gold Verified' : effectivePi ? 'Pi Merchant' : 'Gold Verified',
        city,
        region,
        countryCode,
        lat: baseLat + (Math.random() - 0.5) * 0.004,
        lng: baseLng + (Math.random() - 0.5) * 0.004,
        rating: 5.0,
        reviewCount: 1,
        description: description.trim(),
        promo: effectivePromo,
        adHeadline: effectiveAd ? effectivePromo : undefined,
        adPlacementType: adType,
        paymentMethod,
        piAccepted: effectivePi,
        hasAd: effectiveAd,
        isAd: effectiveAd,
        p2pDirectWallet: effectivePi,
        durationDays: pricing.durationDays,
        durationLabel: pricing.durationLabel,
        paidPricePi: pricing.currentPricePi,
        paidPriceUsdt: pricing.currentPriceUsdt,
        listPricePi: pricing.listPricePi,
        txId: resolvedTxId,
        expiresAt: new Date(Date.now() + pricing.durationDays * 24 * 60 * 60 * 1000).toISOString(),
        phone: phone.trim(),
        website: 'https://pinetwork.com',
        hours,
        voiceIntro: `Ciao! Benvenuti da ${name}. Scopri le nostre offerte in risalto sulla mappa 3D!`
      };

      onAddSponsoredBusiness(newBiz);
      toast.success(`Inserzione "${name}" attivata (${pricing.durationLabel})!`, {
        description: `Metodo: ${selectedMethodMeta.label} • Rif: ${resolvedTxId.slice(0, 14)}...`,
        duration: 4500
      });
      onClose();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header Modale Sponsor */}
        <div className="px-6 py-4 bg-black border-b border-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Creazione Pubblicità &amp; Inserzioni 3D
              </h3>
              <p className="text-xs text-zinc-400">
                Listino multi-livello per Paese • Pagamento esclusivo Crypto &amp; Crediti (Zero Fiat)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Sponsorizzazione */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Tipo Inserzione + Durata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                Tipologia Inserzione
              </label>
              <select
                value={adType}
                onChange={(e) => setAdType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-amber-400"
              >
                {Object.values(AD_PLACEMENT_CATALOG).map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.shortLabel} ({item.marketMultiplier}x listino)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                Durata Campagna
              </label>
              <select
                value={durationTier}
                onChange={(e) => setDurationTier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-amber-400"
              >
                <option value="DAILY">Giornaliera (24 ore)</option>
                <option value="WEEKLY">Settimanale (7 giorni)</option>
                <option value="MONTHLY">Mensile (30 giorni)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">Nome Attività / Volantino</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Officina del Legno & Restauro"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Nazione / Territorio</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-[#00ff66]"
              >
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.currency.symbol})
                  </option>
                ))}
                <option value="GLOBAL">🌐 Internazionale ($)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white cursor-pointer focus:outline-none focus:border-[#00ff66]"
              >
                <option value="artigianato">Artigianato & Riparazioni</option>
                <option value="ristorazione">Ristorazione & Bar</option>
                <option value="bio_agricoltura">Agricoltura & KM0</option>
                <option value="tecnologia">Informatica & Elettronica</option>
                <option value="ospitalita">Ospitalità & B&B</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Città</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Città"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">Descrizione Volantino</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrivi prodotti, orari e condizioni per la scheda visibile sulla mappa..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Titolo Inserzione / Volantino</label>
              <input
                type="text"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Es. Menu Km 0 e ritiro diretto in bottega"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Orari &amp; Telefono</label>
              <input
                type="text"
                value={phone || hours}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Lun-Sab 09:00-19:30 • +39 ..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>
          </div>

          {/* Classificazione Pin + Coefficiente Lancio Pioniere */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black border border-purple-500/50 text-purple-300 font-black flex items-center justify-center text-sm">
                  π
                </div>
                <div>
                  <span className="font-bold text-white">Accetta Pi Network (π)</span>
                  <p className="text-[11px] text-zinc-400">Pin Viola/Oro (o Doppio Anello se inserzione attiva)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={piAccepted}
                onChange={(e) => setPiAccepted(e.target.checked)}
                className="w-4 h-4 accent-[#8b5cf6] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black border border-amber-500/50 text-amber-300 font-black flex items-center justify-center text-sm">
                  📢
                </div>
                <div>
                  <span className="font-bold text-white">Spilla Pubblicitaria Attiva</span>
                  <p className="text-[11px] text-zinc-400">Apre scheda vetrina + animazione pin ingrandimento periodico</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasAd}
                onChange={(e) => setHasAd(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Regolazione Coefficiente Lancio Pioniere (default 0.20) */}
            <div className="p-2.5 rounded-xl bg-black border border-zinc-900 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Coefficiente Lancio Pioniere modificabile</span>
                </span>
                <span className="font-mono font-black text-[#00ff66]">{launchCoeff.toFixed(2)}x ({Math.round(launchCoeff * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={launchCoeff}
                onChange={(e) => handleCoeffChange(e.target.value)}
                className="w-full accent-[#00ff66] cursor-pointer"
              />
            </div>

            {/* Riepilogo Prezzo Reale Pi & USDT */}
            <div className="p-3 rounded-xl bg-black border border-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-semibold text-xs">{pricing.durationLabel} • {AD_PLACEMENT_CATALOG[adType]?.shortLabel}</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs text-zinc-500 line-through font-mono">
                    {pricing.listPricePi} π
                  </span>
                  <span className="text-base font-black text-[#00ff66] font-mono">
                    {pricing.currentPricePi} π
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-300">
                    ({pricing.currentPriceUsdt} USDT)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900/80 pt-2">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-zinc-500" />
                  <span>{pricing.trafficTierLabel}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-amber-300/90 text-[10px] font-medium border border-zinc-800">
                  Zero Fiat • 100% Crypto &amp; Crediti
                </span>
              </div>
            </div>
          </div>

          {/* Metodo di Pagamento Esclusivo Crypto & Crediti */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-white text-xs">
              <Wallet className="w-4 h-4 text-[#00ff66]" />
              <span>Metodo di Regolamento (Solo Crypto Non-Custodial o Crediti)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(CRYPTO_PAYMENT_METHODS_META).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'bg-emerald-950/60 border-[#00ff66] text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-black text-[11px] truncate">{m.label}</div>
                  <div className="text-[9px] text-sky-300 mt-0.5">{m.networkBadge}</div>
                </button>
              ))}
            </div>
            {(paymentMethod === 'USDT_POLYGON' || paymentMethod === 'USDT_TRC20') && (
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-sky-300 block">
                  Hash transazione {selectedMethodMeta.label} ({pricing.currentPriceUsdt} USDT)
                </label>
                <input
                  type="text"
                  value={externalCryptoTx}
                  onChange={(e) => setExternalCryptoTx(e.target.value)}
                  placeholder="Incolla TX Hash non-custodial su Polygon / TRC20..."
                  className="w-full px-3 py-2 rounded-xl bg-black border border-sky-500/40 font-mono text-[11px] text-white focus:outline-none focus:border-sky-400"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 text-xs font-bold cursor-pointer transition-colors border border-zinc-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPaying}
              className="px-5 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] disabled:opacity-50 text-black text-xs font-black flex items-center gap-2 cursor-pointer active:scale-95 transition-colors shadow-sm"
            >
              <Store className="w-4 h-4 text-black" />
              <span>
                {isPaying
                  ? 'Verifica pagamento...'
                  : paymentMethod === 'USDT_POLYGON' || paymentMethod === 'USDT_TRC20'
                  ? `Pubblica con ${pricing.currentPriceUsdt} USDT`
                  : `Pubblica (${pricing.currentPricePi} π)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
