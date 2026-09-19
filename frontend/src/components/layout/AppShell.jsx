import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import DemoBanner from './DemoBanner';
import { listWorkspaces } from '../../api/workspaces';
import { useWorkspaceStore } from '../../store/workspaceStore';

export default function AppShell() {
  const { setWorkspaces } = useWorkspaceStore();

  useQuery({
    queryKey: ['workspaces'],
    queryFn: () => listWorkspaces().then(r => { setWorkspaces(r.data.workspaces); return r.data.workspaces; }),
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
