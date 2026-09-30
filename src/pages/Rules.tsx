export function Rules() {
  return (
    <div className="stack">
      <h1>Come si gioca</h1>
      <p className="lead"><span className="marker">Quattro regole, nessun trucco.</span></p>
      <div className="steps" style={{ gridTemplateColumns: '1fr' }}>
        <div className="step"><h3>1 · Il gruppo</h3><p>Crei un gruppo (fino a 30 giocatori) o entri con un codice. Chi lo crea è l'admin.</p></div>
        <div className="step"><h3>2 · I punti</h3><p>Ogni evento ha un valore. Puoi proporre i tuoi bonus; l'admin li conferma. I malus li assegna solo l'admin.</p></div>
        <div className="step"><h3>3 · La classifica</h3><p>Conta solo ciò che è confermato. In cima c'è la corona 👑.</p></div>
        <div className="step"><h3>4 · Fair play</h3><p>Niente sfide pericolose e niente prese in giro pesanti: si vince divertendosi insieme. Se un evento mette qualcuno a disagio, l'admin lo annulla.</p></div>
      </div>
    </div>
  );
}
