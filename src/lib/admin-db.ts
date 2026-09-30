import { supabase } from './supabase';
import type { Profile, Group } from './types';

/**
 * Funzioni dedicate all'amministratore.
 * Queste funzioni funzioneranno solo se l'utente ha is_admin = true
 * grazie alle policy RLS impostate nel database.
 */

export const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('username');
  if (error) throw error;
  return data as Profile[];
};

export const toggleUserSuspension = async (userId: string, suspended: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: suspended })
    .eq('id', userId);
  if (error) throw error;
};

export const fetchAllGroups = async () => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, code, owner_id')
    .order('created_at');
  if (error) throw error;
  return data as Group[];
};

export const adminDeleteGroup = async (groupId: string) => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);
  if (error) throw error;
};

export const fetchAllEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id, label, pts, created_at, status, user:profiles(username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as any[];
};

export const adminDeleteEvent = async (eventId: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
};
