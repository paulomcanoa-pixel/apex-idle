do $migration$
declare definition text;
begin
 select pg_get_functiondef('public.sync_game_save(uuid,bigint,jsonb,integer,double precision,bigint,bigint)'::regprocedure) into definition;
 if position('p_data->>''version'' is distinct from ''1''' in definition)=0 then raise exception 'Contrato inesperado; migração abortada'; end if;
 definition:=replace(definition,'p_data->>''version'' is distinct from ''1''','(p_data->>''version'' not in (''1'',''2'') or p_data->>''version'' is null)');
 execute definition;
end $migration$;

