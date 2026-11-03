create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('apex_events_retention_90_days','17 3 * * *',$$delete from public.game_events where created_at < now()-interval '90 days'$$);

