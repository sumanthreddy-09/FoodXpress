import { useEffect, useState } from 'react';
import { supabase, type Order, type OrderItem } from '../lib/supabase';
import { useNav } from '../context/NavContext';
import { IndianRupee, Clock, ChevronRight, ShoppingBag } from 'lucide-react';

type OrderWithItems = Order & { items: OrderItem[] };

export function OrdersPage() {
  const { navigate } = useNav();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ords || ords.length === 0) {
        setLoading(false);
        return;
      }

      const orderIds = ords.map((o) => o.id);
      const { data: allItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      const grouped: OrderWithItems[] = (ords || []).map((o) => ({
        ...o,
        items: (allItems || []).filter((i) => i.order_id === o.id),
      }));

      setOrders(grouped);
      setLoading(false);
    })();
  }, []);

  const statusColors: Record<string, string> = {
    Placed: 'bg-blue-100 text-blue-700',
    Preparing: 'bg-amber-100 text-amber-700',
    'Out for Delivery': 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700',
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-700">No orders yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your past orders will appear here.
          </p>
        </div>
        <button
          onClick={() => navigate({ name: 'home' })}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          Order Food Now
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 animate-fade-in-up text-2xl font-black text-slate-800">Your Orders</h1>
      <div className="space-y-4">
        {orders.map((order, idx) => (
          <div
            key={order.id}
            className="animate-fade-in-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{order.restaurant_name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  statusColors[order.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-600">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex flex-col">
                <span className="flex items-center gap-1 text-sm font-bold text-slate-800">
                  <IndianRupee className="h-4 w-4" />
                  {order.total}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Paid via: {order.payment_mode === 'netbanking' ? 'Net Banking' :
                             order.payment_mode === 'paylater' ? 'Pay Later' :
                             order.payment_mode === 'cod' ? 'Cash on Delivery' :
                             order.payment_mode === 'wallet' ? 'FoodXpress Wallet' :
                             order.payment_mode === 'card' ? 'Credit/Debit Card' :
                             order.payment_mode ? order.payment_mode.toUpperCase() : 'UPI'}
                </span>
              </div>
              <button
                onClick={() => navigate({ name: 'restaurant', id: order.restaurant_id })}
                className="flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600"
              >
                Reorder
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
