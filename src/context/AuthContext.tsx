import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type User = {
  phoneOrEmail: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextType = {
  user: User | null;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  login: (phoneOrEmail: string, firstName?: string, lastName?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'foodxpress_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (phoneOrEmail: string, firstName?: string, lastName?: string) => {
    const newUser = { phoneOrEmail, firstName, lastName };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isOpen, setOpen, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
