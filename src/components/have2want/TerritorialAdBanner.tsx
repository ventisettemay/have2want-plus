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
      <div className="w-full bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold uppercase shrink-0">
            Sponsor
          </span>
          <span className="text-[11px] break-words">
            Accumula punti reali e convertili in <strong>π</strong> (soglia 0.50 π).
          </span>
        </div>
        <button
          onClick={onOpenRewardsHub}
          className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-[10px] shrink-0 cursor-pointer transition-all flex items-center gap-1"
        >
          <span>Hub Pi</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </button>
      </div>
    );
  }

  // Variant default: feed_inline (slot ordinato edge-to-edge senza muro di testo)
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-2 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-amber-400" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-white">Spazio Sponsor Territoriale</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black uppercase">
              0.50 π min · Fee -0.01 π
            </span>
          </div>
          <p className="text-xs text-zinc-300 break-words">
            Converti i punti della comunità sul tuo Pi Wallet esterno.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          onClick={handleClaimBannerReward}
          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          title="Sostieni lo spazio sponsor"
        >
          <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>+{REWARDS_CONFIG.EARN_RATES.BANNER_CLICK} Pts</span>
        </button>

        <button
          onClick={onOpenRewardsHub}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
        >
          <span>Preleva π</span>
        </button>
      </div>
    </div>
  );
};
