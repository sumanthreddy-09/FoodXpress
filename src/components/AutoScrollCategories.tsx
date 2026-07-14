import type { Category } from '../lib/supabase';
import { CategoryPill } from './RestaurantCard';

export function AutoScrollCategories({ categories, onClick }: { categories: Category[]; onClick?: () => void }) {
  // Duplicate the list so the marquee loops seamlessly
  const doubled = [...categories, ...categories];

  return (
    <div className="relative overflow-hidden">
      {/* Edge fade gradients */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-slate-50 to-transparent" />

      {/* Marquee track */}
      <div className="marquee-pause flex w-max gap-4 animate-marquee">
        {doubled.map((cat, i) => (
          <CategoryPill
            key={`${cat.id}-${i}`}
            name={cat.name}
            imageUrl={cat.image_url || 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
}
