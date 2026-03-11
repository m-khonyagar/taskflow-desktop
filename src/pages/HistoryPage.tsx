import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import type { Contact, Message, Platform } from '../types';

const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'تلگرام', whatsapp: 'واتساپ', ita: 'ایتا', bale: 'بله', rubika: 'روبیکا', other: 'سایر',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار', sent: 'ارسال شده', delivered: 'تحویل داده شده', seen: 'مشاهده شده', failed: 'ناموفق',
};

export default function HistoryPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [messages, setMessages] = useState<(Message & { contact_name: string; contact_phone: string })[]>([]);
  const [platform, setPlatform] = useState<string>('');
  const [direction, setDirection] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadContacts(); loadMessages(); }, []);

  async function loadContacts() {
    const db = await getDb();
    const rows = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY name ASC');
    setContacts(rows);
  }

  async function loadMessages() {
    const db = await getDb();
    const rows = await db.select<(Message & { contact_name: string; contact_phone: string })[]>(`
      SELECT m.*, c.name as contact_name, c.phone as contact_phone
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 500
    `);
    setMessages(rows);
  }

  const filtered = messages.filter(m => {
    if (selectedContact && m.contact_id !== selectedContact) return false;
    if (platform && m.platform !== platform) return false;
    if (direction && m.direction !== direction) return false;
    if (search && !m.content.includes(search) && !m.contact_phone.includes(search) && !m.contact_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="card mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label className="form-label">مخاطب</label>
            <select className="form-control" value={selectedContact} onChange={e => setSelectedContact(e.target.value)}>
              <option value="">همه مخاطبین</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">پلتفرم</label>
            <select className="form-control" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="">همه پلتفرم‌ها</option>
              {Object.entries(PLATFORM_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">نوع</label>
            <select className="form-control" value={direction} onChange={e => setDirection(e.target.value)}>
              <option value="">همه</option>
              <option value="sent">ارسالی</option>
              <option value="received">دریافتی</option>
            </select>
          </div>
          <div>
            <label className="form-label">جستجو در متن</label>
            <input className="search-input" placeholder="متن پیام..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 500, fontSize: 13, color: '#64748b' }}>
          {filtered.length} پیام یافت شد
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>مخاطب</th>
                <th>پلتفرم</th>
                <th>نوع</th>
                <th>متن پیام</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">هیچ پیامی یافت نشد</div>
                  </div>
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div>{m.contact_name || '—'}</div>
                    <div className="text-sm text-muted" style={{ direction: 'ltr', textAlign: 'left' }}>{m.contact_phone}</div>
                  </td>
                  <td><span className={`platform-badge platform-${m.platform}`}>{PLATFORM_LABELS[m.platform as Platform] ?? m.platform}</span></td>
                  <td>
                    {m.direction === 'sent'
                      ? <span className="badge badge-primary">📤 ارسالی</span>
                      : <span className="badge badge-success">📥 دریافتی</span>}
                  </td>
                  <td style={{ maxWidth: 300 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</div>
                  </td>
                  <td>
                    <span className={`badge ${m.status === 'seen' ? 'badge-success' : m.status === 'failed' ? 'badge-danger' : 'badge-gray'}`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{new Date(m.created_at).toLocaleString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
