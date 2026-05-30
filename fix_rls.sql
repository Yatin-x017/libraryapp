-- Drop all existing staff policies (they cause recursion)
drop policy if exists "staff can view all staff" on public.staff;
drop policy if exists "admin can manage staff" on public.staff;
drop policy if exists "authenticated can view staff" on public.staff;
drop policy if exists "allow authenticated read staff" on public.staff;
drop policy if exists "allow admin all on staff" on public.staff;

-- Simple non-recursive policies
-- Any logged-in user can read staff (needed to fetch their own profile)
create policy "authenticated users can read staff"
  on public.staff for select
  using (auth.role() = 'authenticated');

-- Any logged-in user can update/insert staff (admin check done in app)
create policy "authenticated users can modify staff"
  on public.staff for all
  using (auth.role() = 'authenticated');
