import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import { v4 as uuidv4 } from 'uuid';
import type { Contact, Platform } from '../types';
import { useApp } from '../context/AppContext';

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'telegram', label: 'تلگرام' },
  { id: 'whatsapp', label: 'واتساپ' },
  { id: 'ita', label: 'ایتا' },
  { id: 'bale', label: 'بله' },
  { id: 'rubika', label: 'روبیکا' },
];

export default function MessagingPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<Platform>('telegram');
  const [content, setContent] = useState('');
  const [scheduled, setScheduled] = useState('');
  const [sending, setSending] = useState(false);
  const { addNotification } = useApp();

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    const db = await getDb();
    const rows = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY name ASC');
    setContacts(rows);
  }

  async function sendMessages() {
    if (!selected.size) { addNotification('warning', 'هیچ مخاطبی انتخاب نشده'); return; }
    if (!content.trim()) { addNotification('error', 'متن پیام نمی‌تواند خالی باشد'); return; }
    setSending(true);
    const db = await getDb();
    const scheduledAt = scheduled ? new Date(scheduled).toISOString() : null;
    const isScheduled = !!scheduledAt;
    let count = 0;

    for (const contactId of selected) {
      await db.execute(
        `INSERT INTO messages (id, contact_id, platform, content, direction, status, scheduled_at, sent_at, created_at, campaign_id)
         VALUES (?, ?, ?, ?, 'sent', ?, ?, ?, ?, NULL)`,
        [
          uuidv4(),
          contactId,
          platform,
          content,
          isScheduled ? 'pending' : 'sent',
          scheduledAt,
          isScheduled ? null : new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      count++;
    }

    setSending(false);
    setContent('');
    setSelected(new Set());
    setScheduled('');
    addNotification('success', `${count} پیام ${isScheduled ? 'زمان‌بندی' : 'ارسال'} شد`);
  }

  const filtered = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, height: '100%' }}>
      <div>
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="🔍 جستجوی مخاطب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="badge badge-primary">{selected.size} انتخاب شده</span>
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-cell">
                    <input type="checkbox" checked={allSelected}
                      onChange={e => setSelected(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())} />
                  </th>
                  <th>شماره تلفن</th>
                  <th>نام</th>
                  <th>تگ‌ها</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="checkbox-cell">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => {
                        const s = new Set(selected);
                        if (s.has(c.id)) s.delete(c.id); else s.add(c.id);
                        setSelected(s);
                      }} />
                    </td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>{c.phone}</td>
                    <td>{c.name || '—'}</td>
                    <td>{c.tags || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-text">مخاطبی یافت نشد</div>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title">✉️ تنظیمات پیام</div>
          <div className="form-group">
            <label className="form-label">پلتفرم</label>
            <select className="form-control" value={platform} onChange={e => setPlatform(e.target.value as Platform)}>
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">متن پیام</label>
            <textarea
              className="form-control"
              rows={6}
              placeholder="متن پیام را بنویسید..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="text-sm text-muted mt-2">{content.length} کاراکتر</div>
          </div>
          <div className="form-group">
            <label className="form-label">زمان‌بندی (اختیاری)</label>
            <input
              type="datetime-local"
              className="form-control"
              value={scheduled}
              onChange={e => setScheduled(e.target.value)}
              style={{ direction: 'ltr' }}
            />
            <div className="text-sm text-muted mt-2">اگر خالی بماند، فوری ارسال می‌شود</div>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
            <div className="text-sm">📋 خلاصه:</div>
            <div className="text-sm text-muted mt-2">گیرندگان: <strong>{selected.size}</strong></div>
            <div className="text-sm text-muted">پلتفرم: <strong>{PLATFORMS.find(p => p.id === platform)?.label}</strong></div>
            <div className="text-sm text-muted">وضعیت: <strong>{scheduled ? 'زمان‌بندی شده' : 'ارسال فوری'}</strong></div>
          </div>
          <button
            className="btn btn-primary w-full btn-lg"
            onClick={sendMessages}
            disabled={sending || !content.trim() || selected.size === 0}
          >
            {sending ? '⏳ در حال ارسال...' : `📤 ارسال به ${selected.size} نفر`}
          </button>
        </div>
      </div>
    </div>
  );
}
