-- Scale pass: cleanup of expired rate-limit windows becomes probabilistic
-- (~2% of calls) instead of running on every call. The every-call DELETE
-- serializes under load. Single-quoted body: the SQL editor mangles $$.
create or replace function bump_rate_limit(p_bucket text, p_ttl_seconds int)
returns int language plpgsql as '
declare
  v_count int;
begin
  if random() < 0.02 then
    delete from rate_limits where expires_at < now();
  end if;
  insert into rate_limits (bucket, count, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_ttl_seconds))
  on conflict (bucket)
  do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count;
end;
';
