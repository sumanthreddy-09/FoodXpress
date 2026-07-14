import { Star, Clock, IndianRupee, Tag, Leaf } from 'lucide-react';
import type { Restaurant } from '../lib/supabase';
import { useNav } from '../context/NavContext';

export function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate({ name: 'restaurant', id: restaurant.id })}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={restaurant.image_url || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {restaurant.discount && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <span className="text-base font-bold text-white drop-shadow-lg">
              {restaurant.discount}
            </span>
          </div>
        )}
        {restaurant.promoted && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            Promoted
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="truncate text-base font-bold text-slate-800 transition-colors group-hover:text-orange-500">
          {restaurant.name}
        </h3>
        <p className="truncate text-sm text-slate-500">{restaurant.cuisine}</p>

        <div className="mt-1 flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-sm">
          <div className="flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 font-semibold text-green-700">
            <Star className="h-3.5 w-3.5 fill-green-700" />
            {restaurant.rating.toFixed(1)}
          </div>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.delivery_time_min} min
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center text-slate-600">
            <IndianRupee className="h-3.5 w-3.5" />
            {restaurant.price_for_two} for two
          </span>
        </div>
      </div>
    </button>
  );
}

export function CategoryPill({ name, imageUrl, onClick }: { name: string; imageUrl: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-20 flex-shrink-0 flex-col items-center gap-2 sm:w-24"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:ring-orange-400 group-hover:shadow-lg group-hover:shadow-orange-200/50 sm:h-24 sm:w-24">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <span className="text-center text-xs font-semibold text-slate-700 transition-colors group-hover:text-orange-500 sm:text-sm">
        {name}
      </span>
    </button>
  );
}

export function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 ${
        isVeg ? 'border-green-600' : 'border-red-500'
      }`}
    >
      <Leaf className={`h-2.5 w-2.5 ${isVeg ? 'text-green-600' : 'text-red-500'}`} />
    </span>
  );
}

export function DiscountTag({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1 text-sm font-bold text-blue-600">
      <Tag className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}
