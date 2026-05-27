import { create } from 'zustand';
import api from '../lib/api';

interface EventState {
  eventName: string;
  isRunning: boolean;
  isFrozen: boolean;
  loaded: boolean;
  loadEventInfo: () => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  eventName: '',
  isRunning: false,
  isFrozen: false,
  loaded: false,
  loadEventInfo: async () => {
    if (get().loaded) return;
    try {
      const { data } = await api.get('/event/info');
      if (data.success && data.data) {
        set({
          eventName: data.data.name || '',
          isRunning: data.data.isRunning ?? false,
          isFrozen: data.data.isFrozen ?? false,
          loaded: true,
        });
        if (data.data.name) {
          document.title = data.data.name;
        }
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
