import { useEffect, type ReactNode } from 'react';
import { useAuth } from './lib/auth';
import { go, useRoute } from './lib/router';
import { useTheme } from './lib/theme';
import { IconBook, IconMoon, IconSun, IconUser, IconUsers } from './components/icons';
// @ts-ignore
import { IconShield } from './components/icons';
import { Spinner } from './components/ui';
import { Auth } from './pages/Auth';
import { Group } from './pages/Group';
import { Home } from './pages/Home';
import { Join } from './pages/Join';
import { Landing } from './pages/Landing';
import { Privacy } from './pages/Privacy';
import { Profile } from './pages/Profile';
import { Rules } from './pages/Rules';
import Admin from './pages/Admin';

const PENDING = 'ps_pending_join';
const NAV = [
  { to: '/', label: 'Gruppi', Icon: IconUsers },
  { to: '/regole', label: 'Regole', Icon: IconBook },
  { to: '/me', label: 'Profilo', Icon: IconUser },
];

function Shell({ route, authed, children }: { route: string; authed: boolean; children: ReactNode }) {
  const { profile } = useAuth();
  const { theme, toggle } = useTheme();
  const active = (to: string) => (to === '/' ? route === '/' || route.startsWith('/g/') || route.startsWith('/join/') : route === to);
  const items = authed ? NAV : NAV.filter((n) => n.to === '/regole');
  return (
    <>
      <header className="topbar">
        <a href="#/" className="logo" aria-label="PlaySummer, home"><i />PLAYSUMMER</a>
        <nav className="topnav" aria-label="Principale">
          {items.map((n) => <a key={n.to} href={`#${n.to}`} className={active(n.to) ? 'active' : ''}>{n.label}</a>)}
        </nav>
        <span className="spacer" />
        <button className="btn btn-ghost iconbtn" onClick={toggle} aria-label={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}>
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        {authed
          ? <a href="#/me" className="avatar" aria-label="Il tuo profilo">{profile?.avatar}</a>
          : <><a href="#/accedi" className="btn btn-sm hide-xs">Accedi</a><a href="#/registrati" className="btn btn-sm btn-sun">Registrati</a></>}
      </header>
      <main className="page">{children}</main>
      <footer className="foot">Un progetto NeW Studios</footer>
      {authed && (
        <nav className="bottomnav" aria-label="Principale mobile">
          {NAV.map((n) => <a key={n.to} href={`#${n.to}`} className={active(n.to) ? 'active' : ''}><n.Icon />{n.label}</a>)}
        </nav>
      )}
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

  if (loading || (session && !profile)) return <Spinner full />;

  let page: ReactNode;
  if (route === '/privacy') page = <Privacy />;
  else if (route === '/regole') page = <Rules />;
  else if (!session) {
    page = route === '/accedi' ? <Auth key="l" mode="login" />
      : route === '/registrati' || join ? <Auth key="r" mode="register" /> : <Landing />;
  } else {
    page = join ? <Join code={join[1].toUpperCase()} /> : group ? <Group id={group[1]} />
      : route === '/admin' ? <Admin />
      : route === '/me' ? <Profile /> : <Home />;
  }
  return <Shell route={route} authed={!!session}>{page}</Shell>;
}
