import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const VALIDATION_KEY = '41d098c27068bf811f67caeefe5dc094a6304c413d84b17e9e0c5ae364e3af4ac4086bc073ce287d5bdc3f21cdf45a09ea1f1a842d5a6ccd784777aae7a286b7';
const PI_API_BASE = 'https://api.minepi.com/v2';

function getConfiguredPiApiKey(): string {
  const key = (process.env.PI_API_KEY || '').trim();
  if (!key || key === 'MY_PI_API_KEY' || key === 'PLACEHOLDER') return '';
  return key;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Support process.env.PORT (Render/Railway/Cloud Run) and CLI arguments (--port)
  const args = process.argv.slice(2);
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
  let parsedPort = Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
      parsedPort = parseInt(args[i + 1], 10);
    }
  }
  const PORT = parsedPort || 3000;

  // 1. CORS permissivo per tutti i domini (richiesto da Pi Network e bot di validazione)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Header anti-cache rigorosi per Pi Browser mobile (previene blocco cache su smartphone)
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (ua.includes('pibrowser') || ua.includes('pinetwork') || req.url === '/' || req.url.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // 2. Rotta GET esplicita per /validation-key.txt (Massima Priorità Assoluta)
  const sendValidationKey = (_req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Length', '128');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(VALIDATION_KEY);
  };

  app.get('/validation-key.txt', sendValidationKey);
  app.get('/.well-known/validation-key.txt', sendValidationKey);

  // Pagine Legali e Policy accessibili sia con che senza estensione .html
  app.get(['/privacy', '/privacy.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
  });
  app.get(['/terms', '/terms.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'terms.html'));
  });
  app.get(['/specifiche', '/specifiche_tecniche_progetto', '/specifiche_tecniche_progetto.html'], (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'specifiche_tecniche_progetto.html'));
  });

  // 3. Cartelle statiche pubbliche esplicite con supporto MIME .txt
  const publicDir = path.join(process.cwd(), 'public');
  const distDir = path.join(process.cwd(), 'dist');

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    res.json({
      status: 'ok',
      validationKeyAvailable: true,
      piApiConfigured: Boolean(apiKey),
      piMode: apiKey ? 'live_pi_api' : 'structured_fallback',
    });
  });

  // Pi Network SDK Backend Config
  app.get('/api/pi/config', (_req, res) => {
    const apiKey = getConfiguredPiApiKey();
    res.json({
      sandbox: process.env.VITE_PI_SANDBOX === 'true',
      serverConfigured: Boolean(apiKey),
      mode: apiKey ? 'live_pi_api' : 'unavailable',
    });
  });

  // Pi Network Payment Server-Side Approval (/api/pi/approve)
  app.post('/api/pi/approve', async (req, res) => {
    const { paymentId } = req.body || {};
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ approved: false, error: 'paymentId mancante o non valido' });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      return res.status(503).json({
        approved: false,
        paymentId,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il pagamento non può essere approvato e verificato.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          approved: false,
          paymentId,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }
      return res.status(200).json({
        approved: true,
        paymentId,
        mode: 'live_pi_api',
        payment: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(502).json({
        approved: false,
        paymentId,
        mode: 'live_pi_api',
        error: err?.message || 'Errore connessione server Pi Network',
      });
    }
  });

  // Pi Network Payment Server-Side Completion (/api/pi/complete)
  app.post('/api/pi/complete', async (req, res) => {
    const { paymentId, txid } = req.body || {};
    if (!paymentId || typeof paymentId !== 'string' || !txid || typeof txid !== 'string') {
      return res.status(400).json({ completed: false, error: 'paymentId e txid obbligatori' });
    }

    const apiKey = getConfiguredPiApiKey();
    if (!apiKey) {
      return res.status(503).json({
        completed: false,
        paymentId,
        txid,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il pagamento non può essere completato e verificato.',
      });
    }

    try {
      const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          completed: false,
          paymentId,
          txid,
          mode: 'live_pi_api',
          error: data?.message || `Pi API HTTP ${upstream.status}`,
          details: data,
        });
      }
      return res.status(200).json({
        completed: true,
        paymentId,
        txid,
        mode: 'live_pi_api',
        payment: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(502).json({
        completed: false,
        paymentId,
        txid,
        mode: 'live_pi_api',
        error: err?.message || 'Errore completamento pagamento Pi Network',
      });
    }
  });

  // Pi Network App-to-User (A2U) Withdrawal Endpoint (/api/pi/withdraw)
  app.post('/api/pi/withdraw', async (req, res) => {
    const { requestedPi, walletAddress, pioneerUsername, uid } = req.body || {};
    const amountNum = Number(requestedPi);
    if (!Number.isFinite(amountNum) || amountNum < 0.5) {
      return res.status(400).json({
        success: false,
        error: 'La soglia minima di prelievo è di 0.50 π.',
      });
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo Pi Wallet o Username Pioneer non valido.',
      });
    }

    const feeDeducted = 0.01;
    const netPiSent = Number((amountNum - feeDeducted).toFixed(4));
    const apiKey = getConfiguredPiApiKey();

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        mode: 'unavailable',
        error: 'PI_API_KEY non configurata: il prelievo non può essere eseguito.',
      });
    }
    if (!uid || typeof uid !== 'string') {
      return res.status(401).json({
        success: false,
        mode: 'live_pi_api',
        error: 'uid del pioniere mancante: autenticazione Pi richiesta.',
      });
    }

    if (apiKey && uid) {
      try {
        const upstream = await fetch(`${PI_API_BASE}/payments`, {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment: {
              amount: netPiSent,
              memo: `HAVE2WANT Rewards Payout (${pioneerUsername || walletAddress})`,
              metadata: {
                walletAddress: walletAddress.trim(),
                requestedPi: amountNum,
                feePi: feeDeducted,
                pioneerUsername: pioneerUsername || '@pioneer',
              },
              uid,
            },
          }),
        });
        const data = await upstream.json().catch(() => ({}));
        if (upstream.ok && data?.identifier) {
          return res.status(200).json({
            success: true,
            mode: 'live_pi_api',
            paymentId: data.identifier,
            txHash: data.transaction?.txid || `pi_a2u_${data.identifier}`,
            netPiSent,
            feeDeducted,
            walletAddress: walletAddress.trim(),
            timestamp: new Date().toISOString(),
          });
        }
        return res.status(upstream.status || 502).json({
          success: false,
          mode: 'live_pi_api',
          error: data?.message || 'Errore creazione pagamento A2U su Pi Platform API',
        });
      } catch (err: any) {
        return res.status(502).json({
          success: false,
          mode: 'live_pi_api',
          error: err?.message || 'Errore rete Pi Platform API durante prelievo A2U',
        });
      }
    }

    // Fallback non consentito: senza verifica del server non si dichiara alcun prelievo riuscito
    return res.status(500).json({
      success: false,
      mode: 'live_pi_api',
      error: 'Prelievo non completato: risposta non valida dal server Pi Network.',
    });
  });

  // 4. Integrazione Vite (dev) o Dist (produzione)
  const isRunningCompiledServer = Boolean(process.argv[1] && process.argv[1].endsWith('server.cjs'));
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || (isRunningCompiledServer && hasBuiltDist);

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.txt')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
      }
    }));

    // Rotta di fallback corretta per Single Page Application
    app.get('*', (req, res) => {
      const cleanPath = req.path.replace(/\/$/, '');
      if (cleanPath === '/validation-key.txt' || req.url.includes('validation-key.txt')) {
        return sendValidationKey(req, res);
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} already in use, exiting for supervisor restart...`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
