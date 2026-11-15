import { describe, it, expect } from 'vitest';

describe('Chat & Sicurezza Autore (authorUid) - Protezione Dati e Integrità', () => {
  interface Message {
    id: string;
    senderUid: string;
    senderUsername: string;
    recipientUid: string;
    text?: string;
    audioUrl?: string;
    audioDuration?: number;
    timestamp: number;
  }

  interface Listing {
    id: string;
    authorUid: string;
    title: string;
    pricePi: number;
    lat: number;
    lng: number;
  }

  // Funzione di validazione sicurezza autore
  function canModifyListing(userUid: string, listing: Listing): boolean {
    if (!userUid || !listing.authorUid) return false;
    return userUid === listing.authorUid;
  }

  // Creazione messaggio sicuro
  function createChatMessage(
    currentUser: { uid: string; username: string },
    recipientUid: string,
    payload: { text?: string; audioUrl?: string; audioDuration?: number }
  ): Message {
    if (!currentUser.uid) {
      throw new Error('Utente non autenticato: impossibile inviare messaggi');
    }
    if (!recipientUid) {
      throw new Error('Destinatario mancante');
    }
    if (!payload.text && !payload.audioUrl) {
      throw new Error('Messaggio vuoto: specificare testo o nota vocale');
    }

    return {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderUid: currentUser.uid,
      senderUsername: currentUser.username,
      recipientUid,
      text: payload.text,
      audioUrl: payload.audioUrl,
      audioDuration: payload.audioDuration,
      timestamp: Date.now(),
    };
  }

  it('Dovrebbe autorizzare le modifiche solo all\'utente possessore di authorUid', () => {
    const listing: Listing = {
      id: 'item_roma_01',
      authorUid: 'pioneer_user_777',
      title: 'Bicicletta Elettrica',
      pricePi: 25.0,
      lat: 41.9028,
      lng: 12.4964,
    };

    // Stesso utente: AUTORIZZATO
    expect(canModifyListing('pioneer_user_777', listing)).toBe(true);

    // Utente diverso o malintenzionato: BLOCCATO
    expect(canModifyListing('attacker_user_999', listing)).toBe(false);

    // Utente anonimo o vuoto: BLOCCATO
    expect(canModifyListing('', listing)).toBe(false);
  });

  it('Dovrebbe comporre correttamente un messaggio testuale nella chat', () => {
    const user = { uid: 'uid_alice', username: '@Alice_Pioneer' };
    const msg = createChatMessage(user, 'uid_bob', { text: 'Ciao! Il prodotto è ancora disponibile a Milano?' });

    expect(msg.senderUid).toBe('uid_alice');
    expect(msg.senderUsername).toBe('@Alice_Pioneer');
    expect(msg.recipientUid).toBe('uid_bob');
    expect(msg.text).toContain('ancora disponibile');
    expect(msg.timestamp).toBeGreaterThan(0);
  });

  it('Dovrebbe gestire correttamente un messaggio vocale (VoiceNoteChat)', () => {
    const user = { uid: 'uid_bob', username: '@Bob_Pioneer' };
    const msg = createChatMessage(user, 'uid_alice', {
      audioUrl: 'blob:https://have2want.app/voice_note_123',
      audioDuration: 7.5,
    });

    expect(msg.audioUrl).toBe('blob:https://have2want.app/voice_note_123');
    expect(msg.audioDuration).toBe(7.5);
    expect(msg.senderUid).toBe('uid_bob');
  });

  it('Dovrebbe rifiutare messaggi privi di mittente autenticato o contenuto', () => {
    expect(() => {
      createChatMessage({ uid: '', username: '' }, 'uid_bob', { text: 'Test' });
    }).toThrow('non autenticato');

    expect(() => {
      createChatMessage({ uid: 'uid_1', username: 'user1' }, '', { text: 'Test' });
    }).toThrow('Destinatario mancante');

    expect(() => {
      createChatMessage({ uid: 'uid_1', username: 'user1' }, 'uid_2', {});
    }).toThrow('Messaggio vuoto');
  });
});
