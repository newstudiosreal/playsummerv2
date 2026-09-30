-- Da eseguire nel SQL Editor dopo schema.sql e 02_account_delete.sql.
-- Un giocatore PROPONE un evento bonus per sé; l'admin del gruppo lo approva o lo rifiuta.

alter table public.events
  add column if not exists status text not null default 'approved' check (status in ('pending','approved'));

-- Punti ed etichetta arrivano SEMPRE dal catalogo (il client non può barare sui punti).
create or replace function public.events_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare t event_types%rowtype;
begin
  if new.event_type_id is not null then
    select * into t from event_types where id = new.event_type_id and active;
    if not found then raise exception 'Evento non valido'; end if;
    new.label := t.label; new.pts := t.pts;
  end if;
  if new.status = 'pending' then
    if new.event_type_id is null or new.pts <= 0 then raise exception 'Puoi proporre solo eventi bonus'; end if;
    if (select count(*) from events where group_id = new.group_id and user_id = new.user_id and status = 'pending') >= 5 then
      raise exception 'Hai già 5 proposte in attesa';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists events_before_insert on public.events;
create trigger events_before_insert before insert on public.events
  for each row execute function public.events_before_insert();

-- Lettura: tutti vedono gli approvati; le proposte le vedono solo l'owner e chi le ha fatte.
drop policy if exists events_select on public.events;
create policy events_select on public.events for select to authenticated
  using (is_member(group_id) and (status = 'approved' or is_owner(group_id) or user_id = auth.uid()));

-- Un membro può solo proporre per sé, in stato "pending".
create policy events_propose on public.events for insert to authenticated
  with check (is_member(group_id) and user_id = auth.uid() and created_by = auth.uid() and status = 'pending');

-- L'owner approva (unico cambio permesso: pending → approved). Rifiutare = cancellare.
revoke update on public.events from authenticated;
grant  update (status) on public.events to authenticated;
create policy events_approve on public.events for update to authenticated
  using (is_owner(group_id) and status = 'pending') with check (is_owner(group_id) and status = 'approved');

-- Chi ha proposto può ritirare la proposta ancora in attesa.
create policy events_withdraw on public.events for delete to authenticated
  using (status = 'pending' and user_id = auth.uid());

-- La classifica conta solo gli eventi approvati.
create or replace function public.group_leaderboard(p_group uuid)
returns table (user_id uuid, username text, avatar text, pts bigint, n_events bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.avatar, coalesce(sum(e.pts), 0)::bigint, count(e.id)::bigint
  from memberships m
  join profiles p on p.id = m.user_id
  left join events e on e.group_id = m.group_id and e.user_id = m.user_id and e.status = 'approved'
  where m.group_id = p_group and is_member(p_group)
  group by p.id
  order by 4 desc, p.username
$$;
