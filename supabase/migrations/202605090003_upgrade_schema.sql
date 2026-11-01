-- Enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- Drop old tables if they exist to start fresh
drop publication if exists supabase_realtime;
drop table if exists public.messages cascade;
drop table if exists public.friends cascade;
drop table if exists public.friend_requests cascade;
drop table if exists public.blocked_users cascade;
drop table if exists public.profiles cascade;
drop function if exists public.accept_friend_request cascade;

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique not null,
  phone_encrypted text not null,
  phone_hash text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Create friend_requests table
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique(sender_id, receiver_id)
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
  body_encrypted text not null,
  body_preview text,
  status text default 'sent' check (status in ('sent', 'delivered', 'read')),
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Create blocked_users table
create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

-- Profiles Indexes
create index on public.profiles(username);
create index on public.profiles(phone_hash);

-- Friend Requests Indexes
create index on public.friend_requests(sender_id, receiver_id, status);

-- Friends Indexes
create index on public.friends(user_id, friend_id);

-- Messages Indexes
create index on public.messages(sender_id, receiver_id, created_at);
create index on public.messages(receiver_id, status);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;
alter table public.messages enable row level security;
alter table public.blocked_users enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Friend Requests Policies
create policy "Users can read requests related to them" on public.friend_requests
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users can update requests received by them" on public.friend_requests
  for update using (receiver_id = auth.uid());
create policy "Users can send requests" on public.friend_requests
  for insert with check (sender_id = auth.uid());
create policy "Users can delete their own requests" on public.friend_requests
  for delete using (sender_id = auth.uid());

-- Friends Policies
create policy "Users can read their own friends" on public.friends
  for select using (user_id = auth.uid());

-- Messages Policies
create policy "Users can read own chat messages" on public.messages 
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Users can send messages" on public.messages 
  for insert with check (sender_id = auth.uid());
create policy "Users can update received message status" on public.messages 
  for update using (receiver_id = auth.uid());

-- Blocked Users Policies
create policy "Users can read blocks" on public.blocked_users
  for select using (blocker_id = auth.uid() or blocked_id = auth.uid());
create policy "Users can manage own blocks" on public.blocked_users
  for insert with check (blocker_id = auth.uid());
create policy "Users can delete own blocks" on public.blocked_users
  for delete using (blocker_id = auth.uid());

-- accept_friend_request RPC
create or replace function public.accept_friend_request(request_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  req record;
begin
  select * into req from public.friend_requests where id = request_id and receiver_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Request not found or not pending';
  end if;

  -- update status
  update public.friend_requests 
  set status = 'accepted', responded_at = now() 
  where id = request_id;

  -- insert mutual friendship
  insert into public.friends (user_id, friend_id) values (req.sender_id, req.receiver_id) on conflict do nothing;
  insert into public.friends (user_id, friend_id) values (req.receiver_id, req.sender_id) on conflict do nothing;
end;
$$;

-- Enable Realtime
begin;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.messages;GRANT ALL ON public.friend_requests TO anon, authenticated, service_role;
GRANT ALL ON public.blocked_users TO anon, authenticated, service_role;
