import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { me } from './api/auth';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppInventory from './pages/AppInventory';
import ConnectWorkspace from './pages/ConnectWorkspace';
import ScanHistory from './pages/ScanHistory';
import Whitelist from './pages/Whitelist';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Nudges from './pages/Nudges';
import Approvals from './pages/Approvals';
import RequestApproval from './pages/RequestApproval';
import SpendEstimator from './pages/SpendEstimator';
import Reports from './pages/Reports';
import Breaches from './pages/Breaches';
import Offboarding from './pages/Offboarding';
import Extension from './pages/Extension';
import Sensitivity from './pages/Sensitivity';
import VendorRisk from './pages/VendorRisk';
import SlackBot from './pages/SlackBot';
import Webhooks from './pages/Webhooks';

export default function App() {
  const { token, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    me().then(res => setAuth(res.data.user, token)).catch(() => logout());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request/:workspaceId" element={<RequestApproval />} />
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps" element={<AppInventory />} />
          <Route path="/connect" element={<ConnectWorkspace />} />
          <Route path="/scans" element={<ScanHistory />} />
          <Route path="/whitelist" element={<Whitelist />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/nudges" element={<Nudges />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/spend" element={<SpendEstimator />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/breaches" element={<Breaches />} />
          <Route path="/offboarding" element={<Offboarding />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="/sensitivity" element={<Sensitivity />} />
          <Route path="/vendor-risk" element={<VendorRisk />} />
          <Route path="/slack-bot" element={<SlackBot />} />
          <Route path="/webhooks" element={<Webhooks />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
