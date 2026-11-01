-- Enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique,
  phone text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Create friends table
create table public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  friend_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  status text default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.messages enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Friends Policies
create policy "Users can read friends where user_id = auth.uid()" on public.friends for select using (user_id = auth.uid());
create policy "Users can create friend rows only for themselves" on public.friends for insert with check (user_id = auth.uid());

-- Messages Policies
create policy "Users can read messages where sender_id or receiver_id is uid" on public.messages 
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users can insert messages only where sender_id is uid" on public.messages 
  for insert with check (sender_id = auth.uid());
create policy "Users can update message status where receiver_id is uid" on public.messages 
  for update using (receiver_id = auth.uid());

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.messages;
