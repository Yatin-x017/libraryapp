# 📚 LibraryOS — Attendance & Fee Management

A React + Supabase web app to manage attendance and monthly fees for 300+ library members, with multi-staff role support.

## Features

- ✅ **Mark Attendance** — Click-to-toggle cards for all members, bulk mark all present, search by name/ID, select any date
- 💰 **Fee Payments** — Record payments, track who has/hasn't paid per month, auto-calculate amounts
- ⚠️ **Overdue Alerts** — See all members who haven't paid, with overdue badges, copy list to clipboard
- 👥 **Member Management** — Add/edit 300+ members, set custom fee amount & due day per member
- 🔐 **Staff Roles** — Admin can manage staff; staff can mark attendance and record fees
- 📊 **Dashboard** — Daily stats, today's attendance, overdue count

---

## Setup

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your project, go to **SQL Editor** and paste the contents of `supabase_schema.sql`
3. Run it — this creates all tables, RLS policies, and indexes

### 2. Create Your First Admin User

1. In Supabase dashboard → **Authentication → Users** → Invite user (enter your email)
2. Accept the invite and set your password
3. Copy your user's UUID from the Users table
4. Run this in SQL Editor (replace the values):
   ```sql
   insert into public.staff (id, name, email, role)
   values ('<your-uuid>', 'Your Name', 'your@email.com', 'admin');
   ```

### 3. Local Development

```bash
# Clone / copy the project
cd library-app

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Fill in your Supabase URL and anon key from:
# Supabase dashboard → Settings → API

# Start dev server
npm run dev
```

### 4. Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm install -g vercel
vercel

# Option 2: Push to GitHub, then import in Vercel dashboard
# Set environment variables in Vercel:
# VITE_SUPABASE_URL = https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY = your-anon-key
```

The `vercel.json` file is already configured for SPA routing.

---

## Environment Variables

| Variable | Where to find |
|----------|--------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |

---

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx      # Auth state, login, logout
├── components/
│   └── layout/
│       └── Layout.jsx       # Sidebar + main content shell
├── pages/
│   ├── LoginPage.jsx        # Login form
│   ├── Dashboard.jsx        # Stats overview
│   ├── AttendancePage.jsx   # Mark attendance (core feature)
│   ├── MembersPage.jsx      # Add/edit members
│   ├── FeesPage.jsx         # Record fee payments
│   ├── OverduePage.jsx      # Overdue alerts
│   └── StaffPage.jsx        # Staff management (admin only)
├── lib/
│   └── supabase.js          # Supabase client
├── index.css                # All styles
└── App.jsx                  # Routes + auth guards
```

---

## Adding Members in Bulk

If you have a CSV of existing members, you can bulk-insert via Supabase SQL Editor:

```sql
insert into public.members (member_id, name, phone, email, fee_amount, fee_due_day)
values
  ('LIB-001', 'Ravi Kumar', '9876543210', 'ravi@email.com', 500, 5),
  ('LIB-002', 'Priya Singh', '9123456789', 'priya@email.com', 500, 5),
  -- ... add all 300+ members
;
```

Or use the Supabase Table Editor to import a CSV directly.
