import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem } from '../lib/supabase';

type CartContextType = {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'swiggy_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validatedItems = (parsed.items || []).map((i: any) => {
          if (i.name === 'Black Forest Cake (500g)') {
            return { ...i, price: 1 };
          }
          return i;
        });
        setItems(validatedItems);
        setRestaurantId(parsed.restaurantId || null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, restaurantId }));
  }, [items, restaurantId]);

  const addItem: CartContextType['addItem'] = (item, quantity = 1) => {
    const finalPrice = item.name === 'Black Forest Cake (500g)' ? 1 : item.price;
    setRestaurantId(item.restaurant_id);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, price: finalPrice, quantity }];
    });
  };

  const removeItem: CartContextType['removeItem'] = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity: CartContextType['updateQuantity'] = (id, delta) => {
    setItems((prev) => {
      return prev
        .map((i) => {
          if (i.id !== id) return i;
          const q = i.quantity + delta;
          return q <= 0 ? null : { ...i, quantity: q };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
