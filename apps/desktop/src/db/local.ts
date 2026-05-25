export const localSchema = [
  `create table if not exists messages (
    id text primary key,
    room_id text not null,
    sender_id text not null,
    sender_name text not null,
    body text not null,
    kind text not null,
    created_at text not null,
    synced_at text
  )`,
  `create table if not exists settings (
    key text primary key,
    value text not null,
    updated_at text not null
  )`,
] as const;
