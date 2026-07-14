import { useEffect, useState } from 'react';
import { supabase, type Restaurant } from '../lib/supabase';
import { RestaurantCard } from '../components/RestaurantCard';
import { Search as SearchIcon, X } from 'lucide-react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('restaurants').select('*');
      setAllRestaurants(data || []);
      setFiltered(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(allRestaurants);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      allRestaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q),
      ),
    );
  }, [query, allRestaurants]);

  const filters = ['All', 'Rating 4.0+', 'Fast Delivery', 'Pure Veg', 'Offers'];

  const applyFilter = (filter: string) => {
    if (filter === 'All') {
      setFiltered(allRestaurants);
    } else if (filter === 'Rating 4.0+') {
      setFiltered(allRestaurants.filter((r) => r.rating >= 4.0));
    } else if (filter === 'Fast Delivery') {
      setFiltered(allRestaurants.filter((r) => r.delivery_time_min <= 30));
    } else if (filter === 'Pure Veg') {
      setFiltered(allRestaurants.filter((r) => r.cuisine.toLowerCase().includes('south indian') || r.cuisine.toLowerCase().includes('desserts')));
    } else if (filter === 'Offers') {
      setFiltered(allRestaurants.filter((r) => r.discount));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Search bar */}
      <div className="relative mb-4 animate-fade-in-up">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for restaurants and food"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-base text-slate-700 shadow-sm outline-none transition-all focus:border-orange-400 focus:shadow-md"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => applyFilter(f)}
            className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-500"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 shimmer rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <SearchIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No restaurants found</h3>
          <p className="text-sm text-slate-500">Try a different search term or filter</p>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-sm font-semibold text-slate-500">
            {filtered.length} restaurants found
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
