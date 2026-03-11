import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import { v4 as uuidv4 } from 'uuid';
import type { Campaign, Contact, Platform, CampaignStatus } from '../types';
import { useApp } from '../context/AppContext';

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'telegram', label: 'تلگرام' },
  { id: 'whatsapp', label: 'واتساپ' },
  { id: 'ita', label: 'ایتا' },
  { id: 'bale', label: 'بله' },
  { id: 'rubika', label: 'روبیکا' },
];

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'پیش‌نویس',
  running: 'در حال اجرا',
  completed: 'تکمیل شده',
  paused: 'متوقف',
  cancelled: 'لغو شده',
};

const STATUS_BADGE: Record<CampaignStatus, string> = {
  draft: 'badge-gray',
  running: 'badge-primary',
  completed: 'badge-success',
  paused: 'badge-warning',
  cancelled: 'badge-danger',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: '',
    platform: 'telegram' as Platform,
    content: '',
    rate_limit: 50,
    interval_hours: 24,
  });
  const { addNotification } = useApp();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const db = await getDb();
    const c = await db.select<Campaign[]>('SELECT * FROM campaigns ORDER BY created_at DESC');
    setCampaigns(c);
    const ct = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY name ASC');
    setContacts(ct);
  }

  async function createCampaign() {
    if (!form.name.trim()) { addNotification('error', 'نام کمپین الزامی است'); return; }
    if (!form.content.trim()) { addNotification('error', 'متن پیام الزامی است'); return; }
    if (!selectedContacts.size) { addNotification('error', 'حداقل یک مخاطب انتخاب کنید'); return; }

    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO campaigns (id, name, platform, content, status, total_recipients, sent_count, seen_count, reply_count, rate_limit, interval_hours, created_at)
       VALUES (?, ?, ?, ?, 'draft', ?, 0, 0, 0, ?, ?, ?)`,
      [id, form.name, form.platform, form.content, selectedContacts.size, form.rate_limit, form.interval_hours, new Date().toISOString()]
    );
    for (const contactId of selectedContacts) {
      await db.execute(
        'INSERT INTO campaign_recipients (id, campaign_id, contact_id, status) VALUES (?, ?, ?, ?)',
        [uuidv4(), id, contactId, 'pending']
      );
    }
    addNotification('success', 'کمپین ایجاد شد');
    setShowCreate(false);
    setForm({ name: '', platform: 'telegram', content: '', rate_limit: 50, interval_hours: 24 });
    setSelectedContacts(new Set());
    loadData();
  }

  async function updateStatus(id: string, status: CampaignStatus) {
    const db = await getDb();
    const now = new Date().toISOString();
    if (status === 'running') {
      await db.execute("UPDATE campaigns SET status=?, started_at=? WHERE id=?", [status, now, id]);
      addNotification('info', 'کمپین شروع به اجرا کرد');
    } else if (status === 'completed') {
      await db.execute("UPDATE campaigns SET status=?, completed_at=? WHERE id=?", [status, now, id]);
    } else {
      await db.execute("UPDATE campaigns SET status=? WHERE id=?", [status, id]);
    }
    loadData();
  }

  async function deleteCampaign(id: string) {
    if (!confirm('این کمپین حذف شود؟')) return;
    const db = await getDb();
    await db.execute('DELETE FROM campaign_recipients WHERE campaign_id=?', [id]);
    await db.execute('DELETE FROM campaigns WHERE id=?', [id]);
    addNotification('success', 'کمپین حذف شد');
    loadData();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="alert alert-info" style={{ margin: 0, flex: 1, marginLeft: 12 }}>
          💡 کمپین‌ها به شما امکان می‌دهند پیام انبوه با محدودیت نرخ ارسال (جهت جلوگیری از مسدود شدن) ارسال کنید.
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>➕ کمپین جدید</button>
      </div>

      {campaigns.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📣</div>
            <div className="empty-state-text">هیچ کمپینی وجود ندارد</div>
            <div className="empty-state-sub">یک کمپین جدید ایجاد کنید</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>نام کمپین</th>
                  <th>پلتفرم</th>
                  <th>وضعیت</th>
                  <th>گیرندگان</th>
                  <th>ارسال شده</th>
                  <th>مشاهده شده</th>
                  <th>نرخ (۲۴ ساعت)</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><span className={`platform-badge platform-${c.platform}`}>{PLATFORMS.find(p => p.id === c.platform)?.label}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[c.status as CampaignStatus]}`}>{STATUS_LABELS[c.status as CampaignStatus]}</span></td>
                    <td>{c.total_recipients}</td>
                    <td>
                      <div>{c.sent_count}/{c.total_recipients}</div>
                      {c.total_recipients > 0 && (
                        <div className="progress-bar" style={{ marginTop: 4, width: 80 }}>
                          <div className="progress-fill" style={{ width: `${(c.sent_count / c.total_recipients) * 100}%` }} />
                        </div>
                      )}
                    </td>
                    <td>{c.seen_count}</td>
                    <td>{c.rate_limit} در {c.interval_hours} ساعت</td>
                    <td>
                      <div className="flex gap-2">
                        {c.status === 'draft' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(c.id, 'running')}>▶ شروع</button>
                        )}
                        {c.status === 'running' && (
                          <button className="btn btn-warning btn-sm" onClick={() => updateStatus(c.id, 'paused')}>⏸</button>
                        )}
                        {c.status === 'paused' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(c.id, 'running')}>▶</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCampaign(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">📣 ایجاد کمپین جدید</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="form-group">
                  <label className="form-label">نام کمپین *</label>
                  <input className="form-control" placeholder="مثال: کمپین فروش بهاره" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">پلتفرم</label>
                  <select className="form-control" value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}>
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">محدودیت نرخ</label>
                  <input type="number" className="form-control" value={form.rate_limit} min={1} max={1000}
                    onChange={e => setForm(f => ({ ...f, rate_limit: Number(e.target.value) }))} />
                  <div className="text-sm text-muted mt-2">حداکثر تعداد پیام در بازه زمانی</div>
                </div>
                <div className="form-group">
                  <label className="form-label">بازه زمانی (ساعت)</label>
                  <input type="number" className="form-control" value={form.interval_hours} min={1} max={168}
                    onChange={e => setForm(f => ({ ...f, interval_hours: Number(e.target.value) }))} />
                  <div className="text-sm text-muted mt-2">مثال: ۲۰۰ پیام طی ۲۴ ساعت</div>
                </div>
                <div className="form-group">
                  <label className="form-label">متن پیام *</label>
                  <textarea className="form-control" rows={5} placeholder="متن پیام..."
                    value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">انتخاب مخاطبین ({selectedContacts.size} انتخاب شده)</label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 380, overflowY: 'auto' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox"
                        checked={contacts.length > 0 && contacts.every(c => selectedContacts.has(c.id))}
                        onChange={e => setSelectedContacts(e.target.checked ? new Set(contacts.map(c => c.id)) : new Set())} />
                      انتخاب همه ({contacts.length})
                    </label>
                  </div>
                  {contacts.map(c => (
                    <label key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                      <input type="checkbox"
                        checked={selectedContacts.has(c.id)}
                        onChange={() => {
                          const s = new Set(selectedContacts);
                          if (s.has(c.id)) s.delete(c.id); else s.add(c.id);
                          setSelectedContacts(s);
                        }} />
                      <span style={{ direction: 'ltr', fontFamily: 'monospace', fontSize: 12 }}>{c.phone}</span>
                      {c.name && <span style={{ color: '#64748b' }}>{c.name}</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={createCampaign}>💾 ذخیره کمپین</button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
