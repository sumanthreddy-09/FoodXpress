import { useEffect, useState } from 'react';
import { supabase, type Category, type Restaurant } from '../lib/supabase';
import { RestaurantCard } from '../components/RestaurantCard';
import { AutoScrollCategories } from '../components/AutoScrollCategories';
import { useNav } from '../context/NavContext';
import { TrendingUp, Utensils, Clock, Shield, Truck, Star, ArrowRight, Zap, Apple, Egg, Cookie } from 'lucide-react';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useNav();

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: rests }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('restaurants').select('*').order('rating', { ascending: false }),
      ]);
      setCategories(cats || []);
      setRestaurants(rests || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div className="h-40 rounded-2xl shimmer" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 w-24 flex-shrink-0 rounded-full shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 p-6 animate-gradient sm:p-12">
          {/* Floating food items */}
          <FloatingFoods />

          <div className="relative z-10 max-w-lg">
            <h1 className="animate-fade-in-up text-3xl font-black text-white drop-shadow-lg sm:text-5xl">
              Order food & groceries
            </h1>
            <p className="animate-fade-in-up delay-200 mt-3 text-base text-orange-50 sm:text-xl">
              Discover the best food & drinks in Hyderabad
            </p>
            <div className="animate-fade-in-up delay-300 mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate({ name: 'search' })}
                className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-orange-500 shadow-lg transition-transform hover:scale-105"
              >
                Order Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                <Zap className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                Free delivery over ₹199
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="mx-auto mb-10 max-w-6xl px-4 sm:px-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 sm:text-xl">
          <Utensils className="h-5 w-5 text-orange-500" />
          What's on your mind?
        </h2>
        <AutoScrollCategories categories={categories} onClick={() => navigate({ name: 'search' })} />
      </section>



      {/* All restaurants */}
      <section className="mx-auto mb-12 max-w-6xl px-4 sm:px-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 sm:text-xl">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          All Restaurants
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i % 6} />
          ))}
        </div>
      </section>

      {/* Page info section */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-black text-slate-800">
            Why FoodXpress?
          </h2>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <InfoCard
              icon={Truck}
              title="Lightning Delivery"
              desc="Get your food delivered in under 30 minutes"
              delay={0}
            />
            <InfoCard
              icon={Shield}
              title="Safe & Hygienic"
              desc="Contactless delivery with safety-first approach"
              delay={0.1}
            />
            <InfoCard
              icon={Star}
              title="Top Rated"
              desc="Curated restaurants with quality you can trust"
              delay={0.2}
            />
            <InfoCard
              icon={Clock}
              title="24/7 Service"
              desc="Order anytime, we're always here for you"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 p-8 text-center sm:grid-cols-4 sm:p-12">
          <Stat number="500+" label="Restaurants" delay={0} />
          <Stat number="50K+" label="Happy Customers" delay={0.1} />
          <Stat number="30 min" label="Avg Delivery" delay={0.2} />
          <Stat number="4.5★" label="Customer Rating" delay={0.3} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: typeof Star;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="group flex flex-col items-center gap-3 rounded-2xl bg-slate-50 p-6 text-center transition-all hover:-translate-y-1 hover:bg-orange-50 hover:shadow-lg animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 transition-transform group-hover:scale-110 group-hover:rotate-6">
        <Icon className="h-7 w-7 text-orange-500" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function Stat({ number, label, delay }: { number: string; label: string; delay: number }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <p className="text-3xl font-black text-orange-400 sm:text-4xl">{number}</p>
      <p className="mt-1 text-sm font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function FloatingFoods() {
  const items = [
    // Top right - Large Pizza Bowl
    { src: 'https://images.pexels.com/photos/845811/pexels-photo-845811.jpeg', cls: 'animate-float-rotate duration-1000', pos: 'right-[5%] top-[8%] h-14 w-14 sm:h-24 sm:w-24' },
    // Mid right - Biryani Bowl
    { src: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg', cls: 'animate-float-weave', pos: 'right-[18%] top-[25%] h-12 w-12 sm:h-20 sm:w-20' },
    // Bottom right - Burger Plate
    { src: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg', cls: 'animate-float-slow-bob', pos: 'right-[3%] bottom-[10%] h-14 w-14 sm:h-22 sm:w-22' },
    // Bottom center-right - South Indian Dosa
    { src: 'https://images.pexels.com/photos/356079/pexels-photo-356079.jpeg', cls: 'animate-float-weave', pos: 'right-[22%] bottom-[12%] h-10 w-10 sm:h-16 sm:w-16' },
    // Top center-right - Cake/Dessert
    { src: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg', cls: 'animate-float-slow-bob', pos: 'right-[32%] top-[10%] h-11 w-11 sm:h-16 sm:w-16' },
    // Chinese Noodles - middle left background
    { src: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg', cls: 'animate-float-rotate', pos: 'left-[45%] top-[15%] h-10 w-10 sm:h-16 sm:w-16 opacity-30 sm:opacity-75' },
    // North Indian curry bowl - bottom middle background
    { src: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg', cls: 'animate-float-weave', pos: 'left-[35%] bottom-[12%] h-9 w-9 sm:h-14 sm:w-14 opacity-20 sm:opacity-55' },
    // Fresh Salad Bowl - middle center background
    { src: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg', cls: 'animate-float-slow-bob', pos: 'right-[42%] bottom-[20%] h-10 w-10 sm:h-15 sm:w-15 opacity-25 sm:opacity-65' },
    // Coffee/Beverage - top left background
    { src: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg', cls: 'animate-float-weave', pos: 'left-[15%] top-[5%] h-8 w-8 sm:h-12 sm:w-12 opacity-15 sm:opacity-40' },
  ];

  const groceryIcons = [
    { Icon: Apple, pos: 'left-[8%] top-[45%] text-red-200/40 h-6 w-6 sm:h-10 sm:w-10 animate-grocery-pulse delay-100' },
    { Icon: Egg, pos: 'left-[28%] top-[65%] text-yellow-100/30 h-7 w-7 sm:h-11 sm:w-11 animate-grocery-pulse delay-300' },
    { Icon: Cookie, pos: 'right-[15%] top-[68%] text-amber-200/40 h-6 w-6 sm:h-10 sm:w-10 animate-grocery-pulse delay-500' },
    { Icon: Star, pos: 'right-[38%] top-[55%] text-orange-200/35 h-5 w-5 sm:h-8 sm:w-8 animate-grocery-pulse delay-200' }
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Real dishes */}
      {items.map((item, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-white/20 p-1 shadow-lg backdrop-blur-sm ring-2 ring-white/30 transition-transform ${item.cls} ${item.pos}`}
        >
          <img
            src={item.src}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      ))}

      {/* Grocery Icons */}
      {groceryIcons.map((item, i) => {
        const Icon = item.Icon;
        return (
          <div key={i} className={`absolute ${item.pos}`}>
            <Icon className="h-full w-full stroke-[1.5]" />
          </div>
        );
      })}
    </div>
  );
}
