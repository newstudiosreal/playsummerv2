import { useState, type FormEvent } from 'react';
import { addEvent, approveEvent, deleteEvent, deleteGroup, fetchEventTypes, fetchFeed, fetchGroup, fetchLeaderboard, fetchPending, leaveGroup, proposeEvent } from '../lib/db';
import { useAuth } from '../lib/auth';
import { go } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import type { LeaderRow } from '../lib/types';
import { Button, Empty, ErrorBox, Sheet, Spinner, useToast } from '../components/ui';

const MEDAL = ['👑', '🥈', '🥉'];
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function Group({ id }: { id: string }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [assign, setAssign] = useState(false);
  const { data, error, loading, reload } = useAsync(async () => {
    const [group, board, feed, pending] = await Promise.all([fetchGroup(id), fetchLeaderboard(id), fetchFeed(id), fetchPending(id)]);
    return { group, board, feed, pending };
  }, [id]);

  if (loading && !data) return <Spinner />;
  if (error || !data) {
    return (
      <div className="stack">
        <ErrorBox message={error ?? 'Gruppo non trovato, oppure non ne fai parte.'} onRetry={reload} />
        <Button variant="ghost" onClick={() => go('/')}>Torna ai tuoi gruppi</Button>
      </div>
    );
  }

  const { group, board, feed, pending } = data;
  const isOwner = group.owner_id === profile?.id;
  const inviteLink = `${location.origin}${location.pathname}#/join/${group.code}`;
  const act = async (fn: () => Promise<unknown>, after: () => void) => {
    try { await fn(); after(); } catch (e) { toast((e as Error).message); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteLink); toast('Link copiato 📋'); }
    catch { toast('Copia non riuscita: seleziona il codice a mano'); }
  };

  return (
    <>
      <button className="back" onClick={() => go('/')}>← Gruppi</button>
      <h1>{group.name}</h1>

      <div className="card invite">
        <div><small>Codice invito</small><div className="code">{group.code}</div></div>
        <Button variant="sea" onClick={copy}>Copia link</Button>
      </div>

      <div className="row between"><h2>Classifica</h2>
        <Button onClick={() => setAssign(true)}>{isOwner ? '+ Assegna punti' : '+ Proponi evento'}</Button>
      </div>
      {board.every((r) => r.pts === 0) && (
        <Empty emoji="🌴" title="Ancora nessun punto">
          Tocca il pulsante in alto: {isOwner ? 'assegna' : 'proponi'} il primo evento della stagione.
        </Empty>
      )}
      <ol className="board">
        {board.map((r, i) => (
          <li key={r.user_id} className={`${i === 0 && r.pts > 0 ? 'first' : ''} ${r.user_id === profile?.id ? 'me' : ''}`}>
            <span className="rank">{r.pts > 0 && MEDAL[i] ? MEDAL[i] : i + 1}</span>
            <span className="avatar" aria-hidden>{r.avatar}</span>
            <span className="name">{r.username}{r.user_id === profile?.id && ' (tu)'}</span>
            <span className="pts">{sign(r.pts)}</span>
          </li>
        ))}
      </ol>

      {pending.length > 0 && (
        <>
          <h2>In attesa di conferma</h2>
          <ul className="feed">
            {pending.map((f) => (
              <li key={f.id}>
                <span>{f.user?.avatar} <strong>{f.user?.username}</strong> {f.label}</span>
                <span className="up">{sign(f.pts)}</span>
                {isOwner && <button className="x ok" aria-label="Approva" onClick={() => act(() => approveEvent(f.id), reload)}>✓</button>}
                {(isOwner || f.user_id === profile?.id) && (
                  <button className="x" aria-label={isOwner ? 'Rifiuta' : 'Ritira'} onClick={() => act(() => deleteEvent(f.id), reload)}>✕</button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Ultimi eventi</h2>
      {feed.length === 0 && <p className="hint">Qui vedrai cosa succede nel gruppo.</p>}
      <ul className="feed">
        {feed.map((f) => (
          <li key={f.id}>
            <span>{f.user?.avatar} <strong>{f.user?.username}</strong> {f.label}</span>
            <span className={f.pts > 0 ? 'up' : 'down'}>{sign(f.pts)}</span>
            {isOwner && (
              <button className="x" aria-label="Annulla evento"
                onClick={() => confirm('Annullare questo evento?') && act(() => deleteEvent(f.id), reload)}>✕</button>
            )}
          </li>
        ))}
      </ul>

      <div className="actions">
        {isOwner
          ? <Button variant="danger" onClick={() => confirm(`Eliminare "${group.name}" per tutti?`) && act(() => deleteGroup(group.id), () => go('/'))}>Elimina gruppo</Button>
          : <Button variant="ghost" onClick={() => profile && confirm(`Uscire da "${group.name}"?`) && act(() => leaveGroup(group.id, profile.id), () => go('/'))}>Esci dal gruppo</Button>}
      </div>

      {assign && profile && (isOwner
        ? <AssignSheet groupId={group.id} board={board} me={profile.id}
            onClose={() => setAssign(false)} onDone={() => { setAssign(false); reload(); }} />
        : <ProposeSheet groupId={group.id} me={profile.id}
            onClose={() => setAssign(false)} onDone={() => { setAssign(false); reload(); }} />)}
    </>
  );
}

function AssignSheet({ groupId, board, me, onClose, onDone }: {
  groupId: string; board: LeaderRow[]; me: string; onClose: () => void; onDone: () => void;
}) {
  const types = useAsync(fetchEventTypes, []);
  const [user, setUser] = useState(board[0]?.user_id ?? '');
  const [typeId, setTypeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = types.data?.find((x) => x.id === typeId);
    if (!t) return setError('Scegli un evento.');
    setBusy(true); setError(null);
    try { await addEvent(groupId, user, t, me); toast(`${sign(t.pts)} punti 🎉`); onDone(); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <Sheet title="Assegna punti" onClose={onClose}>
      {types.loading && <Spinner />}
      {types.error && <ErrorBox message={types.error} onRetry={types.reload} />}
      {types.data && (
        <form className="stack" onSubmit={submit}>
          <label className="field"><span>Giocatore</span>
            <select value={user} onChange={(e) => setUser(e.target.value)}>
              {board.map((r) => <option key={r.user_id} value={r.user_id}>{r.avatar} {r.username}</option>)}
            </select>
          </label>
          <label className="field"><span>Evento</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
              <option value="">Scegli…</option>
              {types.data.map((t) => <option key={t.id} value={t.id}>{t.label} ({sign(t.pts)})</option>)}
            </select>
          </label>
          {error && <ErrorBox message={error} />}
          <Button type="submit" busy={busy}>Assegna</Button>
        </form>
      )}
    </Sheet>
  );
}

function ProposeSheet({ groupId, me, onClose, onDone }: { groupId: string; me: string; onClose: () => void; onDone: () => void }) {
  const types = useAsync(fetchEventTypes, []);
  const [typeId, setTypeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = types.data?.find((x) => x.id === typeId);
    if (!t) return setError('Scegli un evento.');
    setBusy(true); setError(null);
    try { await proposeEvent(groupId, me, t); toast('Proposta inviata: aspetta la conferma ✋'); onDone(); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <Sheet title="Proponi un evento" onClose={onClose}>
      {types.loading && <Spinner />}
      {types.error && <ErrorBox message={types.error} onRetry={types.reload} />}
      {types.data && (
        <form className="stack" onSubmit={submit}>
          <p className="hint">Scegli cosa hai fatto: i punti arrivano quando l'admin del gruppo conferma.</p>
          <label className="field"><span>Cosa hai fatto?</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
              <option value="">Scegli…</option>
              {types.data.filter((t) => t.pts > 0).map((t) => <option key={t.id} value={t.id}>{t.label} ({sign(t.pts)})</option>)}
            </select>
          </label>
          {error && <ErrorBox message={error} />}
          <Button type="submit" busy={busy}>Invia proposta</Button>
        </form>
      )}
    </Sheet>
  );
}
