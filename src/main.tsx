import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/righteous';
import '@fontsource-variable/nunito';
import './styles.css';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/ui';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
