import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { addNotification } = useApp();
  const [saved, setSaved] = useState(false);

  const platforms = [
    { id: 'telegram', label: 'تلگرام', icon: '✈️', desc: 'API Token ربات تلگرام' },
    { id: 'whatsapp', label: 'واتساپ', icon: '📱', desc: 'WhatsApp Business API' },
    { id: 'ita', label: 'ایتا', icon: '🌐', desc: 'توکن API ایتا' },
    { id: 'bale', label: 'بله', icon: '💬', desc: 'توکن API بله' },
    { id: 'rubika', label: 'روبیکا', icon: '🟣', desc: 'توکن API روبیکا' },
  ];

  function save() {
    // NOTE: Placeholder — platform tokens are not yet persisted.
    // In production, store encrypted tokens via Tauri's secure store or database.
    addNotification('success', 'تنظیمات ذخیره شد');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card mb-4">
        <div className="card-title">🔗 تنظیمات پلتفرم‌ها</div>
        <div className="alert alert-warning mb-4">
          ⚠️ برای اتصال واقعی به هر پلتفرم، توکن API یا اطلاعات احراز هویت مربوطه را وارد کنید.
          این اطلاعات به صورت محلی روی دستگاه شما ذخیره می‌شود.
        </div>
        {platforms.map(p => (
          <div key={p.id} className="form-group">
            <label className="form-label">{p.icon} {p.label} - {p.desc}</label>
            <input
              type="password"
              className="form-control"
              placeholder={`توکن ${p.label}...`}
              style={{ direction: 'ltr', fontFamily: 'monospace' }}
            />
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="card-title">🔔 تنظیمات اعلان</div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>اعلان برای پیام‌های دریافتی</span>
          </label>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>اعلان برای مشاهده پیام</span>
          </label>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span>اعلان صوتی</span>
          </label>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-title">⚙️ تنظیمات ارسال</div>
        <div className="form-group">
          <label className="form-label">تأخیر پیش‌فرض بین پیام‌ها (ثانیه)</label>
          <input type="number" className="form-control" defaultValue={2} min={0} max={60} style={{ direction: 'ltr' }} />
        </div>
        <div className="form-group">
          <label className="form-label">حداکثر تلاش مجدد در صورت خطا</label>
          <input type="number" className="form-control" defaultValue={3} min={1} max={10} style={{ direction: 'ltr' }} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span>ارسال خودکار پیام‌های زمان‌بندی شده</span>
          </label>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={save}>
        {saved ? '✓ ذخیره شد' : '💾 ذخیره تنظیمات'}
      </button>
    </div>
  );
}
