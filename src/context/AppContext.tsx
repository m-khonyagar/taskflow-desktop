import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { AppNotification } from '../types';

interface AppContextState {
  notifications: AppNotification[];
  unreadCount: number;
}

type AppAction =
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_ALL_READ' }
  | { type: 'DISMISS'; payload: string };

function reducer(state: AppContextState, action: AppAction): AppContextState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'DISMISS':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppContextState;
  addNotification: (type: AppNotification['type'], message: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: [], unreadCount: 0 });
  const counterRef = useRef(0);

  const addNotification = useCallback((type: AppNotification['type'], message: string) => {
    const notif: AppNotification = {
      id: `${Date.now()}-${++counterRef.current}`,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      message,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notif });
  }, []);

  const markAllRead = useCallback(() => dispatch({ type: 'MARK_ALL_READ' }), []);
  const dismiss = useCallback((id: string) => dispatch({ type: 'DISMISS', payload: id }), []);

  return (
    <AppContext.Provider value={{ state, addNotification, markAllRead, dismiss }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

