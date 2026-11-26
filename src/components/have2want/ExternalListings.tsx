import React, { useState, useEffect } from 'react';
import { fetchExternal, ExternalListing } from '@/lib/externalMarketplaces';

export function ExternalListings({
  country,
  query,
}: {
  country: string;
  query: string;
}) {
  const [list, setList] = useState<ExternalListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || country === 'ALL') {
      setList([]);
      return;
    }
    setLoading(true);
    const res = fetchExternal(country, query);
    setList(res);
    setLoading(false);
  }, [country, query]);

  if (list.length === 0 || country === 'ALL') return null;

  return (
    <div className="external-listings-section mt-4 pt-4 border-t border-slate-800">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Marketplace Esterni (Amazon / eBay) · {country}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-emerald-950/70 text-[#00ff66] px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
            Solo Criptovalute (π / USDT · Zero Fiat/PayPal)
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Esterno
          </span>
        </div>
      </div>
      <div className="grid gap-2">
        {list.map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors text-left"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="text-sm font-medium text-slate-200">{l.title}</div>
                <div className="text-xs text-sky-400 mt-1 font-semibold">
                  {l.price} · Regolamento Crypto Non-Custodial
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 shrink-0">
                {l.marketplace}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
