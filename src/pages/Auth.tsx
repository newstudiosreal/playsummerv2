import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { go } from '../lib/router';
import { Button, ErrorBox, Field } from '../components/ui';

export function Auth({ mode: initial }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initial);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const err = await (mode === 'login' ? signIn : signUp)(username.trim(), password);
    if (err) setError(err); else go('/');
    setBusy(false);
  };

  return (
    <div className="auth stack">
      <h1>{mode === 'login' ? 'BENTORNATO ☀️' : 'ENTRA IN GIOCO 🏖️'}</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Accedi</button>
        <button role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Crea account</button>
      </div>
      <form className="card stack" onSubmit={submit}>
        <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)}
               autoComplete="username" autoCapitalize="none" maxLength={20} required />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
        {error && <ErrorBox message={error} />}
        <Button type="submit" busy={busy} className="btn-lg">{mode === 'login' ? 'Entra' : 'Crea account'}</Button>
        {mode === 'register' && <p className="hint">Registrandoti confermi di avere almeno 14 anni.</p>}
      </form>
      <a className="hint center" href="#/privacy">Informativa privacy</a>
    </div>
  );
}
