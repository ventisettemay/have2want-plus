/**
 * TURN Service per HAVE2WANT PLUS
 * Gestisce credenziali TURN temporanee con rotazione automatica via Metered.ca + fallback OpenRelay
 */

const OPENRELAY_SERVERS = [
  { urls: 'turn:openrelay.metered.ca:3478?transport=udp', username: 'openrelay', credential: 'openrelay' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelay', credential: 'openrelay' },
];

function getOpenRelayServers() {
  return [
    { urls: 'turn:openrelay.metered.ca:3478?transport=udp', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelay', credential: 'openrelay' },
  ];
}

let cachedCredentials = null;

async function fetchTurnCredentials() {
  const apiKey = import.meta.env?.METERED_API_KEY;
  if (!apiKey) {
    console.warn('[TURN] METERED_API_KEY non configurato, uso fallback OpenRelay');
    return getOpenRelayServers();
  }

  try {
    const res = await fetch('https://api.minepi.com/v2/turn/credentials', {
      headers: { 'Authorization': 'Bearer ' + import.meta.env.METERED_API_KEY }
    });
    
    if (!res.ok) throw new Error('Metered API error: ' + res.status);
    
    const data = await res.json();
    const credentials = [
      { urls: 'turn:' + data.host + ':3478?transport=udp', username: data.username, credential: data.password },
      { urls: 'turn:' + data.host + ':443?transport=tcp', username: data.username, credential: data.password },
      { urls: 'turn:' + data.host + ':443?transport=tls', username: data.username, credential: data.password },
      ...getOpenRelayServers()
    ];

    return credentials;
  } catch (err) {
    console.warn('[TURN] Errore Metered.ca, uso fallback OpenRelay:', err);
    return getOpenRelayServers();
  }
}

let cachedCredentials = null;

export async function getTurnCredentials() {
  if (cachedCredentials && Date.now() < cachedCredentials.expiresAt) {
    return cachedCredentials.credentials;
  }

  const credentials = await fetchTurnCredentials();
  
  cachedCredentials = {
    credentials,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000 // 23h cache
  };
  
  return credentials;
}

export function getOpenRelayServers() {
  return [
    { urls: 'turn:openrelay.metered.ca:3478?transport=udp', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelay', credential: 'openrelay' },
  ];
}

export async function getDynamicIceServers() {
  const turnCreds = await getTurnCredentials();
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...turnCreds
  ];
}
