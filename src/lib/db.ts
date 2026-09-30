import { supabase } from './supabase';
import type { Group, GroupRow, LeaderRow } from './types';

type Res = PromiseLike<{ data: unknown; error: { message: string } | null }>;

/** Trasforma la risposta di Supabase in una promise che lancia un Error leggibile. */
async function q<T>(p: Res): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export const fetchMyGroups = () =>
  q<GroupRow[]>(supabase.from('groups').select('id,name,code,owner_id,memberships(count)').order('created_at'));

export const fetchGroup = (id: string) =>
  q<Group>(supabase.from('groups').select('id,name,code,owner_id').eq('id', id).single());

export const fetchLeaderboard = (id: string) =>
  q<LeaderRow[]>(supabase.rpc('group_leaderboard', { p_group: id }));

export const createGroup = (name: string) => q<string>(supabase.rpc('create_group', { p_name: name }));
export const joinGroup = (code: string) => q<string>(supabase.rpc('join_group', { p_code: code }));

export const leaveGroup = (groupId: string, userId: string) =>
  q<null>(supabase.from('memberships').delete().eq('group_id', groupId).eq('user_id', userId));

export const deleteGroup = (id: string) => q<null>(supabase.from('groups').delete().eq('id', id));

// ── Fase 3-4: eventi, feed, profilo ─────────────────────────────
import type { EventType, FeedRow } from './types';

export const fetchEventTypes = () =>
  q<EventType[]>(supabase.from('event_types').select('id,label,pts').eq('active', true).order('pts', { ascending: false }));

const FEED_COLS = 'id,user_id,label,pts,created_at,user:profiles!events_user_id_fkey(username,avatar)';

export const fetchFeed = (groupId: string) =>
  q<FeedRow[]>(supabase.from('events')
    .select(FEED_COLS).eq('group_id', groupId).eq('status', 'approved').order('created_at', { ascending: false }).limit(30));

export const addEvent = (groupId: string, userId: string, t: EventType, by: string) =>
  q<null>(supabase.from('events').insert({
    group_id: groupId, user_id: userId, event_type_id: t.id, label: t.label, pts: t.pts, created_by: by,
  }));

export const deleteEvent = (id: string) => q<null>(supabase.from('events').delete().eq('id', id));

export const updateProfile = (id: string, avatar: string, bio: string | null) =>
  q<null>(supabase.from('profiles').update({ avatar, bio }).eq('id', id));

export const deleteAccount = () => q<null>(supabase.rpc('delete_my_account'));

// ── Proposte: il giocatore propone, l'owner approva (rifiutare = cancellare) ──
export const fetchPending = (groupId: string) =>
  q<FeedRow[]>(supabase.from('events').select(FEED_COLS).eq('group_id', groupId).eq('status', 'pending').order('created_at'));

export const proposeEvent = (groupId: string, userId: string, t: EventType) =>
  q<null>(supabase.from('events').insert({
    group_id: groupId, user_id: userId, event_type_id: t.id, label: t.label, pts: t.pts, created_by: userId, status: 'pending',
  }));

export const approveEvent = (id: string) => q<null>(supabase.from('events').update({ status: 'approved' }).eq('id', id));
