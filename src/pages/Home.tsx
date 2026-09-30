import { useState, type FormEvent } from 'react';
import { createGroup, fetchMyGroups } from '../lib/db';
import { useAuth } from '../lib/auth';
import { go } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { Button, Empty, ErrorBox, Field, Sheet, Spinner, useToast } from '../components/ui';

export function Home() {
  const { profile } = useAuth();
  const { data, error, loading, reload } = useAsync(fetchMyGroups, []);
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null);

  return (
    <>
      <p className="muted" style={{ margin: 0 }}>Ciao,</p>
      <h1>{profile?.username} 🌴</h1>
      <div className="section-title"><h2>I tuoi gruppi</h2></div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <Empty emoji="🏖️" title="Nessun gruppo, ancora">
          Crea un gruppo per la tua comitiva, oppure entra con il codice che ti ha mandato un amico.
        </Empty>
      )}

      <div className="stack">
        {data?.map((g) => (
          <button key={g.id} className="card group-card" onClick={() => go(`/g/${g.id}`)}>
            <strong>{g.name}</strong>
            <span>{g.memberships[0]?.count ?? 1} giocatori · codice {g.code}</span>
          </button>
        ))}
      </div>

      <div className="actions">
        <Button onClick={() => setSheet('create')}>Crea gruppo</Button>
        <Button variant="sea" onClick={() => setSheet('join')}>Ho un codice</Button>
      </div>

      {sheet === 'create' && <CreateSheet onClose={() => setSheet(null)} />}
      {sheet === 'join' && <JoinSheet onClose={() => setSheet(null)} />}
    </>
  );
}

function CreateSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const id = await createGroup(name);
      toast('Gruppo creato 🎉');
      go(`/g/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title="Nuovo gruppo" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Nome del gruppo" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={40} required autoFocus />
        {error && <ErrorBox message={error} />}
        <Button type="submit" busy={busy}>Crea</Button>
      </form>
    </Sheet>
  );
}

function JoinSheet({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  return (
    <Sheet title="Entra in un gruppo" onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); go(`/join/${code.trim().toUpperCase()}`); }}>
        <Field label="Codice (6 caratteri)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
               maxLength={6} minLength={6} autoCapitalize="characters" required autoFocus />
        <Button type="submit" variant="sea">Entra</Button>
      </form>
    </Sheet>
  );
}
