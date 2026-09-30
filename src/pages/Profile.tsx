import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { deleteAccount, updateProfile } from '../lib/db';
import { Button, Field, useToast } from '../components/ui';

const AVATARS = ['🏄', '😎', '🦩', '🍉', '🌴', '🐬', '🦀', '🍦', '🎸', '⚡', '🔥', '🌈'];

export function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const [avatar, setAvatar] = useState(profile?.avatar ?? '🏄');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  const save = async () => {
    setBusy(true);
    try { await updateProfile(profile.id, avatar, bio.trim() || null); await refreshProfile(); toast('Profilo salvato ✅'); }
    catch (e) { toast((e as Error).message); }
    setBusy(false);
  };
  const remove = async () => {
    if (!confirm('Cancellare account, gruppi creati ed eventi? Non si può annullare.')) return;
    try { await deleteAccount(); await signOut(); } catch (e) { toast((e as Error).message); }
  };

  return (
    <div className="stack">
      <h1>{avatar} {profile.username}</h1>
      <div className="card stack">
        <span className="label">Il tuo avatar</span>
        <div className="emoji-grid">
          {AVATARS.map((a) => (
            <button key={a} type="button" aria-pressed={a === avatar} onClick={() => setAvatar(a)}>{a}</button>
          ))}
        </div>
        <Field label="Bio (max 80 caratteri)" value={bio} maxLength={80} onChange={(e) => setBio(e.target.value)} />
        <Button busy={busy} onClick={save}>Salva</Button>
      </div>
      <Button variant="ghost" onClick={signOut}>Esci</Button>
      <a className="hint center" href="#/privacy">Informativa privacy</a>
      <Button variant="danger" onClick={remove}>Cancella il mio account</Button>
    </div>
  );
}
