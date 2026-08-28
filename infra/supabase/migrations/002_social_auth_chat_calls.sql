create extension if not exists citext with schema extensions;

insert into storage.buckets (id, name, public)
values
  ('profile-pictures', 'profile-pictures', true),
  ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

alter table public.profiles add column if not exists status text not null default 'offline'
  check (status in ('online', 'away', 'in_call', 'recording_audio', 'offline'));
alter table public.profiles add column if not exists last_seen timestamptz;

alter table public.messages add column if not exists receiver_id uuid references auth.users(id) on delete set null;
alter table public.messages add column if not exists delivery_status text not null default 'sent'
  check (delivery_status in ('sent', 'delivered', 'read'));

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('message', 'friend_request', 'incoming_call', 'missed_call')),
  title text not null,
  body text,
  conversation_id uuid references public.conversations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  bucket text not null default 'message-attachments',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  type text not null check (type in ('audio', 'video')),
  status text not null default 'started' check (status in ('started', 'answered', 'missed', 'ended', 'failed'))
);

create table if not exists public.groups (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  name text not null,
  avatar_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists profiles_status_last_seen_idx on public.profiles(status, last_seen desc);
create index if not exists messages_receiver_status_idx on public.messages(receiver_id, delivery_status);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists attachments_conversation_idx on public.attachments(conversation_id);
create index if not exists calls_caller_started_idx on public.calls(caller_id, started_at desc);
create index if not exists calls_receiver_started_idx on public.calls(receiver_id, started_at desc);
create index if not exists group_members_user_idx on public.group_members(user_id);

alter table public.user_blocks enable row level security;
alter table public.notifications enable row level security;
alter table public.attachments enable row level security;
alter table public.calls enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_blocks' and policyname = 'users manage own blocks') then
    create policy "users manage own blocks" on public.user_blocks
      for all to authenticated using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'users read own notifications') then
    create policy "users read own notifications" on public.notifications
      for select to authenticated using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'users update own notifications') then
    create policy "users update own notifications" on public.notifications
      for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attachments' and policyname = 'participants read attachments') then
    create policy "participants read attachments" on public.attachments
      for select to authenticated using (public.is_conversation_participant(conversation_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calls' and policyname = 'users read own calls') then
    create policy "users read own calls" on public.calls
      for select to authenticated using (caller_id = (select auth.uid()) or receiver_id = (select auth.uid()) or public.is_conversation_participant(conversation_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'groups' and policyname = 'participants read groups') then
    create policy "participants read groups" on public.groups
      for select to authenticated using (public.is_conversation_participant(conversation_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'group_members' and policyname = 'participants read group members') then
    create policy "participants read group members" on public.group_members
      for select to authenticated using (public.is_conversation_participant(conversation_id));
  end if;
end $$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, email, phone, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email, new.phone, new.id::text),
    new.email,
    new.phone,
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do update set
    nickname = coalesce(public.profiles.nickname, excluded.nickname),
    email = excluded.email,
    phone = excluded.phone,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists create_profile_after_auth_user_insert on auth.users;
create trigger create_profile_after_auth_user_insert
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();
