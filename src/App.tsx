import { useEffect, type ReactNode } from 'react';
import { useAuth } from './lib/auth';
import { go, useRoute } from './lib/router';
import { Spinner } from './components/ui';
import { Auth } from './pages/Auth';
import { Group } from './pages/Group';
import { Home } from './pages/Home';
import { Join } from './pages/Join';
import { Privacy } from './pages/Privacy';
import { Profile } from './pages/Profile';

const PENDING = 'ps_pending_join';

function Shell({ route, children }: { route: string; children: ReactNode }) {
  const { profile } = useAuth();
  const onMe = route === '/me';
  return (
    <>
      <header className="topbar">
        <a href="#/" className="logo">Play<span>Summer</span></a>
        <span className="me-chip">{profile?.avatar} {profile?.username}</span>
      </header>
      <main className="page">{children}</main>
      <nav className="tabbar" aria-label="Navigazione">
        <a href="#/" className={onMe ? '' : 'on'}><b>🏖️</b>Gruppi</a>
        <a href="#/me" className={onMe ? 'on' : ''}><b>🙂</b>Profilo</a>
      </nav>
    </>
  );
}

export function App() {
  const route = useRoute();
  const { loading, session, profile } = useAuth();
  const join = route.match(/^\/join\/([A-Za-z0-9]{4,8})$/);
  const group = route.match(/^\/g\/([0-9a-f-]{36})$/);

  // Link invito aperto da non loggati: lo ricordiamo e lo riprendiamo dopo il login.
  useEffect(() => {
    try {
      if (!session && join) sessionStorage.setItem(PENDING, join[1].toUpperCase());
      if (session && profile) {
        const code = sessionStorage.getItem(PENDING);
        if (code) { sessionStorage.removeItem(PENDING); go(`/join/${code}`); }
      }
    } catch { /* storage non disponibile */ }
  }, [session, profile, join]);

  if (route === '/privacy') return <Privacy />;
  if (loading || (session && !profile)) return <Spinner full />;
  if (!session) return <Auth />;

  return (
    <Shell route={route}>
      {join ? <Join code={join[1].toUpperCase()} />
        : group ? <Group id={group[1]} />
        : route === '/me' ? <Profile />
        : <Home />}
    </Shell>
  );
}
