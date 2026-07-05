-- Per-project page rules for the commenting layer.
-- 'all'     = commenting is available on every page
-- 'include' = commenting is available only on matching paths
-- 'exclude' = commenting is available everywhere except matching paths
alter table projects
  add column commenting_scope text not null default 'all'
    check (commenting_scope in ('all', 'include', 'exclude')),
  add column commenting_paths text[] not null default '{}';
