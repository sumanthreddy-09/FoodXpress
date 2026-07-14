import { useEffect, useState } from 'react';
import { supabase, type Restaurant, type MenuCategory, type MenuItem } from '../lib/supabase';
import { useNav } from '../context/NavContext';
import { useCart } from '../context/CartContext';
import { Star, Clock, IndianRupee, ArrowLeft, Plus, Minus, Flame } from 'lucide-react';
import { VegBadge } from '../components/RestaurantCard';

type GroupedMenu = {
  category: MenuCategory;
  items: MenuItem[];
};

export function RestaurantPage({ restaurantId }: { restaurantId: string }) {
  const { navigate } = useNav();
  const { items, addItem, updateQuantity, restaurantId: cartRestId } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<GroupedMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: rest }, { data: cats }, { data: menuItems }] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', restaurantId).maybeSingle(),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('rating', { ascending: false }),
      ]);

      setRestaurant(rest);
      const processedMenuItems = (menuItems || []).map((item) => {
        if (item.name === 'Black Forest Cake (500g)') {
          return { ...item, price: 1 };
        }
        return item;
      });
      const grouped: GroupedMenu[] = (cats || []).map((c) => ({
        category: c,
        items: processedMenuItems.filter((i) => i.menu_category_id === c.id),
      }));
      setMenu(grouped);
      setLoading(false);
    })();
  }, [restaurantId]);

  const getQty = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  if (loading || !restaurant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-2xl bg-slate-200" />
          <div className="h-8 w-1/2 rounded bg-slate-200" />
          <div className="h-6 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  const isDifferentRestaurant = cartRestId && cartRestId !== restaurantId;

  return (
    <div>
      {/* Cover */}
      <div className="relative h-48 overflow-hidden sm:h-56">
        <img
          src={restaurant.cover_url || restaurant.image_url || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => navigate({ name: 'home' })}
          className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-md transition-colors hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Restaurant info card */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mt-10 animate-fade-in-up rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 sm:-mt-12 sm:p-6">
          <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{restaurant.cuisine}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-dashed border-slate-200 pt-3 text-sm">
            <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700">
              <Star className="h-4 w-4 fill-green-700" />
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              {restaurant.delivery_time_min} mins
            </span>
            <span className="flex items-center gap-0.5 text-slate-600">
              <IndianRupee className="h-4 w-4 text-slate-400" />
              {restaurant.price_for_two} for two
            </span>
          </div>
          {restaurant.discount && (
            <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600">
              {restaurant.discount}
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {isDifferentRestaurant && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
            Your cart has items from a different restaurant. Adding new items will start a fresh cart.
          </div>
        )}
        {menu.map((group) => (
          <section key={group.category.id} className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              {group.category.name}{' '}
              <span className="text-sm font-normal text-slate-400">
                ({group.items.length})
              </span>
            </h2>
            <div className="space-y-4">
              {group.items.map((item) => {
                const qty = getQty(item.id);
                return (
                  <div
                    key={item.id}
                    className="group flex gap-4 border-b border-slate-100 pb-4 transition-colors hover:bg-slate-50/50"
                  >
                    {/* Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                      <img
                        src={item.image_url || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {item.bestseller && (
                        <span className="absolute left-0 top-0 flex items-center gap-0.5 bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <Flame className="h-2.5 w-2.5" />
                          Bestseller
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <VegBadge isVeg={item.is_veg} />
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                      </div>
                      {item.rating > 0 && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-green-700">
                          <Star className="h-3 w-3 fill-green-700" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                      {item.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.description}</p>
                      )}
                      <span className="mt-1 text-sm font-bold text-slate-700">
                        ₹{item.price}
                      </span>

                      {/* Add/Qty controls */}
                      <div className="mt-auto pt-2">
                        {qty === 0 ? (
                          <button
                            onClick={() =>
                              addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                is_veg: item.is_veg,
                                image_url: item.image_url,
                                restaurant_id: restaurantId,
                              })
                            }
                            className="flex items-center gap-1 rounded-lg border-2 border-orange-400 bg-white px-4 py-1.5 text-sm font-bold text-orange-500 shadow-sm transition-colors hover:bg-orange-50"
                          >
                            <Plus className="h-4 w-4" />
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg border-2 border-orange-400 bg-white shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 text-orange-500 transition-colors hover:bg-orange-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-bold text-orange-500">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 text-orange-500 transition-colors hover:bg-orange-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
