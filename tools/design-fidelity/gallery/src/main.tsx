import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@pantry/design-system/styles/tokens.css';
import { Gallery } from './Gallery.js';

const rootEl = document.getElementById('root');
if (rootEl === null) throw new Error('Missing #root element');
createRoot(rootEl).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
