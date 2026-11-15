import React from 'react';
import { Megaphone, PlayCircle, Sparkles, ExternalLink, Award } from 'lucide-react';
import { awardPoints, pointsToPi, REWARDS_CONFIG } from '@/lib/communityRewardsService';
import { toast } from 'sonner';

interface TerritorialAdBannerProps {
  onOpenRewardsHub?: () => void;
  variant?: 'feed_inline' | 'top_strip' | 'compact';
}

export const TerritorialAdBanner: React.FC<TerritorialAdBannerProps> = ({
  onOpenRewardsHub,
  variant = 'feed_inline'
}) => {
  const handleClaimBannerReward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = awardPoints('BANNER_CLICK');
    if (result.success) {
      toast.success('🎁 Punti comunitari accreditati!', {
        description: `+${result.pointsEarned} Punti (~${pointsToPi(result.pointsEarned)} π). Visualizza il tuo saldo nell'Hub Pi.`,
      });
    }
  };

  if (variant === 'top_strip') {
    return (
      <div className="w-full bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2 truncate">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold uppercase">
            Sponsor
          </span>
          <span className="truncate text-[11px]">
            Sostieni la rete HAVE2WANT: accumula punti con annunci reali e convertili in <strong>π</strong> (Min. 0.50 π)!
          </span>
        </div>
        <button
          onClick={onOpenRewardsHub}
          className="ml-2 px-2.5 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-[10px] shrink-0 cursor-pointer transition-all flex items-center gap-1"
        >
          <span>Apri Hub Pi</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </button>
      </div>
    );
  }

  // Variant default: feed_inline (card pulita nel feed)
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-amber-950/20 to-zinc-900/90 border border-amber-500/30 space-y-2.5 my-2 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
            Spazio Sponsor Territoriale & Pi Network
          </span>
        </div>
        <button
          onClick={onOpenRewardsHub}
          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
        >
          <span>Regole Prelievo (0.50 π)</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Supporta l'Ecosistema P2P e Guadagna Pi</span>
          </h4>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            I punti generati dalle tue azioni e dagli annunci reali sul territorio sono convertibili sul tuo <strong>Pi Wallet esterno</strong>. Fee blockchain: -0.01 π.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClaimBannerReward}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Sostieni lo spazio sponsor"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Interagisci (+{REWARDS_CONFIG.EARN_RATES.BANNER_CLICK} Pts)</span>
          </button>

          <button
            onClick={onOpenRewardsHub}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <span>Preleva π</span>
          </button>
        </div>
      </div>
    </div>
  );
};
