import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import { listWorkspaces } from '../../api/workspaces';
import { useWorkspaceStore } from '../../store/workspaceStore';

export default function AppShell() {
  const { setWorkspaces } = useWorkspaceStore();

  // Load workspaces once globally so every page has activeWorkspace
  useQuery({
    queryKey: ['workspaces'],
    queryFn: () => listWorkspaces().then(r => { setWorkspaces(r.data.workspaces); return r.data.workspaces; }),
    staleTime: 30_000,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
