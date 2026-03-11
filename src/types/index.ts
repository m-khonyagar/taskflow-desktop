export type Platform = 'telegram' | 'whatsapp' | 'ita' | 'bale' | 'rubika' | 'other';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  notes: string;
  created_at: string;
  tags: string;
}

export interface PlatformCheck {
  id: string;
  contact_id: string;
  platform: Platform;
  has_account: boolean;
  last_online: string | null;
  checked_at: string;
}

export type MessageDirection = 'sent' | 'received';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'seen' | 'failed';

export interface Message {
  id: string;
  contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  platform: Platform;
  content: string;
  direction: MessageDirection;
  status: MessageStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  campaign_id: string | null;
}

export type CampaignStatus = 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  content: string;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  seen_count: number;
  reply_count: number;
  rate_limit: number;
  interval_hours: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DashboardStats {
  total_contacts: number;
  messages_sent: number;
  messages_seen: number;
  replies_received: number;
  active_campaigns: number;
}

export interface AppState {
  currentPage: string;
  notifications: AppNotification[];
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}
