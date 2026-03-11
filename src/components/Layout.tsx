
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'داشبورد' },
  { path: '/contacts', icon: '👥', label: 'مخاطبین' },
  { path: '/platform-check', icon: '🔍', label: 'بررسی پلتفرم' },
  { path: '/messaging', icon: '✉️', label: 'ارسال پیام' },
  { path: '/campaigns', icon: '📣', label: 'کمپین‌ها' },
  { path: '/inbox', icon: '📥', label: 'صندوق دریافت' },
  { path: '/history', icon: '📋', label: 'تاریخچه' },
  { path: '/settings', icon: '⚙️', label: 'تنظیمات' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'داشبورد',
  '/contacts': 'مدیریت مخاطبین',
  '/platform-check': 'بررسی حساب پلتفرم',
  '/messaging': 'ارسال پیام',
  '/campaigns': 'کمپین‌های پیام',
  '/inbox': 'صندوق دریافت',
  '/history': 'تاریخچه پیام‌ها',
  '/settings': 'تنظیمات',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, markAllRead } = useApp();
  const title = PAGE_TITLES[location.pathname] ?? 'پلتفرم پیام‌رسانی';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💬</div>
            <span>پیام‌رسانی</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/inbox' && state.unreadCount > 0 && (
                <span className="nav-badge">{state.unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item" style={{ fontSize: 12, color: '#475569' }}>
            نسخه ۱.۰.۰
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            {state.unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                🔔 {state.unreadCount} اعلان جدید
              </button>
            )}
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
