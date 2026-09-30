import { useEffect, useState } from 'react';

const read = () => location.hash.slice(1) || '/';

/** Router minimo basato sull'hash (#/g/ID): link condivisibili e tasto "indietro" funzionante. */
export function useRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => { location.hash = path; };
