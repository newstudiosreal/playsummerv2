export interface Profile { id: string; username: string; avatar: string; bio: string | null }
export interface Group { id: string; name: string; code: string; owner_id: string }
export interface GroupRow extends Group { memberships: { count: number }[] }
export interface LeaderRow { user_id: string; username: string; avatar: string; pts: number; n_events: number }
export interface EventType { id: string; label: string; pts: number }
export interface FeedRow {
  id: string; user_id: string; label: string; pts: number; created_at: string;
  user: { username: string; avatar: string } | null;
}
