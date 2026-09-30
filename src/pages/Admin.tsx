import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchAllUsers, toggleUserSuspension,
  fetchAllGroups, adminDeleteGroup,
  fetchAllEvents, adminDeleteEvent
} from '../lib/admin-db';
import { go } from '../lib/router';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'users' | 'groups' | 'events'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      go('/');
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin) {
      alert('Access denied: you are not an admin');
      go('/');
    } else {
      setIsAdmin(true);
      loadData();
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [u, g, e] = await Promise.all([
        fetchAllUsers(),
        fetchAllGroups(),
        fetchAllEvents()
      ]);
      setUsers(u);
      setGroups(g);
      setEvents(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSuspension = async (id: string, current: boolean) => {
    try {
      await toggleUserSuspension(id, !current);
      setUsers(users.map(u => u.id === id ? { ...u, is_suspended: !current } : u));
    } catch (err) { alert('Error updating user'); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure? This will delete the group and its events.')) return;
    try {
      await adminDeleteGroup(id);
      setGroups(groups.filter(g => g.id !== id));
    } catch (err) { alert('Error deleting group'); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await adminDeleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) { alert('Error deleting event'); }
  };

  if (isAdmin === null) return <div className="p-8 text-center">Loading...</div>;
  if (isAdmin === false) return null;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button onClick={() => go('/')} className="text-sm bg-gray-200 px-3 py-1 rounded">Back to App</button>
      </header>

      <nav className="flex gap-2 mb-6 border-b">
        {(['users', 'groups', 'events'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 capitalize ${tab === t ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {loading ? <div className="text-center p-4">Loading data...</div> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {tab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3">User</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${u.is_suspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {u.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSuspension(u.id, u.is_suspended)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        {u.is_suspended ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'groups' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3">Group Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.id} className="border-b">
                    <td className="p-3 font-medium">{g.name}</td>
                    <td className="p-3 text-gray-500">{g.code}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'events' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3">Event</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Pts</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-b">
                    <td className="p-3">{e.label}</td>
                    <td className="p-3 text-gray-500">{e.user?.username || 'Unknown'}</td>
                    <td className="p-3">{e.pts}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
