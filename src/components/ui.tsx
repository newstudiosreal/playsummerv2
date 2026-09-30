import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type Variant = 'sun' | 'sea' | 'ghost' | 'danger';

export function Button({ variant = 'sun', busy, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button type="button" {...p} disabled={p.disabled || busy} aria-busy={busy} className={`btn btn-${variant} ${p.className ?? ''}`}>
      {busy ? '…' : children}
    </button>
  );
}

export function Field({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field"><span>{label}</span><input {...p} /></label>;
}

/** Schermo intero: cerchio che gira. Nelle pagine: scheletri, come nel sito di esempio. */
export const Spinner = ({ full }: { full?: boolean }) =>
  full
    ? <div className="center-screen" role="status" aria-label="Caricamento"><div className="spinner" /></div>
    : <div className="stack" role="status" aria-label="Caricamento">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>;

export const Empty = ({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) => (
  <div className="empty"><div className="empty-emoji" aria-hidden>{emoji}</div><h3>{title}</h3>{children && <p>{children}</p>}</div>
);

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="error-box" role="alert"><p style={{ margin: 0 }}>{message}</p>{onRetry && <Button variant="ghost" onClick={onRetry}>Riprova</Button>}</div>
);

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', on);
    return () => document.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal aria-label={title}>
        <div className="sheet-head"><h2>{title}</h2><Button variant="ghost" className="btn-sm" onClick={onClose} aria-label="Chiudi">✕</Button></div>
        {children}
      </div>
    </div>
  );
}

// Conferma in stile app (al posto del confirm() del browser, brutto su mobile).
interface ConfirmOpts { title: string; text?: string; confirm?: string; danger?: boolean }
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<{ o: ConfirmOpts; res: (v: boolean) => void } | null>(null);
  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((res) => setSt({ o, res })), []);
  const done = (v: boolean) => { st?.res(v); setSt(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {st && (
        <Sheet title={st.o.title} onClose={() => done(false)}>
          {st.o.text && <p className="muted">{st.o.text}</p>}
          <div className="actions">
            <Button variant="ghost" onClick={() => done(false)}>Annulla</Button>
            <Button variant={st.o.danger ? 'danger' : 'sun'} onClick={() => done(true)}>{st.o.confirm ?? 'Conferma'}</Button>
          </div>
        </Sheet>
      )}
    </ConfirmCtx.Provider>
  );
}

// Toast fuori dall'albero delle pagine: mostrarlo NON ricostruisce la pagina (bug V1 risolto).
type Kind = 'ok' | 'error' | 'info';
const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<{ id: number; msg: string; kind: Kind }[]>([]);
  const toast = useCallback((msg: string, kind: Kind = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-2), { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3000);
  }, []);
  const value = useMemo(() => toast, [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status">{list.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.msg}</div>)}</div>
    </ToastCtx.Provider>
  );
}
