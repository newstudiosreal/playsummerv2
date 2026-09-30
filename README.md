# PlaySummer V2 ☀️

React + TypeScript (Vite) + Supabase. Hosting statico gratuito.

## Setup (una volta)
1. **Supabase → Authentication → Providers → Email:** disattiva *Confirm email*.
2. **Supabase → SQL Editor:** esegui `supabase/schema.sql` (⚠️ cancella le tabelle V1), poi `02_account_delete.sql` e `03_proposals.sql` (in quest'ordine).
3. `cp .env.example .env` e inserisci URL + anon key (Project Settings → API).
4. `npm install` e poi `npm run dev`.

## Deploy gratuito
`npm run build` → cartella `dist/`. Cloudflare Pages / Netlify / GitHub Pages:
build command `npm run build`, output `dist`, e le due variabili `VITE_SUPABASE_*`.

## Sicurezza
La anon key è pubblica per design: la protezione sta nelle policy RLS di `schema.sql`.
Mai mettere nel frontend la `service_role` key né password.

## Struttura
`src/lib` dati e auth · `src/components` UI riusabile · `src/pages` schermate · `supabase/` database

## Deploy su GitHub Pages (gratis)
Repo → Settings → Pages → Source: *GitHub Actions*. Poi Settings → Secrets → Actions:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (e opz. `VITE_CONTACT_EMAIL`, mostrata nella privacy).
Ogni push su `main` ripubblica il sito. Su telefono: menu del browser → "Aggiungi a schermata Home".

## Checklist di test (da fare con 2 account su 2 browser)
1. Registra A e B (username già preso → errore chiaro).
2. A crea un gruppo, B entra col link invito (anche da non loggato).
3. A assegna un evento a B: B vede punti e feed. B propone un evento: compare "In attesa" ad A, che approva (✓) o rifiuta (✕); i punti contano solo dopo l'approvazione.
4. Da console, B prova `supabase.from('events').insert(...)` → deve fallire (RLS).
5. B esce dal gruppo; A elimina il gruppo. Un terzo utente C non vede nulla di A/B.
6. Profilo: cambia avatar e bio; "Cancella account" elimina tutto.
7. Togli la rete: ogni schermata mostra errore con "Riprova", niente pagine bianche.
