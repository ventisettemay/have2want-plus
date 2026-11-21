/**
 * Trasferimento P2P di punti tra utenti (trasferimento autorizzato).
 * Usato per scambi diretti tra utenti, regali, pagamenti P2P.
 */
export async function transferPointsP2P(
  fromWalletId: string,
  toWalletId: string,
  pointsAmount: number,
  description: string,
  txId: string,
  env: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (pointsAmount <= 0) return { success: false, error: 'Importo punti non valido.' };
  if (fromWalletId === toWalletId) return { success: false, error: 'Impossibile trasferire punti a se stessi.' };

  // Addebita mittente
  const debitResult = await syncWalletPointsAtomically({
    walletId: fromWalletId,
    pioneerUsername: '',
    pointsDelta: -pointsAmount,
    merchantPiDelta: 0,
    actionType: 'P2P_TRANSFER_OUT',
    description: 'Trasferimento P2P: ' + description,
    txId: txId + '_out',
  }, env);

  if (!debitResult.synced) {
    return { success: false, error: 'Addebito mittente fallito: ' + debitResult.reason };
  }

  // Accredita destinatario
  const creditResult = await syncWalletPointsAtomically({
    walletId: toWalletId,
    pioneerUsername: '',
    pointsDelta: pointsAmount,
    merchantPiDelta: 0,
    actionType: 'P2P_TRANSFER_IN',
    description: 'Ricevuto P2P: ' + description,
    txId: txId + '_in',
  }, env);

  if (!creditResult.synced) {
    // Rollback mittente se accredito fallisce
    await syncWalletPointsAtomically({
      walletId: fromWalletId,
      pioneerUsername: '',
      pointsDelta: pointsAmount,
      merchantPiDelta: 0,
      actionType: 'P2P_TRANSFER_ROLLBACK',
      description: 'Rollback trasferimento P2P fallito: ' + description,
      txId: 'rollback_' + txId,
    }, env);
    return { success: false, error: 'Accredito destinatario fallito: ' + creditResult.reason };
  }

  return { success: true };
}

/**
 * Assegnazione distintivi (badge) - solo punti, nessun valore monetario.
 */
export async function awardBadge(