import { NavLink } from 'react-router-dom';
import { MapIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const items: { to: string; icon: React.FC<any>; label: string; end?: boolean }[] = [
  { to: '/', icon: MapIcon, label: 'Карта', end: true },
  { to: '/analytics', icon: ChartBarIcon, label: 'Аналитика' },
];

export function Rail() {
  return (
    <nav
      className="w-20 shrink-0 flex flex-col items-stretch py-3 px-1.5 gap-1 border-r"
      style={{ background: 'var(--tp-bg-panel)', borderColor: 'var(--tp-border)' }}
    >
      <div className="flex items-center justify-center mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-extrabold text-[18px]"
          style={{ background: 'var(--tp-brand)' }}
        >
          М
        </div>
      </div>
      {items.map(it => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.label}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-tpmuted hover:bg-bgpanelhover hover:text-tp'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
