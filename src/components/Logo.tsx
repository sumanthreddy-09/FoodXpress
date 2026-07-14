import { UtensilsCrossed } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: { box: 'h-8 w-8', icon: 'h-4.5 w-4.5', text: 'text-base' },
    md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-xl' },
    lg: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-2xl' },
  };
  const d = dimensions[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative flex ${d.box} items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 shadow-lg shadow-orange-500/30 transition-transform hover:scale-110 hover:rotate-3`}
      >
        <UtensilsCrossed className={`${d.icon} text-white`} strokeWidth={2.5} />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${d.text} font-black tracking-tight text-slate-800`}>
          Food<span className="text-orange-500">Xpress</span>
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-slate-400">
          DELIVER WITH LOVE
        </span>
      </div>
    </div>
  );
}
