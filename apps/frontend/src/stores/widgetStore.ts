import { create } from 'zustand';
import type { DashboardWidget, CreateWidgetRequest, UpdateWidgetRequest, WidgetLayoutUpdate } from '@/types/dashboard';

interface WidgetStore {
  widgets: DashboardWidget[];
  loading: boolean;
  error: string | null;
  
  fetchWidgets: () => Promise<void>;
  addWidget: (widget: CreateWidgetRequest) => Promise<void>;
  updateWidget: (widgetId: string, updates: UpdateWidgetRequest) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  updateLayout: (layouts: WidgetLayoutUpdate[]) => Promise<void>;
  clearError: () => void;
}

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  widgets: [],
  loading: false,
  error: null,

  fetchWidgets: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/widgets');
      if (!response.ok) throw new Error('Failed to fetch widgets');
      const widgets = await response.json();
      set({ widgets, loading: false, error: null });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addWidget: async (widget: CreateWidgetRequest) => {
    try {
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(widget),
      });
      if (!response.ok) throw new Error('Failed to add widget');
      const newWidget = await response.json();
      set({ widgets: [...get().widgets, newWidget], error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateWidget: async (widgetId: string, updates: UpdateWidgetRequest) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update widget');
      const updatedWidget = await response.json();
      set({
        widgets: get().widgets.map(w => w.id === widgetId ? updatedWidget : w),
        error: null
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removeWidget: async (widgetId: string) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove widget');
      set({ widgets: get().widgets.filter(w => w.id !== widgetId), error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateLayout: async (layouts: WidgetLayoutUpdate[]) => {
    try {
      const response = await fetch('/api/widgets/batch-update-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layouts),
      });
      if (!response.ok) throw new Error('Failed to update layouts');
      set({ error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));