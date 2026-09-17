import { create } from 'zustand';

export const useWorkspaceStore = create((set) => ({
  workspaces: [],
  activeWorkspace: null,
  setWorkspaces: (workspaces) => set({ workspaces, activeWorkspace: workspaces[0] || null }),
  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
}));
