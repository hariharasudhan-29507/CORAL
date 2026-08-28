create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text unique,
  avatar_url text,
  status_message text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'dm' check (type in ('dm', 'group')),
  title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  muted boolean not null default false,
  archived boolean not null default false,
  last_read_message_id uuid,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id text,
  sender_name text not null,
  body text not null,
  kind text not null default 'user' check (kind in ('user', 'system')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages alter column conversation_id drop not null;
alter table public.messages alter column sender_id type text using sender_id::text;
alter table public.messages alter column sender_id drop not null;
alter table public.messages alter column sender_name set not null;
alter table public.messages alter column body set not null;
alter table public.messages alter column kind set default 'user';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'messages'
      and column_name = 'room_id'
  ) then
    alter table public.messages alter column room_id drop not null;
  end if;
end $$;

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id)
);

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
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

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  mode text not null check (mode in ('audio', 'video')),
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text
);

create table if not exists public.call_participants (
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  muted boolean not null default false,
  camera_enabled boolean not null default false,
  screen_sharing boolean not null default false,
  primary key (call_session_id, user_id)
);

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null default 'offline' check (status in ('online', 'away', 'in_call', 'offline')),
  updated_at timestamptz not null default now()
);

alter table public.user_presence add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'dark', 'light')),
  read_receipts_enabled boolean not null default true,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conversation_participants_last_read_message_id_fkey'
  ) then
    alter table public.conversation_participants
      add constraint conversation_participants_last_read_message_id_fkey
      foreign key (last_read_message_id) references public.messages(id) on delete set null;
  end if;
end $$;

create index if not exists conversation_participants_user_idx on public.conversation_participants(user_id);
create index if not exists messages_conversation_created_at_idx on public.messages(conversation_id, created_at);
create index if not exists message_receipts_user_read_idx on public.message_receipts(user_id, read_at);
create index if not exists attachments_conversation_idx on public.attachments(conversation_id);
create index if not exists call_sessions_conversation_started_idx on public.call_sessions(conversation_id, started_at desc);
create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = target_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;
alter table public.message_reactions enable row level security;
alter table public.attachments enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_participants enable row level security;
alter table public.user_presence enable row level security;
alter table public.user_settings enable row level security;

create policy "profiles visible to authenticated users" on public.profiles
  for select to authenticated using (true);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "participants read conversations" on public.conversations
  for select to authenticated using (public.is_conversation_participant(id));
create policy "authenticated users create conversations" on public.conversations
  for insert to authenticated with check (created_by = auth.uid());

create policy "participants read participants" on public.conversation_participants
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy "users manage own participant row" on public.conversation_participants
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "participants read messages" on public.messages
  for select to authenticated using (public.is_conversation_participant(conversation_id));
create policy "participants insert messages" on public.messages
  for insert to authenticated with check (public.is_conversation_participant(conversation_id));

create policy "users read receipts in conversations" on public.message_receipts
  for select to authenticated using (
    exists (
      select 1 from public.messages m
      where m.id = message_receipts.message_id
        and public.is_conversation_participant(m.conversation_id)
    )
  );
create policy "users manage own receipts" on public.message_receipts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "participants read reactions" on public.message_reactions
  for select to authenticated using (
    exists (
      select 1 from public.messages m
      where m.id = message_reactions.message_id
        and public.is_conversation_participant(m.conversation_id)
    )
  );
create policy "users manage own reactions" on public.message_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "participants read attachments" on public.attachments
  for select to authenticated using (public.is_conversation_participant(conversation_id));

create policy "participants read calls" on public.call_sessions
  for select to authenticated using (public.is_conversation_participant(conversation_id));

create policy "participants read call participants" on public.call_participants
  for select to authenticated using (
    exists (
      select 1 from public.call_sessions cs
      where cs.id = call_participants.call_session_id
        and public.is_conversation_participant(cs.conversation_id)
    )
  );

create policy "authenticated users read presence" on public.user_presence
  for select to authenticated using (true);
create policy "users manage own presence" on public.user_presence
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users read own settings" on public.user_settings
  for select to authenticated using (user_id = auth.uid());
create policy "users manage own settings" on public.user_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
