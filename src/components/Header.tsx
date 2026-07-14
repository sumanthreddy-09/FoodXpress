import { ShoppingBag, Search, Home, ClipboardList, ChevronDown, MapPin, User, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNav } from '../context/NavContext';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function Header() {
  const { totalItems, setOpen: setCartOpen } = useCart();
  const { page, navigate } = useNav();
  const { user, setOpen: setAuthOpen, logout } = useAuth();

  const isHome = page.name === 'home';

  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex-shrink-0"
        >
          <Logo size="md" />
        </button>

        {/* Location */}
        <button className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-orange-500">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span className="max-w-[80px] truncate sm:max-w-none">Hyderabad</span>
          <ChevronDown className="h-4 w-4 text-orange-500" />
        </button>

        {/* Search bar - desktop */}
        <div className="relative hidden flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for restaurants and food"
            onFocus={() => navigate({ name: 'search' })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-orange-400 focus:bg-white focus:shadow-md"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={() => navigate({ name: 'home' })}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                isHome ? 'text-orange-500' : 'text-slate-600 hover:text-orange-500'
              }`}
            >
              <Home className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              onClick={() => navigate({ name: 'orders' })}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                page.name === 'orders' ? 'text-orange-500' : 'text-slate-600 hover:text-orange-500'
              }`}
            >
              <ClipboardList className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Orders</span>
            </button>
            {user ? (
              <div className="group relative">
                <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-500">
                  <User className="h-4 w-4 text-orange-500" />
                  <span className="max-w-[90px] truncate hidden sm:inline">
                    {user.firstName || user.phoneOrEmail.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {/* Hover Dropdown */}
                <div className="absolute right-0 top-full hidden pt-2 group-hover:block z-50">
                  <div className="w-36 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-100">
                    <button
                      onClick={() => navigate({ name: 'orders' })}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-500"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      My Orders
                    </button>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-500"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </nav>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-orange-500 transition-colors hover:bg-orange-50"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] animate-bounce-in items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search for restaurants and food"
            onFocus={() => navigate({ name: 'search' })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-orange-400 focus:bg-white"
          />
        </div>
      </div>
    </header>
  );
}
