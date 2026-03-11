import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import PlatformCheckPage from './pages/PlatformCheckPage';
import MessagingPage from './pages/MessagingPage';
import CampaignsPage from './pages/CampaignsPage';
import InboxPage from './pages/InboxPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/platform-check" element={<PlatformCheckPage />} />
            <Route path="/messaging" element={<MessagingPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
