// Server Worker Cloudflare — entry-point per deploy su Cloudflare Pages / Workers Assets.
// Gestisce le route API (/api/*, inclusa verifica pagamenti Pi tramite env.PI_API_KEY)
// e delega a env.ASSETS.fetch(request) per tutto il resto (SPA single-page-application).

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  PI_API_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const API_PREFIX = '/api/';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // --- Route API -----------------------------------------------------------
    if (url.pathname.startsWith(API_PREFIX)) {
      return handleApi(request, env, url);
    }

    // --- Tutto il resto: servi gli asset statici (build Vite in ./dist) -----
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  // Verifica pagamenti Pi tramite env.PI_API_KEY (header x-pi-api-key o Authorization: Bearer)
  if (url.pathname.startsWith('/api/pi/')) {
    const providedKey =
      request.headers.get('x-pi-api-key') ??
      request.headers.get('authorization')?.replace(/^Bearer\s*/i, '') ??
      '';

    if (!env.PI_API_KEY || providedKey !== env.PI_API_KEY) {
      return Response.json(
        { ok: false, error: 'Non autorizzato: chiave Pi mancante o non valida' },
        { status: 401 },
      );
    }

    // Endpoint verifica pagamento Pi (POST /api/pi/verify)
    if (url.pathname === '/api/pi/verify' && request.method === 'POST') {
      try {
        const body = await request.json();
        // Placeholder: la logica reale di verifica va implementata sul backend /api/pi/*
        return Response.json({
          ok: true,
          verified: false,
          message: 'Verifica pagamento Pi non implementata lato Worker',
          received: body,
        });
      } catch {
        return Response.json(
          { ok: false, error: 'Body JSON non valido' },
          { status: 400 },
        );
      }
    }

    return Response.json(
      { ok: false, error: 'Endpoint Pi non trovato' },
      { status: 404 },
    );
  }

  // Altri endpoint /api/* non gestiti direttamente dal Worker
  return Response.json(
    { ok: false, error: 'Endpoint API non disponibile' },
    { status: 404 },
  );
}
