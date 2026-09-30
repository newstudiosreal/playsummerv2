const mail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

export function Privacy() {
  return (
    <main className="page stack">
      <a className="back" href="#/">← Indietro</a>
      <h1>Privacy</h1>
      <p>PlaySummer è un progetto di NeW Studios, per giocatori dai 14 anni in su.</p>
      <h2>Cosa salviamo</h2>
      <p>Username, password (conservata in forma cifrata), avatar, bio, i gruppi a cui partecipi e i punti assegnati.</p>
      <h2>A cosa serve</h2>
      <p>Solo a far funzionare il gioco. Non vendiamo dati, non mostriamo pubblicità e non usiamo tracker.</p>
      <h2>Chi vede cosa</h2>
      <p>Il tuo profilo e i tuoi punti sono visibili solo a chi è nei tuoi stessi gruppi. I dati sono ospitati su Supabase.</p>
      <h2>Cancellazione</h2>
      <p>Da Profilo → "Cancella il mio account" elimini subito tutti i tuoi dati.</p>
      {mail && <p>Domande? Scrivi a <a href={`mailto:${mail}`}>{mail}</a>.</p>}
    </main>
  );
}
