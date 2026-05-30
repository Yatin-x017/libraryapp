-- =============================================
-- LIBRARY ATTENDANCE & FEE MANAGEMENT SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Staff/Admin table (uses Supabase auth.users)
create table public.staff (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);

-- Members (library patrons)
create table public.members (
  id uuid default gen_random_uuid() primary key,
  member_id text not null unique, -- e.g. "LIB-001"
  name text not null,
  phone text,
  email text,
  address text,
  fee_amount numeric(10,2) not null default 500.00,
  fee_due_day int not null default 1, -- day of month fee is due (1-28)
  is_active boolean default true,
  created_at timestamptz default now(),
  created_by uuid references public.staff(id)
);

-- Attendance records
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  date date not null default current_date,
  marked_by uuid references public.staff(id),
  marked_at timestamptz default now(),
  unique(member_id, date)
);

-- Fee payments
create table public.fee_payments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  amount numeric(10,2) not null,
  month int not null check (month between 1 and 12),
  year int not null,
  paid_on date not null default current_date,
  collected_by uuid references public.staff(id),
  notes text,
  created_at timestamptz default now(),
  unique(member_id, month, year)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.staff enable row level security;
alter table public.members enable row level security;
alter table public.attendance enable row level security;
alter table public.fee_payments enable row level security;

-- Staff can read all staff
create policy "staff can view all staff" on public.staff
  for select using (auth.uid() in (select id from public.staff));

-- Admin can manage staff
create policy "admin can manage staff" on public.staff
  for all using (
    auth.uid() in (select id from public.staff where role = 'admin')
  );

-- All staff can view/add/edit members
create policy "staff can view members" on public.members
  for select using (auth.uid() in (select id from public.staff));
create policy "staff can insert members" on public.members
  for insert with check (auth.uid() in (select id from public.staff));
create policy "staff can update members" on public.members
  for update using (auth.uid() in (select id from public.staff));

-- All staff can manage attendance
create policy "staff can manage attendance" on public.attendance
  for all using (auth.uid() in (select id from public.staff));

-- All staff can manage payments
create policy "staff can manage payments" on public.fee_payments
  for all using (auth.uid() in (select id from public.staff));

-- =============================================
-- SEED: Insert your first admin manually after
-- creating the user in Supabase Auth Dashboard:
--
-- insert into public.staff (id, name, email, role)
-- values ('<your-auth-user-uuid>', 'Admin Name', 'admin@library.com', 'admin');
-- =============================================
