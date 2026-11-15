import { toast } from 'sonner';
import { executePiSdkPayment } from '@/lib/piSdkService';
import { updateListingInCloud, saveWalletToCloud } from '@/lib/firestoreService';

/**
 * Gestisce l'acquisto di visibilità dei palazzi stabili commerciali in Pi Coin via Pi SDK + Firestore
 */
export async function processListingVisibilityPurchase(listingId, profileId, weeksCount) {
  try {
    let cost = 6;
    let days = 7;
    if (weeksCount === 2) { cost = 10; days = 14; }
    else if (weeksCount === 4) { cost = 18; days = 30; }

    const payment = await executePiSdkPayment({
      amount: cost,
      memo: `Acquisto Visibilità ${days} Giorni - HAVE2WANT`,
      metadata: { listing_id: listingId, profile_id: profileId }
    });

    if (!payment || !payment.success) {
      toast.error(payment?.error || 'Transazione rifiutata o annullata dal Pi Wallet.');
      return false;
    }

    const end = new Date();
    end.setDate(end.getDate() + days);

    await updateListingInCloud(listingId, {
      visibility_level: 'PREMIUM_ILLUMINATO',
      visibility_expires_at: end.toISOString(),
      pi_testnet_tx_id: payment.txId,
    });

    toast.success(`Voilà! Palazzo 3D risaltato ed illuminato per ${days} giorni sul territorio.`);
    return true;
  } catch (err) {
    toast.error('Impossibile attivare il risalto commerciale');
    return false;
  }
}

/**
 * Scudo del Ban Commerciale: Espulsione istantanea a 99 anni nel futuro per truffe o sconti negati
 */
export async function executeCommunityBan(listingId, companyProfileId) {
  try {
    await updateListingInCloud(listingId, {
      visibility_level: 'OFF_SPENTO',
      status: 'removed',
    });

    const infinityDate = new Date();
    infinityDate.setFullYear(infinityDate.getFullYear() + 99);

    if (companyProfileId) {
      await saveWalletToCloud(companyProfileId, {
        walletId: companyProfileId,
        pointsBalance: 0,
        totalPointsEarned: 0,
        pioneerUsername: companyProfileId,
        history: [],
        updatedAt: Date.now(),
      });
    }

    toast.error('Azienda scorretta espulsa permanentemente. Annuncio oscurato, fondi trattenuti.');
    return true;
  } catch (err) {
    console.error("Errore nell'esecuzione del ban di autotutela:", err);
    return false;
  }
}
