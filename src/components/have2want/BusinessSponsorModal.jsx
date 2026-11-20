import React, { useState, useEffect } from 'react';
import { Store, Megaphone, X, Calendar, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getWeeklyAdvertisingPrice } from '@/lib/countryAdvertisingPricing';
import { executePiSdkPayment } from '@/lib/piSdkService';
import { findCountryByNameOrCode, WORLD_COUNTRIES } from '@/lib/worldAtlas';

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
  const [website, setWebsite] = useState('');
  const [hours, setHours] = useState('Lun-Sab: 09:00 - 19:30');
  const [piAccepted, setPiAccepted] = useState(true);
  const [hasAd, setHasAd] = useState(true);
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

  const pricing = getWeeklyAdvertisingPrice(countryCode);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error('Compila almeno il nome dell\'attività e una breve descrizione!');
      return;
    }

    // Risoluzione coordinate reali non nulle (mai 0,0 Null Island)
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
      const paymentResult = await executePiSdkPayment({
        amount: pricing.currentPricePi,
        memo: `HAVE2WANT Vetrina 3D 7gg: ${name.trim()}`,
        metadata: {
          type: 'shop_sponsorship_7d',
          businessName: name.trim(),
          countryCode,
          pricePi: pricing.currentPricePi,
        },
        requireLivePiBrowser: true,
      });

      if (!paymentResult.success || !paymentResult.txId) {
        toast.error(
          paymentResult.error || 'Pagamento Pi Network non completato: la vetrina a pagamento richiede verifica Pi SDK.'
        );
        return;
      }

      const effectivePi = Boolean(piAccepted);
      const effectiveAd = Boolean(hasAd || promo.trim().length > 0);
      const effectivePromo = effectiveAd ? (promo.trim() || 'Volantino promozionale attivo in vetrina') : '';

      const newBiz = {
        id: `biz-${Date.now()}`,
        name: name.trim(),
        category,
        categoryLabel: category === 'ospitalita' ? 'Hotel, B&B & Ospitalità' : category === 'ristorazione' ? 'Ristorazione & Bar' : category === 'tecnologia' ? 'Informatica & Rigenerazione' : category === 'bio_agricoltura' ? 'Prodotti Bio & KM0' : 'Artigianato & Servizi',
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
        piAccepted: effectivePi,
        hasAd: effectiveAd,
        isAd: effectiveAd,
        p2pDirectWallet: effectivePi,
        durationDays: 7,
        durationLabel: 'Settimanale (7 giorni)',
        paidPricePi: pricing.currentPricePi,
        listPricePi: pricing.listPricePi,
        piPaymentId: paymentResult.paymentId || paymentResult.txId,
        txId: paymentResult.txId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        phone: phone.trim(),
        website: website.trim() || 'https://pinetwork.com',
        hours,
        voiceIntro: `Ciao! Benvenuti da ${name}. Scopri le nostre offerte in risalto sulla mappa 3D!`
      };

      onAddSponsoredBusiness(newBiz);
      toast.success(`Vetrina "${name}" attivata per 7 giorni!`, {
        description: `Pagamento Pi verificato (${pricing.currentPricePi} π) • TX ${paymentResult.txId.slice(0, 14)}...`,
        duration: 4000
      });
      onClose();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header Modale Sponsor */}
        <div className="px-6 py-4 bg-black border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#00ff66]">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Promuovi Attività o Bottega 3D
              </h3>
              <p className="text-xs text-zinc-400">
                Punto d'interesse visibile sulla mappa 3D
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
          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">Nome Attività / Negozio</label>
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
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cosa offri alla comunità locale o ai viaggiatori?"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-white uppercase tracking-wider text-[11px]">
              Offerta / Promo Speciale
            </label>
            <input
              type="text"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Es. Sconto 15% pagando in Pi Coin (π)"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Telefono / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 333 1234567"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-white uppercase tracking-wider text-[11px]">Orari di apertura</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Lun-Sab: 09:00 - 19:30"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black border border-purple-500/50 text-purple-300 font-black flex items-center justify-center text-sm">
                  π
                </div>
                <div>
                  <span className="font-bold text-white">Accetta Pi Network (π)</span>
                  <p className="text-[11px] text-zinc-400">Pin Viola/Oro lampeggiante (o Doppio Anello con volantino)</p>
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
                  <span className="font-bold text-white">Vetrina & Volantino Pubblicitario</span>
                  <p className="text-[11px] text-zinc-400">Pin Oro Puro (o Doppio Anello se accetti anche Pi)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasAd}
                onChange={(e) => setHasAd(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Box Prezzo Settimanale: Prezzo Sbarrato e Prezzo Reale (Nessuna parola 'sconto') */}
            <div className="p-3 rounded-xl bg-black border border-zinc-900 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-semibold text-xs">{pricing.durationLabel}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-zinc-500 line-through font-mono">
                    {pricing.listPricePi} π
                  </span>
                  <span className="text-base font-black text-[#00ff66] font-mono">
                    {pricing.currentPricePi} π
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900/80 pt-2">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-zinc-500" />
                  <span>Rilevamento territorio: {pricing.trafficTierLabel}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-amber-300/90 text-[10px] font-medium border border-zinc-800">
                  Pi Testnet Sandbox
                </span>
              </div>
            </div>
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
              className="px-5 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00e65c] text-black text-xs font-black flex items-center gap-2 cursor-pointer active:scale-95 transition-colors shadow-sm"
            >
              <Store className="w-4 h-4 text-black" />
              <span>Attiva Vetrina ({pricing.currentPricePi} π)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
