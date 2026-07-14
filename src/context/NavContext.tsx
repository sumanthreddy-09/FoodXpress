import { createContext, useContext, useState, type ReactNode } from 'react';

export type Page =
  | { name: 'home' }
  | { name: 'restaurant'; id: string }
  | { name: 'search' }
  | { name: 'orders' }
  | { name: 'order-success'; orderId: string };

type NavContextType = {
  page: Page;
  navigate: (page: Page) => void;
};

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({ name: 'home' });

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return <NavContext.Provider value={{ page, navigate }}>{children}</NavContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
