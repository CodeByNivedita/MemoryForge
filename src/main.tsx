import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Platform from './Platform.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Platform />
  </StrictMode>
);
