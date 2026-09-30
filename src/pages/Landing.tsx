import { go } from '../lib/router';
import { Button } from '../components/ui';

// Esempi presi dal catalogo reale degli eventi.
const SHOWCASE: [string, number][] = [
  ['🌅 Alba con gli amici', 40], ['⛺ Pigiama party in tenda', 150], ['🎤 Karaoke in pubblico', 40],
  ['🍕 Pizza a colazione', 20], ['💀 Prendere palo', -30], ['🐌 Arrivare in ritardo', -15],
];
const WAVE = 'M0 30 Q75 0 150 30 T300 30 T450 30 T600 30 T750 30 T900 30 T1050 30 T1200 30 V60 H0Z';

export function Landing() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>PLAYSUMMER</h1>
          <p className="tag"><span className="marker">Sfida i tuoi amici. Vinci l'estate.</span></p>
          <p className="lead">Crea il gruppo, segna le cose che fate quest'estate e scala la classifica. Chi sarà Re o Regina dell'Estate?</p>
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 20 }}>
            <Button className="btn-lg" onClick={() => go('/registrati')}>Gioca ora</Button>
            <Button variant="ghost" className="btn-lg" onClick={() => go('/regole')}>Come funziona</Button>
          </div>
          <p className="hint" style={{ marginTop: 14 }}>Hai già un account? <a href="#/accedi"><b>Accedi</b></a></p>
        </div>
        <div className="sign" aria-label="Esempi di punteggi">
          <h3>Tabellone di oggi</h3>
          <ul>{SHOWCASE.map(([label, pts]) => (
            <li key={label}><span>{label}</span><span className={`p ${pts > 0 ? 'pos' : 'neg'}`}>{pts > 0 ? `+${pts}` : pts}</span></li>
          ))}</ul>
        </div>
      </section>

      <div className="waves" aria-hidden>
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d={WAVE} fill="var(--wave-1)" /></svg>
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d={WAVE} fill="var(--wave-2)" /></svg>
      </div>

      <section style={{ marginTop: 34 }}>
        <h2>Come funziona</h2>
        <div className="steps">
          <div className="step"><h3>Fai il gruppo</h3><p>Crea un gruppo per la tua comitiva e manda il link o il codice a sei caratteri.</p></div>
          <div className="step"><h3>Segna le imprese</h3><p>Hai fatto l'alba o il karaoke? Proponi l'evento: l'admin lo conferma e i punti arrivano.</p></div>
          <div className="step"><h3>Scala la classifica</h3><p>Chi ha più punti a fine estate è il Re (o la Regina) dell'Estate.</p></div>
        </div>
      </section>
    </>
  );
}
