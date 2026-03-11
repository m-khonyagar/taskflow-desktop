import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import { v4 as uuidv4 } from 'uuid';
import type { Message, Platform } from '../types';
import { useApp } from '../context/AppContext';

interface Thread {
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  platform: Platform;
  last_message: string;
  last_time: string;
  unread: number;
  messages: Message[];
}

const SIMULATED_REPLY_TEXT = 'ممنون از پیامتون! چطور می‌تونم کمک کنم؟';

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const { addNotification } = useApp();

  useEffect(() => { loadThreads(); }, []);

  async function loadThreads() {
    const db = await getDb();
    const messages = await db.select<(Message & { contact_name: string; contact_phone: string })[]>(`
      SELECT m.*, c.name as contact_name, c.phone as contact_phone
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      ORDER BY m.created_at DESC
    `);

    const threadMap = new Map<string, Thread>();
    for (const msg of messages) {
      const key = `${msg.contact_id}_${msg.platform}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          contact_id: msg.contact_id,
          contact_name: msg.contact_name,
          contact_phone: msg.contact_phone,
          platform: msg.platform,
          last_message: msg.content,
          last_time: msg.created_at,
          unread: 0,
          messages: [],
        });
      }
      const thread = threadMap.get(key)!;
      thread.messages.push(msg);
      if (msg.direction === 'received' && msg.status !== 'seen') {
        thread.unread++;
      }
    }

    setThreads(Array.from(threadMap.values()));
  }

  async function sendReply() {
    if (!activeThread || !reply.trim()) return;
    setSending(true);
    const db = await getDb();
    await db.execute(
      `INSERT INTO messages (id, contact_id, platform, content, direction, status, scheduled_at, sent_at, created_at, campaign_id)
       VALUES (?, ?, ?, ?, 'sent', 'sent', NULL, ?, ?, NULL)`,
      [uuidv4(), activeThread.contact_id, activeThread.platform, reply, new Date().toISOString(), new Date().toISOString()]
    );
    // Mark received messages as seen
    await db.execute(
      "UPDATE messages SET status='seen' WHERE contact_id=? AND platform=? AND direction='received' AND status!='seen'",
      [activeThread.contact_id, activeThread.platform]
    );
    setReply('');
    setSending(false);
    addNotification('success', 'پاسخ ارسال شد');
    await loadThreads();
    // Refresh active thread
    const updatedMessages = await db.select<Message[]>(
      "SELECT * FROM messages WHERE contact_id=? AND platform=? ORDER BY created_at ASC",
      [activeThread.contact_id, activeThread.platform]
    );
    setActiveThread(prev => prev ? { ...prev, messages: updatedMessages, unread: 0 } : null);
  }

  async function simulateReply(thread: Thread) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO messages (id, contact_id, platform, content, direction, status, scheduled_at, sent_at, created_at, campaign_id)
       VALUES (?, ?, ?, ?, 'received', 'sent', NULL, ?, ?, NULL)`,
      [uuidv4(), thread.contact_id, thread.platform, SIMULATED_REPLY_TEXT, new Date().toISOString(), new Date().toISOString()]
    );
    addNotification('info', `پیام جدید از ${thread.contact_name || thread.contact_phone}`);
    loadThreads();
  }

  const PLATFORM_LABELS: Record<Platform, string> = {
    telegram: 'تلگرام', whatsapp: 'واتساپ', ita: 'ایتا', bale: 'بله', rubika: 'روبیکا', other: 'سایر',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 120px)' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
          صندوق دریافت ({threads.filter(t => t.unread > 0).length} خوانده نشده)
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {threads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📥</div>
              <div className="empty-state-text">هیچ مکالمه‌ای وجود ندارد</div>
            </div>
          ) : threads.map(t => {
            const key = `${t.contact_id}_${t.platform}`;
            const isActive = activeThread?.contact_id === t.contact_id && activeThread?.platform === t.platform;
            return (
              <div
                key={key}
                onClick={() => setActiveThread(t)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  background: isActive ? '#eff6ff' : t.unread > 0 ? '#fafafa' : 'transparent',
                  borderRight: isActive ? '3px solid #2563eb' : '3px solid transparent',
                }}
              >
                <div className="flex justify-between items-center">
                  <strong>{t.contact_name || t.contact_phone}</strong>
                  {t.unread > 0 && <span className="badge badge-primary">{t.unread}</span>}
                </div>
                <div className="text-sm text-muted">{PLATFORM_LABELS[t.platform]}</div>
                <div className="text-sm" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 2 }}>
                  {t.last_message}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!activeThread ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">یک مکالمه انتخاب کنید</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{activeThread.contact_name || activeThread.contact_phone}</strong>
                <div className="text-sm text-muted">{activeThread.contact_phone} · {PLATFORM_LABELS[activeThread.platform]}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => simulateReply(activeThread)}>
                🔄 شبیه‌سازی پاسخ
              </button>
            </div>

            <div className="message-thread" style={{ flex: 1, margin: 16, maxHeight: 'none' }}>
              {activeThread.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.direction}`}>
                  {msg.content}
                  <div className="message-meta">
                    <span>{new Date(msg.created_at).toLocaleTimeString('fa-IR')}</span>
                    {msg.direction === 'sent' && (
                      <span className={`msg-status-${msg.status}`}>
                        {msg.status === 'seen' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '⏳'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <textarea
                className="form-control"
                placeholder="پاسخ بنویسید..."
                rows={2}
                value={reply}
                onChange={e => setReply(e.target.value)}
                style={{ flex: 1, resize: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              />
              <button className="btn btn-primary" onClick={sendReply} disabled={sending || !reply.trim()}>
                📤 ارسال
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
