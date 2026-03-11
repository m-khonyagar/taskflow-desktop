import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import { v4 as uuidv4 } from 'uuid';
import type { Contact, PlatformCheck, Platform } from '../types';
import { useApp } from '../context/AppContext';

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'telegram', label: 'تلگرام', icon: '✈️' },
  { id: 'whatsapp', label: 'واتساپ', icon: '📱' },
  { id: 'ita', label: 'ایتا', icon: '🌐' },
  { id: 'bale', label: 'بله', icon: '💬' },
  { id: 'rubika', label: 'روبیکا', icon: '🟣' },
];

export default function PlatformCheckPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState<PlatformCheck[]>([]);
  const [checking, setChecking] = useState(false);
  const [search, setSearch] = useState('');
  const { addNotification } = useApp();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDb();
    const c = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY created_at DESC');
    setContacts(c);
    const ch = await db.select<PlatformCheck[]>('SELECT * FROM platform_checks ORDER BY checked_at DESC');
    setChecks(ch);
  }

  function getChecksForContact(contactId: string): PlatformCheck[] {
    return checks.filter(c => c.contact_id === contactId);
  }

  function getPlatformCheck(contactId: string, platform: Platform): PlatformCheck | undefined {
    return checks.find(c => c.contact_id === contactId && c.platform === platform);
  }

  async function runCheck() {
    if (!selected.size) { addNotification('warning', 'ابتدا مخاطبینی را انتخاب کنید'); return; }
    setChecking(true);
    addNotification('info', 'بررسی حساب‌های پلتفرم شروع شد...');

    const db = await getDb();
    for (const contactId of selected) {
      for (const platform of PLATFORMS) {
        // NOTE: Simulation only — replace with actual platform API calls in production
        const hasAccount = Math.random() > 0.3;
        const lastOnline = hasAccount
          ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          : null;

        await db.execute(
          `INSERT OR REPLACE INTO platform_checks (id, contact_id, platform, has_account, last_online, checked_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), contactId, platform.id, hasAccount ? 1 : 0, lastOnline, new Date().toISOString()]
        );
      }
    }

    await loadData();
    setChecking(false);
    addNotification('success', `بررسی ${selected.size} مخاطب تکمیل شد`);
  }

  const filtered = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="alert alert-info mb-4">
        💡 برای بررسی حساب‌های پلتفرم، ابتدا مخاطبین را انتخاب کنید، سپس روی «شروع بررسی» کلیک کنید.
        در نسخه تولید، این بخش با API های واقعی پلتفرم‌ها مرتبط می‌شود.
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="🔍 جستجوی مخاطب..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={runCheck}
          disabled={checking || selected.size === 0}
        >
          {checking ? '⏳ در حال بررسی...' : '🔍 شروع بررسی'}
        </button>
        {selected.size > 0 && (
          <span className="badge badge-primary">{selected.size} انتخاب شده</span>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(c => selected.has(c.id))}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())}
                  />
                </th>
                <th>شماره تلفن</th>
                <th>نام</th>
                {PLATFORMS.map(p => (
                  <th key={p.id}>{p.icon} {p.label}</th>
                ))}
                <th>آخرین بررسی</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={PLATFORMS.length + 4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-text">هیچ مخاطبی یافت نشد</div>
                  </div>
                </td></tr>
              ) : filtered.map(c => {
                const contactChecks = getChecksForContact(c.id);
                const lastChecked = contactChecks.length > 0
                  ? new Date(Math.max(...contactChecks.map(ch => new Date(ch.checked_at).getTime())))
                  : null;
                return (
                  <tr key={c.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => {
                          const s = new Set(selected);
                          if (s.has(c.id)) s.delete(c.id); else s.add(c.id);
                          setSelected(s);
                        }}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>{c.phone}</td>
                    <td>{c.name || '—'}</td>
                    {PLATFORMS.map(p => {
                      const check = getPlatformCheck(c.id, p.id);
                      return (
                        <td key={p.id}>
                          {!check ? (
                            <span className="badge badge-gray">بررسی نشده</span>
                          ) : check.has_account ? (
                            <div>
                              <span className="badge badge-success">✓ فعال</span>
                              {check.last_online && (
                                <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                                  {new Date(check.last_online).toLocaleDateString('fa-IR')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-danger">✗ ندارد</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-sm text-muted">
                      {lastChecked ? lastChecked.toLocaleDateString('fa-IR') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
