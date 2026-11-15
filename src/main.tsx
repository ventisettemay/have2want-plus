import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { H2WProvider } from './lib/h2wContext';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <H2WProvider>
        <App />
      </H2WProvider>
    </ErrorBoundary>
  </StrictMode>,
);


