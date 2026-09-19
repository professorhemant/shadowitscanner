import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import DemoBanner from './DemoBanner';
import OnboardingWizard from '../onboarding/OnboardingWizard';
import { listWorkspaces } from '../../api/workspaces';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';

const DEMO_EMAIL = 'demo@shadowit.app';

export default function AppShell() {
  const { setWorkspaces, workspaces } = useWorkspaceStore();
  const user = useAuthStore(s => s.user);
  const [wizardDismissed, setWizardDismissed] = useState(
    () => !!localStorage.getItem('shadow_onboarding_done')
  );

  useQuery({
    queryKey: ['workspaces'],
    queryFn: () => listWorkspaces().then(r => { setWorkspaces(r.data.workspaces); return r.data.workspaces; }),
    staleTime: 30_000,
  });

  const isDemo = user?.email === DEMO_EMAIL;
  const showWizard = !isDemo && !wizardDismissed && workspaces.length === 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>

      {showWizard && (
        <OnboardingWizard onDismiss={() => {
          localStorage.setItem('shadow_onboarding_done', '1');
          setWizardDismissed(true);
        }} />
      )}
    </div>
  );
}
