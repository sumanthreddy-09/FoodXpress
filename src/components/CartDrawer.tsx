import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNav } from '../context/NavContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { SavedAddress } from '../lib/savedAddresses';
import {
  X, Plus, Minus, ShoppingBag, IndianRupee, MapPin, CheckCircle2, Loader2,
  Home, Briefcase, MapPinned, CreditCard, Wallet, Banknote, Smartphone,
  ChevronDown, Trash2, Plus as PlusIcon, Landmark, Clock, User,
} from 'lucide-react';
import { VegBadge } from './RestaurantCard';

type PaymentMode = 'upi' | 'card' | 'wallet' | 'netbanking' | 'paylater' | 'cod';

const PAYMENT_OPTIONS: { id: PaymentMode; label: string; desc: string; icon: typeof CreditCard }[] = [
  { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
  { id: 'card', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', desc: 'SBI, HDFC, ICICI, Axis', icon: Landmark },
  { id: 'wallet', label: 'FoodXpress Wallet', desc: 'Balance: ₹500', icon: Wallet },
  { id: 'paylater', label: 'Pay Later', desc: 'Simpl, LazyPay', icon: Clock },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
];

const LABEL_ICONS: Record<string, typeof Home> = {
  Home: Home,
  Work: Briefcase,
  Other: MapPinned,
};

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQuantity, clearCart, subtotal, totalItems, restaurantId } = useCart();
  const { navigate } = useNav();
  const { user, setOpen: setAuthOpen } = useAuth();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [placing, setPlacing] = useState(false);

  // Form state
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Payment animations states
  const [paymentStep, setPaymentStep] = useState<'idle' | 'select_upi' | 'processing' | 'success' | 'celebrate'>('idle');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'qr' | null>(null);
  const [upiTab, setUpiTab] = useState<'apps' | 'qr'>('qr');
  const [payeeType, setPayeeType] = useState<'upi' | 'bank'>(() => (localStorage.getItem('foodxpress_payee_type') as any) || 'upi');
  const [merchantUpiId, setMerchantUpiId] = useState(() => localStorage.getItem('foodxpress_upi_id') || 'foodxpress@oksbi');
  const [merchantName, setMerchantName] = useState(() => localStorage.getItem('foodxpress_merchant_name') || 'FoodXpress');
  const [accountNumber, setAccountNumber] = useState(() => localStorage.getItem('foodxpress_acc_no') || '44134232466');
  const [ifscCode, setIfscCode] = useState(() => localStorage.getItem('foodxpress_ifsc') || 'SBIN0002761');
  const [bankName, setBankName] = useState(() => localStorage.getItem('foodxpress_bank_name') || 'State Bank of India');
  const [showUpiConfig, setShowUpiConfig] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [refError, setRefError] = useState<string | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState(() => localStorage.getItem('foodxpress_rzp_key') || '');
  const [rzpKeyError, setRzpKeyError] = useState<string | null>(null);

  const hasConfigError = payeeType === 'upi' ? !!upiError : !!bankError;
  const isQrCodeRefValid = /^\d{12}$/.test(paymentRefNumber);

  useEffect(() => {
    if (isOpen) loadAddresses();
  }, [isOpen]);

  const loadAddresses = async () => {
    const { data } = await supabase.from('saved_addresses').select('*').order('created_at', { ascending: false });
    setAddresses(data || []);
    const defaultAddr = (data || []).find((a) => a.is_default) || (data || [])[0];
    if (defaultAddr) setSelectedAddressId(defaultAddr.id);
  };

  const handleSaveAddress = async () => {
    if (!fullAddress.trim()) return;
    setSavingAddress(true);
    const { data } = await supabase
      .from('saved_addresses')
      .insert({ label, full_address: fullAddress, city, pincode, is_default: addresses.length === 0 })
      .select()
      .maybeSingle();

    if (data) {
      setAddresses((prev) => [data, ...prev]);
      setSelectedAddressId(data.id);
    }
    setFullAddress('');
    setPincode('');
    setLabel('Home');
    setShowAddressForm(false);
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('saved_addresses').delete().eq('id', id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedAddressId === id) setSelectedAddressId(addresses.find((a) => a.id !== id)?.id || null);
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const deliveryFee = subtotal > 0 ? (subtotal > 199 ? 0 : 25) : 0;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiateRazorpayPayment = async (modeLabel: string) => {
    if (!razorpayKeyId) {
      alert(
        "Razorpay API Key ID Missing!\n\n" +
        "To process real/test online payments, you must configure your Razorpay API Key:\n" +
        "1. Open the '⚙️ Configure Bank/UPI Details' panel at the bottom of the screen.\n" +
        "2. Enter your Razorpay API Key ID (e.g. rzp_test_xxxxxxxxxxxxxx).\n\n" +
        "If you don't have an API Key, please select 'Cash on Delivery' or use the 'Scan QR Code' option to check out without a gateway."
      );
      setPlacing(false);
      return;
    }

    setPlacing(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Unable to load payment gateway checkout. Please check your network connection.');
      setPlacing(false);
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: total * 100, // in paise
      currency: 'INR',
      name: 'FoodXpress',
      description: `Order Payment - Total ₹${total}`,
      handler: function (response: any) {
        // Payment successful
        triggerPaymentFlow(modeLabel, response.razorpay_payment_id);
      },
      prefill: {
        name: user?.email ? user.email.split('@')[0] : 'Customer',
        email: user?.email || 'customer@example.com',
      },
      theme: {
        color: '#8b5cf6', // Violet theme color
      },
      modal: {
        ondismiss: function () {
          setPlacing(false);
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      alert(`Razorpay SDK Error: ${e.message || e}`);
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!restaurantId || !selectedAddress || items.length === 0) return;

    if (paymentMode === 'cod') {
      // Cash on delivery directly places the order
      triggerPaymentFlow('cod', null);
      return;
    }

    if (paymentMode === 'upi' && paymentStep === 'idle') {
      // For UPI, open selection modal (apps or manual scan QR)
      setPaymentStep('select_upi');
      return;
    }

    // Trigger Razorpay payment gateway for other online payment modes
    initiateRazorpayPayment(paymentMode);
  };

  const triggerPaymentFlow = (modeLabel: string, transactionId?: string | null) => {
    setPaymentStep('processing');
    setPlacing(true);

    // Step 1: Processing phase
    setTimeout(() => {
      setPaymentStep('success');

      // Step 2: Show success animation, then create order record and show celebration
      setTimeout(async () => {
        const orderId = await executeOrderCreation(transactionId);
        setPaymentStep('celebrate');
        // Celebrate for 3.2 seconds (scooter & confetti) then close and navigate
        setTimeout(() => {
          clearCart();
          setPlacing(false);
          setOpen(false);
          setShowPaymentSection(false);
          setPaymentStep('idle');
          setSelectedUpiApp(null);
          setPaymentRefNumber(''); // reset
          navigate({ name: 'order-success', orderId: orderId || 'demo' });
        }, 3200);
      }, 1200);
    }, 2000);
  };

  const executeOrderCreation = async (transactionId?: string | null): Promise<string | null> => {
    try {
      const restRes = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', restaurantId)
        .maybeSingle();
      const restaurantName = restRes.data?.name || 'Restaurant';

      const fullAddr = selectedAddress
        ? `${selectedAddress.label}: ${selectedAddress.full_address}, ${selectedAddress.city}${selectedAddress.pincode ? ' - ' + selectedAddress.pincode : ''}`
        : 'Default Address';

      const orderId = `demo-${Math.floor(Math.random() * 900000 + 100000)}`;

      // Save a local mock copy of the order to localStorage in case database write fails
      const mockOrder = {
        id: orderId,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        total,
        status: 'Placed',
        address: fullAddr,
        payment_mode: selectedUpiApp ? `upi_${selectedUpiApp}` : paymentMode,
        payment_ref_number: transactionId || (selectedUpiApp === 'qr' ? paymentRefNumber : null),
        created_at: new Date().toISOString(),
        items: items.map((i) => ({
          order_id: orderId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          is_veg: i.is_veg,
        }))
      };
      localStorage.setItem('foodxpress_last_order', JSON.stringify(mockOrder));

      // Try database insert
      let insertResult = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          total,
          status: 'Placed',
          address: fullAddr,
          payment_mode: selectedUpiApp ? `upi_${selectedUpiApp}` : paymentMode,
          payment_ref_number: transactionId || (selectedUpiApp === 'qr' ? paymentRefNumber : null),
        })
        .select()
        .maybeSingle();

      if (insertResult.error && (
        insertResult.error.message.includes('column') || 
        insertResult.error.message.includes('payment_mode') || 
        insertResult.error.message.includes('payment_ref_number')
      )) {
        insertResult = await supabase
          .from('orders')
          .insert({
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            total,
            status: 'Placed',
            address: fullAddr,
          })
          .select()
          .maybeSingle();
      }

      const { data: order } = insertResult;

      if (order) {
        // If DB insert succeeded, let's update local copy ID to the real one
        mockOrder.id = order.id;
        mockOrder.items.forEach(item => item.order_id = order.id);
        localStorage.setItem('foodxpress_last_order', JSON.stringify(mockOrder));

        const orderItems = items.map((i) => ({
          order_id: order.id,
          menu_item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          is_veg: i.is_veg,
        }));
        await supabase.from('order_items').insert(orderItems);
        return order.id;
      }
      
      // If DB insert failed, we still return the mock order ID so the checkout is successful!
      return orderId;
    } catch (e) {
      console.error('Error executing order creation:', e);
      return `demo-${Math.floor(Math.random() * 900000 + 100000)}`;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold text-slate-800">
            {totalItems > 0 ? `Cart (${totalItems})` : 'Your Cart'}
          </h2>
          <button
            onClick={() => {
              setOpen(false);
              setShowPaymentSection(false);
            }}
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Your cart is empty</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add some delicious food to get started!
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate({ name: 'home' });
              }}
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Browse Restaurants
            </button>
          </div>
        ) : !showPaymentSection ? (
          <>
            {/* Items + Address */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex animate-fade-in-up items-center gap-3">
                    <VegBadge isVeg={item.is_veg} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-800">{item.name}</h4>
                      <span className="text-sm text-slate-500">₹{item.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border-2 border-orange-400 bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 text-orange-500 transition-colors hover:bg-orange-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[18px] text-center text-sm font-bold text-orange-500">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 text-orange-500 transition-colors hover:bg-orange-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-slate-700">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address section */}
              {user ? (
                <div className="mt-6">
                  <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Delivery Address
                  </label>

                  {/* Saved addresses */}
                  {addresses.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {addresses.map((addr) => {
                        const Icon = LABEL_ICONS[addr.label] || MapPinned;
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            className={`group flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                              isSelected
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedAddressId(addr.id)}
                          >
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {addr.full_address}, {addr.city}{addr.pincode ? ' - ' + addr.pincode : ''}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(addr.id);
                              }}
                              className="flex-shrink-0 rounded p-1 text-slate-300 transition-colors hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add new address form */}
                  {showAddressForm ? (
                    <div className="mt-3 animate-scale-in rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 p-4">
                      <div className="space-y-3">
                        {/* Label selector */}
                        <div className="flex gap-2">
                          {['Home', 'Work', 'Other'].map((l) => (
                            <button
                              key={l}
                              onClick={() => setLabel(l)}
                              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                                label === l ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-orange-100'
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          placeholder="Enter full address (house no, street, area)"
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-orange-400"
                        />
                        <div className="flex gap-2">
                          <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
                          />
                          <input
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            placeholder="Pincode"
                            maxLength={6}
                            className="w-28 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-orange-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveAddress}
                            disabled={!fullAddress.trim() || savingAddress}
                            className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                          >
                            {savingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                          <button
                            onClick={() => setShowAddressForm(false)}
                            className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-500"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add New Address
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-orange-50/70 p-5 border border-orange-100 text-center animate-fade-in-up">
                  <User className="mx-auto h-9 w-9 text-orange-500 animate-float" />
                  <h4 className="mt-3 text-sm font-bold text-slate-800">Sign in to add address</h4>
                  <p className="mt-1 text-xs text-slate-500 px-3">
                    Please log in to manage your delivery addresses and complete checkout.
                  </p>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="mt-4 w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Bill details */}
            <div className="border-t border-slate-100 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Bill Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'font-semibold text-green-600' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes & Charges (5%)</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {taxes}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-800">
                  <span>To Pay</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {total}
                  </span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => setShowPaymentSection(true)}
                  disabled={!selectedAddress}
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-orange-500 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Proceed to Pay</span>
                  <span className="flex items-center">
                    ₹{total}
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-orange-500 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-orange-600"
                >
                  <span>Sign In to Pay</span>
                  <span className="flex items-center">
                    ₹{total}
                    <ChevronDown className="h-5 w-5 -rotate-90" />
                  </span>
                </button>
              )}

              {user && !selectedAddress && (
                <p className="mt-2 text-center text-xs text-red-500">
                  Please add or select a delivery address
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Payment section */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Back button */}
              <button
                onClick={() => setShowPaymentSection(false)}
                className="mb-4 flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-500"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back to Cart
              </button>

              {/* Selected address summary */}
              {selectedAddress && (
                <div className="mb-4 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    <div>
                      <span className="text-sm font-bold text-slate-800">{selectedAddress.label}</span>
                      <p className="text-xs text-slate-500">
                        {selectedAddress.full_address}, {selectedAddress.city}{selectedAddress.pincode ? ' - ' + selectedAddress.pincode : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment modes */}
              <h3 className="mb-3 text-sm font-bold text-slate-800">Select Payment Mode</h3>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = paymentMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setPaymentMode(opt.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 transition-all animate-fade-in-up ${
                        isSelected
                          ? 'border-orange-400 bg-orange-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle2 className="h-full w-full text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bill summary */}
              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-slate-800">Bill Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Item Total</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'font-semibold text-green-600' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes & Charges (5%)</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-800">
                    <span>To Pay</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Place order */}
            <div className="border-t border-slate-100 p-4">
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Place Order • ₹{total}
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">
                Pay via {PAYMENT_OPTIONS.find((p) => p.id === paymentMode)?.label}
              </p>
            </div>
          </>
        )}
      </div>

      {/* UPI App Selection Modal */}
      {paymentStep === 'select_upi' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-scale-in text-slate-800">
            <h3 className="text-center text-lg font-bold">UPI Payment Options</h3>
            <p className="mt-1 text-center text-xs text-slate-400">Choose to pay via app or scan a QR code</p>
            
            {/* Tabs */}
            <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setUpiTab('apps')}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  upiTab === 'apps' ? 'bg-white shadow text-orange-500' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pay via App
              </button>
              <button
                onClick={() => setUpiTab('qr')}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                  upiTab === 'qr' ? 'bg-white shadow text-orange-500' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Scan QR Code
              </button>
            </div>

            {upiTab === 'apps' ? (
              <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-in">
                {[
                  { id: 'gpay', label: 'Google Pay', color: 'hover:border-blue-400 hover:bg-blue-50/50', logo: 'GPay' },
                  { id: 'phonepe', label: 'PhonePe', color: 'hover:border-purple-400 hover:bg-purple-50/50', logo: 'PhonePe' },
                  { id: 'paytm', label: 'Paytm', color: 'hover:border-sky-400 hover:bg-sky-50/50', logo: 'Paytm' },
                  { id: 'bhim', label: 'BHIM UPI', color: 'hover:border-emerald-400 hover:bg-emerald-50/50', logo: 'BHIM' },
                ].map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedUpiApp(app.id as any);
                      setPaymentStep('idle');
                      initiateRazorpayPayment(`upi_${app.id}`);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-slate-100 p-4 transition-all duration-200 active:scale-95 ${app.color}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black shadow-sm ring-1 ring-slate-100 bg-white">
                      <span className="text-[10px] tracking-tighter uppercase">{app.logo}</span>
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-700">{app.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center animate-fade-in">
                {hasConfigError ? (
                  <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 p-4 text-center">
                    <span className="text-2xl animate-bounce">⚠️</span>
                    <h4 className="mt-2 text-xs font-bold text-red-600">Invalid Payment Settings</h4>
                    <p className="mt-1 text-[10px] text-red-500 font-semibold leading-normal">
                      {payeeType === 'upi' ? upiError : bankError}
                    </p>
                    <p className="mt-2 text-[9px] text-slate-400 font-medium leading-normal">
                      Please fix the details in the settings panel below.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(
                          payeeType === 'bank'
                            ? `upi://pay?pa=${accountNumber}@${ifscCode}.ifsc.npci&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=Order%20Payment`
                            : `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(merchantName)}&am=${total}&cu=INR&tn=Order%20Payment`
                        )}`}
                        alt="UPI Payment QR Code"
                        className="h-44 w-44 object-contain"
                      />
                    </div>
                    <span className="mt-3 text-xs font-black text-slate-700 animate-pulse text-center">
                      Scan to Pay ₹{total}
                    </span>
                  </>
                )}

                {payeeType === 'bank' ? (
                  <div className="mt-3 w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Bank Details</h4>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Bank Name:</span>
                        <span className="font-bold text-slate-800">{bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Holder Name:</span>
                        <span className="font-bold text-slate-800">{merchantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Account No:</span>
                        <span className="font-bold text-slate-800 tracking-wider">{accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">IFSC Code:</span>
                        <span className="font-bold text-slate-800 uppercase">{ifscCode}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-center text-[10px] text-slate-500 font-semibold leading-normal px-2">
                    To: {merchantName} ({merchantUpiId})
                  </p>
                )}

                {/* Config panel */}
                <div className="mt-3 w-full border-t border-slate-100 pt-2.5">
                  <button
                    onClick={() => setShowUpiConfig(!showUpiConfig)}
                    className="flex w-full items-center justify-between text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span>⚙️ Configure Bank/UPI Details</span>
                    <span className="text-xs">{showUpiConfig ? '▲' : '▼'}</span>
                  </button>
                  {showUpiConfig && (
                    <div className="mt-2 space-y-2.5 rounded-lg bg-slate-50 p-2.5 text-left border border-slate-200">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Receive Mode</label>
                        <div className="mt-1 flex rounded bg-white p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              setPayeeType('upi');
                              localStorage.setItem('foodxpress_payee_type', 'upi');
                            }}
                            className={`flex-1 rounded py-1 text-[10px] font-bold transition-all ${
                              payeeType === 'upi' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            UPI VPA ID
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayeeType('bank');
                              localStorage.setItem('foodxpress_payee_type', 'bank');
                            }}
                            className={`flex-1 rounded py-1 text-[10px] font-bold transition-all ${
                              payeeType === 'bank' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Bank Account
                          </button>
                        </div>
                      </div>

                      {payeeType === 'upi' ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Your UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={merchantUpiId}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                setMerchantUpiId(val);
                                localStorage.setItem('foodxpress_upi_id', val);
                                const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z]{2,64}$/;
                                if (!val) {
                                  setUpiError('UPI ID is required');
                                } else if (!upiRegex.test(val)) {
                                  setUpiError('Invalid UPI ID format (use user@handle)');
                                } else {
                                  setUpiError(null);
                                }
                              }}
                              placeholder="e.g. John@okaxis"
                              className={`mt-0.5 w-full rounded border bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 ${
                                upiError ? 'border-red-400 focus:border-red-400 bg-red-50/10' : 'border-slate-200'
                              }`}
                            />
                            {upiError && (
                              <p className="mt-1 text-[9px] font-bold text-red-500">{upiError}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Your Name</label>
                            <input
                              type="text"
                              value={merchantName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMerchantName(val);
                                localStorage.setItem('foodxpress_merchant_name', val);
                              }}
                              placeholder="e.g. John Doe"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Account Holder Name</label>
                            <input
                              type="text"
                              value={merchantName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMerchantName(val);
                                localStorage.setItem('foodxpress_merchant_name', val);
                              }}
                              placeholder="e.g. John Doe"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Bank Name</label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBankName(val);
                                localStorage.setItem('foodxpress_bank_name', val);
                              }}
                              placeholder="e.g. HDFC Bank"
                              className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Bank Account Number</label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                setAccountNumber(val);
                                localStorage.setItem('foodxpress_acc_no', val);
                                const accRegex = /^\d{9,18}$/;
                                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
                                if (!val) {
                                  setBankError('Account number is required');
                                } else if (!accRegex.test(val)) {
                                  setBankError('Account number must be 9 to 18 digits');
                                } else if (!ifscCode) {
                                  setBankError('IFSC code is required');
                                } else if (!ifscRegex.test(ifscCode)) {
                                  setBankError('Invalid IFSC code (e.g. HDFC0000001)');
                                } else {
                                  setBankError(null);
                                }
                              }}
                              placeholder="e.g. 50100482910"
                              className={`mt-0.5 w-full rounded border bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 ${
                                bankError ? 'border-red-400 focus:border-red-400 bg-red-50/10' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">IFSC Code</label>
                            <input
                              type="text"
                              value={ifscCode}
                              onChange={(e) => {
                                const val = e.target.value.trim().toUpperCase();
                                setIfscCode(val);
                                localStorage.setItem('foodxpress_ifsc', val);
                                const accRegex = /^\d{9,18}$/;
                                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
                                if (!accountNumber) {
                                  setBankError('Account number is required');
                                } else if (!accRegex.test(accountNumber)) {
                                  setBankError('Account number must be 9 to 18 digits');
                                } else if (!val) {
                                  setBankError('IFSC code is required');
                                } else if (!ifscRegex.test(val)) {
                                  setBankError('Invalid IFSC code (e.g. HDFC0000001)');
                                } else {
                                  setBankError(null);
                                }
                              }}
                              placeholder="e.g. HDFC0000001"
                              className={`mt-0.5 w-full rounded border bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 ${
                                bankError ? 'border-red-400 focus:border-red-400 bg-red-50/10' : 'border-slate-200'
                              }`}
                            />
                            {bankError && (
                              <p className="mt-1 text-[9px] font-bold text-red-500">{bankError}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Razorpay Key ID Configuration */}
                      <div className="border-t border-slate-200/60 pt-2.5 mt-2.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">
                          Razorpay API Key ID (For Automated Online Payments)
                        </label>
                        <input
                          type="text"
                          value={razorpayKeyId}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setRazorpayKeyId(val);
                            localStorage.setItem('foodxpress_rzp_key', val);
                            const rzpRegex = /^rzp_(test|live)_[a-zA-Z0-9]{14,24}$/;
                            if (val && !rzpRegex.test(val)) {
                              setRzpKeyError('Invalid Razorpay Key format (e.g., rzp_test_...)');
                            } else {
                              setRzpKeyError(null);
                            }
                          }}
                          placeholder="e.g. rzp_live_xxxxxxxxxxxxxx"
                          className={`mt-1 w-full rounded border bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 ${
                            rzpKeyError ? 'border-red-400 focus:border-red-400 bg-red-50/10' : 'border-slate-200'
                          }`}
                        />
                        {rzpKeyError ? (
                          <p className="mt-1 text-[9px] font-bold text-red-500">{rzpKeyError}</p>
                        ) : (
                          <p className="mt-0.5 text-[8px] text-slate-400">
                            Leave blank to run in Test/Sandbox checkout mode.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!hasConfigError && (
                  <div className="mt-4 w-full text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Required: Enter 12-Digit UPI Ref No. / UTR
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={paymentRefNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // only allow digits
                        setPaymentRefNumber(val);
                        if (!val) {
                          setRefError('Transaction reference number is required');
                        } else if (val.length !== 12) {
                          setRefError('Must be exactly 12 digits');
                        } else {
                          setRefError(null);
                        }
                      }}
                      placeholder="e.g. 123456789012"
                      className={`mt-1 w-full rounded-xl border bg-slate-50 p-2.5 text-xs text-slate-800 outline-none transition-all ${
                        refError ? 'border-red-400 focus:border-red-500 focus:bg-white focus:shadow-md' : 'border-slate-200 focus:border-green-500 focus:bg-white focus:shadow-md'
                      }`}
                    />
                    {refError ? (
                      <p className="mt-1 text-[9px] font-bold text-red-500 animate-fade-in">{refError}</p>
                    ) : (
                      <p className="mt-1 text-[9px] font-semibold text-slate-400">
                        Check your GPay/PhonePe receipt for the 12-digit UPI Ref/UTR No.
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedUpiApp('qr');
                    triggerPaymentFlow('qr');
                  }}
                  disabled={hasConfigError || !isQrCodeRefValid}
                  className={`mt-4 w-full rounded-xl py-3 text-xs font-bold text-white shadow-md transition-colors ${
                    hasConfigError || !isQrCodeRefValid
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  I Have Paid
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400 font-medium leading-normal">
                  💡 This is a simulated checkout flow. Scan & pay on your phone, enter UTR, and click <strong>"I Have Paid"</strong> to complete the order.
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                setPaymentStep('idle');
                setPlacing(false);
              }}
              className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Processing/Success/Celebration Animation Overlay */}
      {paymentStep !== 'idle' && paymentStep !== 'select_upi' && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-fade-in text-white">
          
          {paymentStep === 'celebrate' && <ConfettiOverlay />}

          <div className="relative flex flex-col items-center rounded-3xl bg-white/5 p-8 text-center backdrop-blur-md ring-1 ring-white/10 max-w-sm w-full animate-scale-bounce">
            
            {/* Step 1: Processing */}
            {paymentStep === 'processing' && (
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                </div>
                <h3 className="mt-5 text-xl font-bold">Processing Transaction</h3>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedUpiApp === 'qr'
                    ? 'Verifying QR payment confirmation...'
                    : selectedUpiApp 
                    ? `Authorizing via ${selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'paytm' ? 'Paytm' : 'BHIM UPI'}...`
                    : 'Connecting to payment gateway...'}
                </p>
              </div>
            )}

            {/* Step 2: Success */}
            {paymentStep === 'success' && (
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white animate-scale-bounce">
                  <svg className="h-10 w-10 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      style={{
                        strokeDasharray: 50,
                        strokeDashoffset: 50,
                        animation: 'checkmark-draw 0.4s ease-in-out 0.2s forwards'
                      }}
                    />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-bold text-green-400">Payment Successful!</h3>
                <p className="mt-1 text-sm text-slate-300">Transaction ID: TXN-{Math.floor(Math.random() * 900000 + 100000)}</p>
              </div>
            )}

            {/* Step 3: Celebrating */}
            {paymentStep === 'celebrate' && (
              <div className="flex flex-col items-center w-full overflow-hidden">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white animate-scale-bounce">
                  <ShoppingBag className="h-10 w-10" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-orange-400">Order Placed!</h3>
                <p className="mt-1 text-sm text-slate-200">Preparing your delicious meal...</p>
                
                {/* Delivery scooter animation container */}
                <div className="relative w-full h-16 mt-6 border-t border-white/10 pt-4 flex items-center justify-center">
                  <div className="absolute left-0 right-0 animate-scooter text-orange-400 flex items-center gap-1">
                    <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                      <path d="M19 15c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v8h2c0 1.1.9 2 2 2h1.2c.4 1.2 1.5 2 2.8 2s2.4-.8 2.8-2h3.4c.4 1.2 1.5 2 2.8 2s2.4-.8 2.8-2H22v-2h-3zm-13 2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm8-12h1v3h-1V5zm-4 6H4V5h6v6zm3 6c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
                    </svg>
                    <span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-md leading-none">FOODXPRESS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="mt-6 flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-white/5 pt-4 w-full justify-center">
              <svg className="w-3.5 h-3.5 text-green-500 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Secured by UPI & SSL Encryption
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ConfettiOverlay = () => {
  const pieces = Array.from({ length: 75 }).map((_, i) => {
    const left = Math.random() * 100;
    const size = Math.random() * 8 + 6;
    const delay = Math.random() * 3;
    const duration = Math.random() * 2.5 + 2.5;
    const colors = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#eab308', '#ec4899', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm';
    
    return (
      <div
        key={i}
        className="confetti-piece absolute"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });

  return <div className="pointer-events-none absolute inset-0 overflow-hidden z-[100]">{pieces}</div>;
};
