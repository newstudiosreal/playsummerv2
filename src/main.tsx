import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/dm-sans/index.css';
import './styles.css';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { ConfirmProvider, ToastProvider } from './components/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);
