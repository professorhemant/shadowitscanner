import { create } from 'zustand';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  setWorkspaces: (workspaces) => set((state) => {
    // Keep existing selection if it's still in the list
    if (state.activeWorkspace && workspaces.find(w => w.id === state.activeWorkspace.id)) {
      return { workspaces };
    }
    // Prefer workspace with most recent scan over unscanned ones
    const sorted = [...workspaces].sort((a, b) => {
      const aDate = a.last_scan_at ? new Date(a.last_scan_at) : new Date(0);
      const bDate = b.last_scan_at ? new Date(b.last_scan_at) : new Date(0);
      return bDate - aDate;
    });
    return { workspaces, activeWorkspace: sorted[0] || null };
  }),
  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
}));
