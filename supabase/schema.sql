-- Apex Idle. Execute once in the Supabase SQL Editor; reruns are safe.
begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to anon,authenticated using (true);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert to authenticated with check ((select auth.uid())=id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
grant select on public.profiles to anon,authenticated;
grant insert,update on public.profiles to authenticated;
create table if not exists public.game_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 save_version int not null default 2,
 revision bigint not null default 1 check(revision>0),
 total_earned double precision not null default 0 check(total_earned>=0 and total_earned<1e99),
 fragments bigint not null default 0 check(fragments>=0 and fragments<=9007199254740991),
 playtime_seconds bigint not null default 0 check(playtime_seconds>=0),
 updated_at timestamptz not null default now()
);
alter table public.game_saves enable row level security;
drop policy if exists "saves_read_own" on public.game_saves;
create policy "saves_read_own" on public.game_saves for select to authenticated using ((select auth.uid())=user_id);
-- Writes use the atomic RPC below. Even an authenticated direct REST write is denied.
revoke all on public.game_saves from anon,authenticated;
grant select on public.game_saves to authenticated;
create table if not exists public.weekly_scores (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 fragments bigint not null default 0 check(fragments>=0),
 total_earned double precision not null default 0 check(total_earned>=0 and total_earned<1e99),
 updated_at timestamptz not null default now(),
 primary key(user_id,week_start)
);
alter table public.weekly_scores enable row level security;
revoke all on public.weekly_scores from anon,authenticated;
drop policy if exists "weekly_public_scores" on public.weekly_scores;
create policy "weekly_public_scores" on public.weekly_scores for select to anon,authenticated using(true);
grant select on public.weekly_scores to anon,authenticated;
create table if not exists public.player_scores(user_id uuid primary key references auth.users(id) on delete cascade,fragments bigint not null,total_earned double precision not null,updated_at timestamptz not null default now());
alter table public.player_scores enable row level security;
drop policy if exists "public_score_read" on public.player_scores;
create policy "public_score_read" on public.player_scores for select to anon,authenticated using(true);
revoke all on public.player_scores from anon,authenticated;
grant select on public.player_scores to anon,authenticated;
insert into public.player_scores select user_id,fragments,total_earned,updated_at from public.game_saves on conflict(user_id) do nothing;
create or replace function public.check_save_update()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.revision<>old.revision+1 then raise exception 'revision antiga: outro aparelho salvou depois'; end if;
 if new.total_earned<old.total_earned or new.fragments<old.fragments or new.playtime_seconds<old.playtime_seconds then
  raise exception 'progresso nao pode diminuir';
 end if;
 new.updated_at:=now();return new;
end $$;
drop trigger if exists trg_check_save on public.game_saves;
create trigger trg_check_save before update on public.game_saves for each row execute function public.check_save_update();
create or replace function public.sync_game_save(
 p_user_id uuid,p_expected_revision bigint,p_data jsonb,p_save_version integer,
 p_total_earned double precision,p_fragments bigint,p_playtime_seconds bigint
) returns public.game_saves language plpgsql security definer set search_path='' as $$
declare previous public.game_saves; saved public.game_saves; gained bigint; week date;
begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'usuario incorreto'; end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'revision invalida'; end if;
 if p_save_version is distinct from 2 or (p_data->>'version' not in ('1','2') or p_data->>'version' is null) or p_data#>>'{idle,v}' is distinct from '1' then raise exception 'save invalido'; end if;
 if octet_length(p_data::text)>2000000 then raise exception 'save muito grande'; end if;
 if (p_data#>>'{idle,totalEarned}')::double precision is distinct from p_total_earned or
    (p_data#>>'{idle,fragments}')::bigint is distinct from p_fragments or
    floor((p_data#>>'{idle,playtime}')::double precision)::bigint is distinct from p_playtime_seconds then raise exception 'metricas inconsistentes'; end if;
 if p_total_earned is null or p_total_earned<0 or p_total_earned>=1e99 or p_fragments is null or p_fragments<0 or p_fragments>9007199254740991 or p_playtime_seconds is null or p_playtime_seconds<0 then raise exception 'metricas invalidas'; end if;
 -- Advisory lock also serializes simultaneous first inserts for this user.
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select * into previous from public.game_saves where user_id=p_user_id for update;
 if found then
  if p_expected_revision<>previous.revision then raise exception 'revision antiga: outro aparelho salvou depois'; end if;
  update public.game_saves set data=p_data,save_version=p_save_version,revision=previous.revision+1,
   total_earned=p_total_earned,fragments=p_fragments,playtime_seconds=p_playtime_seconds where user_id=p_user_id returning * into saved;
  gained:=p_fragments-previous.fragments;
 else
  if p_expected_revision<>0 then raise exception 'revision antiga'; end if;
  insert into public.game_saves(user_id,data,save_version,revision,total_earned,fragments,playtime_seconds)
   values(p_user_id,p_data,p_save_version,1,p_total_earned,p_fragments,p_playtime_seconds) returning * into saved;
  gained:=0; -- Imported lifetime fragments do not count as new weekly earnings.
 end if;
 insert into public.player_scores(user_id,fragments,total_earned,updated_at) values(p_user_id,p_fragments,p_total_earned,now()) on conflict(user_id) do update set fragments=excluded.fragments,total_earned=excluded.total_earned,updated_at=now();
 week:=date_trunc('week',now() at time zone 'UTC')::date;
 insert into public.weekly_scores(user_id,week_start,fragments,total_earned) values(p_user_id,week,gained,p_total_earned)
 on conflict(user_id,week_start) do update set fragments=public.weekly_scores.fragments+excluded.fragments,total_earned=excluded.total_earned,updated_at=now();
 return saved;
end $$;
revoke all on function public.sync_game_save(uuid,bigint,jsonb,integer,double precision,bigint,bigint) from public,anon;
grant execute on function public.sync_game_save(uuid,bigint,jsonb,integer,double precision,bigint,bigint) to authenticated;
-- Invoker views read only sanitized public score tables; private save JSON remains behind RLS.
create or replace view public.leaderboard with(security_invoker=true,security_barrier=true) as
 select p.username,s.fragments,s.total_earned,s.updated_at from public.player_scores s join public.profiles p on p.id=s.user_id order by s.fragments desc,s.total_earned desc limit 100;
create or replace view public.weekly_leaderboard with(security_invoker=true,security_barrier=true) as
 select p.username,s.fragments,s.total_earned,s.updated_at,s.week_start from public.weekly_scores s join public.profiles p on p.id=s.user_id
 where s.week_start=date_trunc('week',now() at time zone 'UTC')::date order by s.fragments desc,s.total_earned desc limit 100;
revoke all on public.leaderboard,public.weekly_leaderboard from public;
grant select on public.leaderboard,public.weekly_leaderboard to anon,authenticated;
commit;

