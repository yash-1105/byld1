-- Adds support for variable/range budgets on projects. When is_variable_budget
-- is true, budget_min/budget_max hold the estimated range and budget holds the
-- upper bound (budget_max) so existing budget-vs-spent logic keeps working.
alter table public.projects
  add column if not exists is_variable_budget boolean not null default false,
  add column if not exists budget_min numeric,
  add column if not exists budget_max numeric;
