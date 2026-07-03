-- Fixed-window rate-limit counters (PRD §6.1). DB-backed because the hosted
-- API runs on stateless serverless functions where in-memory counters reset
-- per instance; this also works unchanged for self-hosters (no Redis).

create table rate_limits (
  bucket text primary key,          -- '<kind>:<public_key>:<ip>:<window_no>'
  count int not null default 1,
  expires_at timestamptz not null
);

create index on rate_limits (expires_at);

alter table rate_limits enable row level security;
-- service-role only: no policies

create or replace function bump_rate_limit(p_bucket text, p_ttl_seconds int)
returns int
language plpgsql
as $$
declare
  v_count int;
begin
  -- opportunistic cleanup of expired windows
  delete from rate_limits where expires_at < now();

  insert into rate_limits (bucket, count, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_ttl_seconds))
  on conflict (bucket)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count;
end;
$$;
