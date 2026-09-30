-- Da eseguire una volta nel SQL Editor (dopo schema.sql).
-- Permette a ogni utente di cancellare il proprio account e tutti i suoi dati.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Devi accedere'; end if;
  delete from auth.users where id = auth.uid();  -- profilo, membership ed eventi cadono a cascata
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
