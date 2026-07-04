-- Guest avatar appearance, controlled by the project owner:
-- 'initial'  = first letter on a deterministic aurora gradient (default)
-- 'gradient' = the gradient orb alone
alter table projects
  add column avatar_style text not null default 'initial'
    check (avatar_style in ('initial', 'gradient'));
