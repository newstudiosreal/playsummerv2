import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type Variant = 'sun' | 'sea' | 'ghost' | 'danger';

export function Button({ variant = 'sun', busy, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button {...p} disabled={p.disabled || busy} className={`btn btn-${variant} ${p.className ?? ''}`}>
      {busy ? 'Un attimo…' : children}
    </button>
  );
}

export function Field({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...p} />
    </label>
  );
}

export const Spinner = ({ full }: { full?: boolean }) => (
  <div className={full ? 'center-screen' : 'center-block'} role="status" aria-label="Caricamento">
    <div className="spinner" />
  </div>
);

export const Empty = ({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) => (
  <div className="empty">
    <div className="empty-emoji" aria-hidden>{emoji}</div>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
  </div>
);

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="error-box" role="alert">
    <p>{message}</p>
    {onRetry && <Button variant="ghost" onClick={onRetry}>Riprova</Button>}
  </div>
);

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// Toast fuori dall'albero delle pagine: mostrarlo NON ricostruisce la pagina (bug V1 risolto).
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2800);
  }, []);
  const value = useMemo(() => toast, [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}
