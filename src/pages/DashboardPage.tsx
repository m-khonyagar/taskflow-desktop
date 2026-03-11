import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import type { DashboardStats } from '../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_contacts: 0,
    messages_sent: 0,
    messages_seen: 0,
    replies_received: 0,
    active_campaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const db = await getDb();
      const [contacts] = await db.select<[{ count: number }]>('SELECT COUNT(*) as count FROM contacts');
      const [sent] = await db.select<[{ count: number }]>("SELECT COUNT(*) as count FROM messages WHERE direction='sent'");
      const [seen] = await db.select<[{ count: number }]>("SELECT COUNT(*) as count FROM messages WHERE status='seen'");
      const [replies] = await db.select<[{ count: number }]>("SELECT COUNT(*) as count FROM messages WHERE direction='received'");
      const [campaigns] = await db.select<[{ count: number }]>("SELECT COUNT(*) as count FROM campaigns WHERE status='running'");
      setStats({
        total_contacts: contacts.count,
        messages_sent: sent.count,
        messages_seen: seen.count,
        replies_received: replies.count,
        active_campaigns: campaigns.count,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const STAT_CARDS = [
    { label: 'تعداد مخاطبین', value: stats.total_contacts, icon: '👥', color: '#2563eb' },
    { label: 'پیام‌های ارسالی', value: stats.messages_sent, icon: '✉️', color: '#7c3aed' },
    { label: 'پیام‌های مشاهده شده', value: stats.messages_seen, icon: '👁️', color: '#16a34a' },
    { label: 'پاسخ‌های دریافتی', value: stats.replies_received, icon: '↩️', color: '#d97706' },
    { label: 'کمپین‌های فعال', value: stats.active_campaigns, icon: '📣', color: '#0891b2' },
  ];

  return (
    <div>
      <div className="stats-grid">
        {STAT_CARDS.map(card => (
          <div className="stat-card" key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color }}>{loading ? '...' : card.value.toLocaleString('fa-IR')}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">📌 راهنمای سریع</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { icon: '👥', title: 'افزودن مخاطب', desc: 'از منوی «مخاطبین» شماره‌های خود را اضافه یا وارد کنید' },
            { icon: '🔍', title: 'بررسی پلتفرم', desc: 'از «بررسی پلتفرم» بررسی کنید کدام اپ روی شماره فعال است' },
            { icon: '✉️', title: 'ارسال پیام', desc: 'از «ارسال پیام» پیام تکی یا دسته‌جمعی ارسال کنید' },
            { icon: '📣', title: 'کمپین دسته‌جمعی', desc: 'از «کمپین‌ها» با محدودیت نرخ ارسال پیام انبوه مدیریت کنید' },
          ].map(item => (
            <div key={item.title} style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
