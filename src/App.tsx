import { CartProvider } from './context/CartContext';
import { NavProvider, useNav } from './context/NavContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { LoginModal } from './components/LoginModal';
import { Logo } from './components/Logo';
import { HomePage } from './pages/HomePage';
import { RestaurantPage } from './pages/RestaurantPage';
import { SearchPage } from './pages/SearchPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';

function Pages() {
  const { page } = useNav();

  switch (page.name) {
    case 'home':
      return <HomePage />;
    case 'restaurant':
      return <RestaurantPage restaurantId={page.id} />;
    case 'search':
      return <SearchPage />;
    case 'orders':
      return <OrdersPage />;
    case 'order-success':
      return <OrderSuccessPage orderId={page.orderId} />;
    default:
      return <HomePage />;
  }
}

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <Pages />
      </main>
      <CartDrawer />
      <LoginModal />
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4">
          <Logo size="md" />
          <p className="max-w-md text-center text-sm text-slate-400">
            FoodXpress is a food delivery demo built with React, Tailwind CSS & Supabase.
            Order from your favourite restaurants in Hyderabad with lightning-fast delivery.
          </p>
          <div className="flex gap-6 text-sm font-semibold text-slate-500">
            <span>About Us</span>
            <span>Help & Support</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs font-semibold text-slate-400 mt-1">
            <span className="flex items-center gap-1">📍 Hyderabad, India</span>
            <span className="flex items-center gap-1">
              ✉️ <a href="mailto:sumanthreddy3695@gmail.com" className="hover:text-orange-500 transition-colors">sumanthreddy3695@gmail.com</a>
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            © 2026 FoodXpress. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </NavProvider>
    </AuthProvider>
  );
}
