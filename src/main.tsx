import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as maplibregl from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { H2WProvider } from './lib/h2wContext';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

if (typeof maplibregl.setWorkerUrl === 'function' && mapLibreWorkerUrl) {
  maplibregl.setWorkerUrl(mapLibreWorkerUrl);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <H2WProvider>
        <App />
      </H2WProvider>
    </ErrorBoundary>
  </StrictMode>,
);


