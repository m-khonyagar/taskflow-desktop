import { useEffect, useState } from 'react';
import { getDb } from '../hooks/useDb';
import { v4 as uuidv4 } from 'uuid';
import type { Contact } from '../types';
import { useApp } from '../context/AppContext';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', notes: '', tags: '' });
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const { addNotification } = useApp();

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    const db = await getDb();
    const rows = await db.select<Contact[]>('SELECT * FROM contacts ORDER BY created_at DESC');
    setContacts(rows);
  }

  async function saveContact() {
    if (!form.phone.trim()) { addNotification('error', 'شماره تلفن الزامی است'); return; }
    const db = await getDb();
    if (editContact) {
      await db.execute('UPDATE contacts SET name=?, phone=?, notes=?, tags=? WHERE id=?',
        [form.name, form.phone, form.notes, form.tags, editContact.id]);
      addNotification('success', 'مخاطب ویرایش شد');
    } else {
      await db.execute('INSERT INTO contacts (id, name, phone, notes, tags, created_at) VALUES (?,?,?,?,?,?)',
        [uuidv4(), form.name, form.phone, form.notes, form.tags, new Date().toISOString()]);
      addNotification('success', 'مخاطب اضافه شد');
    }
    setShowModal(false);
    setForm({ name: '', phone: '', notes: '', tags: '' });
    setEditContact(null);
    loadContacts();
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm(`آیا از حذف ${selected.size} مخاطب اطمینان دارید؟`)) return;
    const db = await getDb();
    for (const id of selected) {
      await db.execute('DELETE FROM contacts WHERE id=?', [id]);
    }
    setSelected(new Set());
    addNotification('success', `${selected.size} مخاطب حذف شد`);
    loadContacts();
  }

  async function importContacts() {
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { addNotification('error', 'داده‌ای برای وارد کردن وجود ندارد'); return; }
    const db = await getDb();
    let count = 0;
    for (const line of lines) {
      const parts = line.split(',');
      const phone = parts[0]?.trim();
      const name = parts[1]?.trim() ?? '';
      if (phone) {
        await db.execute('INSERT OR IGNORE INTO contacts (id, name, phone, notes, tags, created_at) VALUES (?,?,?,?,?,?)',
          [uuidv4(), name, phone, '', '', new Date().toISOString()]);
        count++;
      }
    }
    addNotification('success', `${count} مخاطب وارد شد`);
    setShowImport(false);
    setImportText('');
    loadContacts();
  }

  function openEdit(c: Contact) {
    setEditContact(c);
    setForm({ name: c.name, phone: c.phone, notes: c.notes, tags: c.tags });
    setShowModal(true);
  }

  function openAdd() {
    setEditContact(null);
    setForm({ name: '', phone: '', notes: '', tags: '' });
    setShowModal(true);
  }

  const filtered = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id));

  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  }

  function toggleSelect(id: string) {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  }

  return (
    <div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="🔍 جستجو در مخاطبین..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openAdd}>➕ افزودن مخاطب</button>
        <button className="btn btn-secondary" onClick={() => setShowImport(true)}>📥 وارد کردن</button>
        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={deleteSelected}>🗑️ حذف ({selected.size})</button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th>شماره تلفن</th>
                <th>نام</th>
                <th>تگ‌ها</th>
                <th>تاریخ افزودن</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-text">هیچ مخاطبی یافت نشد</div>
                    <div className="empty-state-sub">یک مخاطب جدید اضافه کنید یا لیست شماره‌ها را وارد کنید</div>
                  </div>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td className="checkbox-cell">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}>{c.phone}</td>
                  <td>{c.name || <span className="text-muted">—</span>}</td>
                  <td>
                    {c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="badge badge-info" style={{ marginLeft: 4 }}>{t}</span>
                    )) : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('fa-IR')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        if (!confirm('حذف شود؟')) return;
                        const db = await getDb();
                        await db.execute('DELETE FROM contacts WHERE id=?', [c.id]);
                        loadContacts();
                      }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editContact ? '✏️ ویرایش مخاطب' : '➕ افزودن مخاطب'}</div>
            <div className="form-group">
              <label className="form-label">شماره تلفن *</label>
              <input className="form-control" placeholder="09xxxxxxxxx" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ direction: 'ltr' }} />
            </div>
            <div className="form-group">
              <label className="form-label">نام</label>
              <input className="form-control" placeholder="نام مخاطب" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">تگ‌ها (با کاما جدا کنید)</label>
              <input className="form-control" placeholder="مثال: مشتری, VIP" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">یادداشت</label>
              <textarea className="form-control" placeholder="یادداشت..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={saveContact}>💾 ذخیره</button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📥 وارد کردن مخاطبین</div>
            <div className="alert alert-info">هر خط یک شماره، فرمت: <code>شماره,نام</code> (نام اختیاری)</div>
            <div className="form-group">
              <label className="form-label">لیست شماره‌ها</label>
              <textarea className="form-control" rows={10} placeholder={"09120000001,علی\n09120000002\n09120000003,سارا"}
                value={importText} onChange={e => setImportText(e.target.value)}
                style={{ direction: 'ltr', fontFamily: 'monospace' }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={importContacts}>📥 وارد کردن</button>
              <button className="btn btn-secondary" onClick={() => setShowImport(false)}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
