begin;
insert into auth.users(id) values('00000000-0000-4000-8000-0000000000a1'),('00000000-0000-4000-8000-0000000000a2');
insert into public.profiles(id,username) values('00000000-0000-4000-8000-0000000000a1','Apex_Verificacao_A'),('00000000-0000-4000-8000-0000000000a2','Apex_Verificacao_B');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a2',true);
select public.sync_game_save('00000000-0000-4000-8000-0000000000a2',0,'{"version":1,"idle":{"v":1,"totalEarned":100,"fragments":1,"playtime":20}}',2,100,1,20);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
select public.sync_game_save('00000000-0000-4000-8000-0000000000a1',0,'{"version":1,"idle":{"v":1,"totalEarned":100,"fragments":1,"playtime":20}}',2,100,1,20);
do $$ declare n integer; begin
 select count(*) into n from public.game_saves; if n<>1 then raise exception 'TEST: RLS leaked another save'; end if;
 select count(*) into n from public.game_saves where user_id='00000000-0000-4000-8000-0000000000a2';if n<>0 then raise exception 'TEST: cross-user save readable';end if;
 begin perform public.sync_game_save('00000000-0000-4000-8000-0000000000a2',1,'{}',2,100,1,20);raise exception 'TEST: cross-user write accepted';exception when others then if sqlerrm not like '%usuario incorreto%' then raise;end if;end;
 begin perform public.sync_game_save('00000000-0000-4000-8000-0000000000a1',0,'{"version":1,"idle":{"v":1,"totalEarned":100,"fragments":1,"playtime":20}}',2,100,1,20);raise exception 'TEST: stale revision accepted';exception when others then if sqlerrm not like '%revision%' then raise;end if;end;
 begin perform public.sync_game_save('00000000-0000-4000-8000-0000000000a1',null,'{"version":1,"idle":{"v":1,"totalEarned":100,"fragments":1,"playtime":20}}',2,100,1,20);raise exception 'TEST: null revision accepted';exception when others then if sqlerrm not like '%revision%' then raise;end if;end;
 begin perform public.sync_game_save('00000000-0000-4000-8000-0000000000a1',1,'{"version":1,"idle":{"v":1,"totalEarned":50,"fragments":1,"playtime":20}}',2,50,1,20);raise exception 'TEST: regression accepted';exception when others then if sqlerrm not like '%progresso nao pode diminuir%' then raise;end if;end;
 begin update public.game_saves set data='{}';raise exception 'TEST: direct write accepted';exception when insufficient_privilege then null;end;
 perform public.sync_game_save('00000000-0000-4000-8000-0000000000a1',1,'{"version":1,"idle":{"v":1,"totalEarned":200,"fragments":3,"playtime":30}}',2,200,3,30);
 select revision into n from public.game_saves;if n<>2 then raise exception 'TEST: revision not incremented';end if;
 select fragments into n from public.weekly_leaderboard where username='Apex_Verificacao_A';if n<>2 then raise exception 'TEST: weekly delta incorrect';end if;
end $$;
set local role anon;
do $$ declare n integer;begin
 select count(*) into n from public.leaderboard;if n<>2 then raise exception 'TEST: public ranking unavailable';end if;
 begin perform data from public.game_saves;raise exception 'TEST: anon can read saves';exception when insufficient_privilege then null;end;
 begin perform public.sync_game_save('00000000-0000-4000-8000-0000000000a1',2,'{}',2,200,3,30);raise exception 'TEST: anon can call writer';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: own-save RLS, cross-user rejection, revision CAS, monotonic progress, weekly delta, public ranking, anon denied; fixtures rolled back' as verification;

