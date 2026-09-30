import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchAllUsers, toggleUserSuspension,
  fetchAllGroups, adminDeleteGroup,
  fetchAllEvents, adminDeleteEvent
} from '../lib/admin-db';
import { go } from '../lib/router';
import { Button, Spinner } from '../components/ui';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'users' | 'groups' | 'events'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      go('/');
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin) {
      alert('Access denied: you are not an admin');
      go('/');
    } else {
      setIsAdmin(true);
      loadData();
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [u, g, e] = await Promise.all([
        fetchAllUsers(),
        fetchAllGroups(),
        fetchAllEvents()
      ]);
      setUsers(u);
      setGroups(g);
      setEvents(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSuspension = async (id: string, current: boolean) => {
    try {
      await toggleUserSuspension(id, !current);
      setUsers(users.map(u => u.id === id ? { ...u, is_suspended: !current } : u));
    } catch (err) { alert('Error updating user'); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Sei sicuro? Questo eliminerà il gruppo e tutti i suoi eventi.')) return;
    try {
      await adminDeleteGroup(id);
      setGroups(groups.filter(g => g.id !== id));
    } catch (err) { alert('Error deleting group'); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Eliminare questo evento?')) return;
    try {
      await adminDeleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) { alert('Error deleting event'); }
  };

  if (isAdmin === null) return <div className="center-screen"><Spinner /></div>;
  if (isAdmin === false) return null;

  return (
    <div className="stack">
      <header className="stack" style={{ marginBottom: '2rem', alignItems: 'start' }}>
        <h1 style={{ margin: 0 }}>Admin Panel</h1>
        <Button variant="ghost" onClick={() => go('/')}>Torna all'App</Button>
      </header>

      <nav className="actions" style={{ marginBottom: '2rem' }}>
        {(['users', 'groups', 'events'] as const).map(t => (
          <Button
            key={t}
            variant={tab === t ? 'sun' : 'ghost'}
            onClick={() => setTab(t)}
          >
            {t === 'users' ? 'Utenti' : t === 'groups' ? 'Gruppi' : 'Eventi'}
          </Button>
        ))}
      </nav>

      {loading ? <Spinner /> : (
        <div className="stack">
          {tab === 'users' && (
            <div className="stack">
              {users.map(u => (
                <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stack">
                    <strong>{u.username}</strong>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>
                      {u.is_suspended ? '🔴 Sospeso' : '🟢 Attivo'}
                    </span>
                  </div>
                  <Button
                    variant={u.is_suspended ? 'sun' : 'danger'}
                    className="btn-sm"
                    onClick={() => handleSuspension(u.id, u.is_suspended)}
                  >
                    {u.is_suspended ? 'Attiva' : 'Sospendi'}
                  </Button>
                </div>
              ))}
              {users.length === 0 && <p className="muted">Nessun utente trovato.</p>}
            </div>
          )}

          {tab === 'groups' && (
            <div className="stack">
              {groups.map(g => (
                <div key={g.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stack">
                    <strong>{g.name}</strong>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>Codice: {g.code}</span>
                  </div>
                  <Button variant="danger" className="btn-sm" onClick={() => handleDeleteGroup(g.id)}>
                    Elimina
                  </Button>
                </div>
              ))}
              {groups.length === 0 && <p className="muted">Nessun gruppo trovato.</p>}
            </div>
          )}

          {tab === 'events' && (
            <div className="stack">
              {events.map(e => (
                <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stack">
                    <strong>{e.label}</strong>
                    <span className="muted" style={{ fontSize: '0.8rem' }}>
                      {e.user?.username || 'Sconosciuto'} · {e.pts} pts
                    </span>
                  </div>
                  <Button variant="danger" className="btn-sm" onClick={() => handleDeleteEvent(e.id)}>
                    Elimina
                  </Button>
                </div>
              ))}
              {events.length === 0 && <p className="muted">Nessun evento trovato.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
