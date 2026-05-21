import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FinniRoot } from '@/FinniRoot';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <FinniRoot />
  </StrictMode>,
);
