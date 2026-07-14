import { useEffect, useState } from 'react';
import { supabase, type Order, type OrderItem } from '../lib/supabase';
import { useNav } from '../context/NavContext';
import { CheckCircle2, Clock, ChefHat, Bike, Home, IndianRupee } from 'lucide-react';

type OrderWithItems = Order & { items: OrderItem[] };

const STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: CheckCircle2 },
  { key: 'Preparing', label: 'Preparing Food', icon: ChefHat },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Bike },
  { key: 'Delivered', label: 'Delivered', icon: Home },
];

export function OrderSuccessPage({ orderId }: { orderId: string }) {
  const { navigate } = useNav();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: ord } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (!ord) {
          // Check local backup
          const cached = localStorage.getItem('foodxpress_last_order');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.id === orderId) {
              setOrder(parsed);
              setLoading(false);
              return;
            }
          }
          setLoading(false);
          return;
        }

        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        setOrder({ ...ord, items: items || [] });
      } catch {
        // Fallback on error
        const cached = localStorage.getItem('foodxpress_last_order');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.id === orderId) {
            setOrder(parsed);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-48 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  const currentStep = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Success banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white shadow-lg">
        <CheckCircle2 className="mx-auto h-14 w-14" />
        <h1 className="mt-3 text-2xl font-black">Order Placed!</h1>
        <p className="mt-1 text-sm text-green-100">
          Your order from {order.restaurant_name} has been confirmed.
        </p>
      </div>

      {/* Tracking */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Order Status</h2>
        <div className="space-y-1">
          {STEPS.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-8 w-0.5 ${idx < currentStep ? 'bg-green-500' : 'bg-slate-200'}`}
                    />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${
                      isDone ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-green-600">In progress...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Order Summary</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-slate-600">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3 space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Payment Mode</span>
            <span className="font-semibold text-slate-700">
              {order.payment_mode === 'netbanking' ? 'Net Banking' :
               order.payment_mode === 'paylater' ? 'Pay Later' :
               order.payment_mode === 'cod' ? 'Cash on Delivery' :
               order.payment_mode === 'wallet' ? 'FoodXpress Wallet' :
               order.payment_mode === 'card' ? 'Credit/Debit Card' :
               order.payment_mode ? order.payment_mode.toUpperCase() : 'UPI'}
            </span>
          </div>
          {order.payment_ref_number && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>UPI Transaction ID (UTR)</span>
              <span className="font-mono font-bold text-green-600 tracking-wider">
                {order.payment_ref_number}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-800">
            <span>Total Paid</span>
            <span className="flex items-center">
              <IndianRupee className="h-4 w-4" />
              {order.total}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-2 flex items-center gap-1.5 text-lg font-bold text-slate-800">
          <Clock className="h-5 w-5 text-orange-500" />
          Delivery in {30} mins
        </h2>
        <p className="text-sm text-slate-500">{order.address}</p>
      </div>

      <button
        onClick={() => navigate({ name: 'orders' })}
        className="w-full rounded-xl border-2 border-orange-400 bg-white py-3 text-base font-bold text-orange-500 transition-colors hover:bg-orange-50"
      >
        View My Orders
      </button>
      <button
        onClick={() => navigate({ name: 'home' })}
        className="mt-3 w-full rounded-xl bg-slate-100 py-3 text-base font-bold text-slate-600 transition-colors hover:bg-slate-200"
      >
        Back to Home
      </button>
    </div>
  );
}
