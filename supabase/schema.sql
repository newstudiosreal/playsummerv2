-- ════════════════════════════════════════════════════════════════
-- PlaySummer V2 — schema + sicurezza (RLS)
-- Da eseguire UNA VOLTA nel SQL Editor di Supabase.
-- ⚠️ Cancella tutte le tabelle V1 (si riparte da zero).
-- Prima di eseguirlo: Authentication → Providers → Email → disattiva "Confirm email".
-- ════════════════════════════════════════════════════════════════

drop table if exists public.trades, public.messages, public.events,
                     public.leagues, public.users cascade;
drop table if exists public.memberships, public.groups, public.event_types, public.profiles cascade;

-- ── TABELLE ─────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar     text not null default '🏄',
  bio        text check (char_length(bio) <= 80),
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));

create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 40),
  code       text not null unique,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.memberships (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.memberships (user_id);

create table public.event_types (
  id     text primary key,
  label  text not null,
  pts    int  not null,
  active boolean not null default true
);

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event_type_id text references public.event_types(id),
  label         text not null,
  pts           int  not null check (pts between -200 and 200),
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index on public.events (group_id, user_id);

-- ── FUNZIONI DI SUPPORTO (security definer: evitano ricorsioni nelle policy) ──
create function public.is_member(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from memberships where group_id = g and user_id = auth.uid()) $$;

create function public.is_owner(g uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from memberships where group_id = g and user_id = auth.uid() and role = 'owner') $$;

create function public.has_member(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from memberships where group_id = g and user_id = u) $$;

create function public.shares_group(u uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (
     select 1 from memberships a join memberships b on a.group_id = b.group_id
     where a.user_id = auth.uid() and b.user_id = u) $$;

-- ── PROFILO AUTOMATICO ALLA REGISTRAZIONE ───────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RPC: le uniche vie per creare/entrare in un gruppo ──────────
create function public.create_group(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid; c text;
begin
  if auth.uid() is null then raise exception 'Devi accedere'; end if;
  if (select count(*) from groups where owner_id = auth.uid()) >= 5 then
    raise exception 'Puoi creare al massimo 5 gruppi';
  end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from groups where code = c);
  end loop;
  insert into groups (name, code, owner_id) values (trim(p_name), c, auth.uid()) returning id into gid;
  insert into memberships (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;

create function public.join_group(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Devi accedere'; end if;
  select id into gid from groups where code = upper(trim(p_code));
  if gid is null then raise exception 'Codice non valido'; end if;
  if (select count(*) from memberships where group_id = gid) >= 30
     and not has_member(gid, auth.uid()) then
    raise exception 'Gruppo pieno (max 30 giocatori)';
  end if;
  insert into memberships (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;

create function public.group_leaderboard(p_group uuid)
returns table (user_id uuid, username text, avatar text, pts bigint, n_events bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar, coalesce(sum(e.pts), 0)::bigint, count(e.id)::bigint
  from memberships m
  join profiles p on p.id = m.user_id
  left join events e on e.group_id = m.group_id and e.user_id = m.user_id
  where m.group_id = p_group and is_member(p_group)
  group by p.id
  order by 4 desc, p.username
$$;

revoke all on function public.create_group(text), public.join_group(text),
                       public.group_leaderboard(uuid) from public, anon;
grant execute on function public.create_group(text), public.join_group(text),
                          public.group_leaderboard(uuid) to authenticated;

-- ── RLS: tutto chiuso, poi si apre solo ciò che serve ───────────
alter table public.profiles    enable row level security;
alter table public.groups      enable row level security;
alter table public.memberships enable row level security;
alter table public.event_types enable row level security;
alter table public.events      enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or shares_group(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (avatar, bio) on public.profiles to authenticated;

create policy groups_select on public.groups for select to authenticated using (is_member(id));
create policy groups_update on public.groups for update to authenticated
  using (is_owner(id)) with check (is_owner(id));
create policy groups_delete on public.groups for delete to authenticated using (is_owner(id));
revoke update on public.groups from authenticated;
grant  update (name) on public.groups to authenticated;

create policy memberships_select on public.memberships for select to authenticated using (is_member(group_id));
create policy memberships_delete on public.memberships for delete to authenticated
  using (role = 'member' and (user_id = auth.uid() or is_owner(group_id)));

create policy event_types_select on public.event_types for select to authenticated using (true);

create policy events_select on public.events for select to authenticated using (is_member(group_id));
create policy events_insert on public.events for insert to authenticated
  with check (is_owner(group_id) and created_by = auth.uid() and has_member(group_id, user_id));
create policy events_delete on public.events for delete to authenticated using (is_owner(group_id));

-- ── CATALOGO EVENTI V2 (14-25 anni, niente scuola, niente azioni rischiose) ──
insert into public.event_types (id, label, pts) values
  ('alba',            '🌅 Guardare l''alba con gli amici',        40),
  ('tramonto',        '🌇 Tramonto sul mare',                     25),
  ('bagno_gruppo',    '🌊 Bagno in mare con il gruppo',           20),
  ('pizza_colazione', '🍕 Pizza a colazione',                     20),
  ('karaoke',         '🎤 Karaoke in pubblico',                   40),
  ('grigliata',       '🔥 Organizzare una grigliata',             50),
  ('gita',            '🚗 Gita fuori porta last-minute',          60),
  ('posto_nuovo',     '🗺️ Scoprire un posto nuovo',               35),
  ('pigiama_tenda',   '⛺ Pigiama party in tenda',               150),
  ('pigiama',         '🛏️ Pigiama party',                        100),
  ('pineta',          '🌲 Giornata intera in pineta',             30),
  ('gonfiabile',      '🙈 Costume gonfiabile',                    40),
  ('foto_gruppo',     '📸 Foto di gruppo epica',                  25),
  ('nuovo_amico',     '🤝 Conoscere una persona nuova',           30),
  ('concerto',        '🎶 Concerto o evento dal vivo',            45),
  ('beach_volley',    '🏐 Partita di beach volley o calcetto',    30),
  ('numero_ig',       '📱 Scambiare numero o IG con qualcuno',    30),
  ('palo',            '💀 Prendere palo (verificato dal gruppo)', -30),
  ('dimenticato',     '🤦 Dimenticarsi di un evento del gruppo',  -50),
  ('ghosting',        '👻 Ignorare la chat di gruppo per 24h',    -25),
  ('rifiuta_sfida',   '🐔 Rifiutare una sfida del gruppo',        -35),
  ('ritardo',         '🐌 Arrivare con 30+ minuti di ritardo',    -15);
