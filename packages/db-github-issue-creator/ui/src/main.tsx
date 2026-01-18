import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@db-ux/core-components/build/styles/rollup.css';
import '@db-ux/db-theme/build/styles/rollup.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
