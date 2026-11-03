create table if not exists public.game_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 event text not null check (length(event) between 1 and 64),
 data jsonb not null default '{}'::jsonb check (octet_length(data::text)<=4096),
 created_at timestamptz not null default now()
);
alter table public.game_events enable row level security;
create index if not exists game_events_user_date on public.game_events(user_id,created_at);
create index if not exists game_events_retention on public.game_events(created_at);
create policy game_events_read_own on public.game_events for select to authenticated using ((select auth.uid())=user_id);
create policy game_events_insert_own on public.game_events for insert to authenticated with check ((select auth.uid())=user_id);
create policy game_events_delete_own on public.game_events for delete to authenticated using ((select auth.uid())=user_id);
revoke all on public.game_events from anon;
grant select,insert,delete on public.game_events to authenticated;
grant usage,select on sequence public.game_events_id_seq to authenticated;
create or replace function public.delete_my_game_data() returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid();
begin
 if owner_id is null then raise exception 'Faça login para excluir dados de jogo'; end if;
 delete from public.game_events where user_id=owner_id;
 delete from public.weekly_scores where user_id=owner_id;
 delete from public.player_scores where user_id=owner_id;
 delete from public.game_saves where user_id=owner_id;
end $$;
revoke all on function public.delete_my_game_data() from public,anon;
grant execute on function public.delete_my_game_data() to authenticated;

