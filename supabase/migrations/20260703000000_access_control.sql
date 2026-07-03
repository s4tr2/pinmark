-- Per-project access control for the commenting layer.
-- 'open'        = anyone with the prototype URL sees pins and can comment
-- 'review_link' = widget stays dormant unless the visitor arrived via the
--                 secret review link (#pinmark=<review_token>); the token is
--                 required server-side on every read and write.
alter table projects
  add column access_mode text not null default 'open'
    check (access_mode in ('open', 'review_link')),
  add column review_token text not null
    default 'rt_' || replace(gen_random_uuid()::text, '-', '');
