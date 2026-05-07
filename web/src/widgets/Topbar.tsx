import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowRightStartOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  ExclamationCircleIcon,
  SignalIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useKpiLatest } from '@/shared/api/kpi';
import { useAuth } from '@/shared/auth';

function fmtClock(d: Date) {
  return format(d, 'HH:mm:ss');
}

function readTheme(): 'light' | 'dark' {
  return (document.documentElement.getAttribute('data-theme') as any) ?? 'light';
}

export function Topbar() {
  const { data: kpi } = useKpiLatest();
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const loc = useLocation();
  const isAnalytics = loc.pathname.startsWith('/analytics');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tp_theme', next);
    setTheme(next);
  };

  return (
    <header
      className="h-14 shrink-0 border-b px-4 flex items-center gap-4"
      style={{ background: 'var(--tp-bg-panel)', borderColor: 'var(--tp-border)' }}
    >
      <div className="flex flex-col leading-tight">
        <div className="text-[11px] uppercase tracking-widest font-bold text-tpmuted">
          ЦОДД · ОПЕРАТОР
        </div>
        <div className="text-[12px] text-tpsubtle">
          Москва · смена {user?.shift ?? '14:00–22:00'}
        </div>
      </div>

      <div className="flex gap-1 ml-2">
        <NavLink
          to="/"
          end
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold ${!isAnalytics ? 'bg-brand-soft text-brand' : 'text-tpmuted hover:bg-bgpanelhover'}`}
        >
          Карта оператора
        </NavLink>
        <NavLink
          to="/analytics"
          className={`px-3 py-1.5 rounded-md text-[12px] font-semibold ${isAnalytics ? 'bg-brand-soft text-brand' : 'text-tpmuted hover:bg-bgpanelhover'}`}
        >
          Аналитика
        </NavLink>
      </div>

      <div className="flex-1 flex justify-center items-center gap-2">
        <KpiPill
          Icon={BoltIcon}
          label="Балл"
          value={kpi ? kpi.score.toFixed(2) : '—'}
          delta={kpi?.delta.score}
          accentClass="text-brand"
        />
        <KpiPill
          Icon={ExclamationCircleIcon}
          label="Инциденты"
          value={String(kpi?.activeIncidents ?? '—')}
          delta={kpi?.delta.activeIncidents}
          accentClass="text-incaccident"
          deltaFormat="int"
        />
        <KpiPill
          Icon={SignalIcon}
          label="Скорость"
          value={kpi ? `${kpi.avgSpeedKmh.toFixed(0)} км/ч` : '—'}
          accentClass="text-teal"
        />
        <KpiPill
          Icon={VideoCameraIcon}
          label="Камеры"
          value={String(kpi?.camerasOnline ?? '—')}
          accentClass="text-inccamera"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[13px] tabular-nums text-tp">{fmtClock(now)}</span>
        <div className="h-6 w-px" style={{ background: 'var(--tp-border)' }} />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bgpanelhover"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[12px] font-semibold text-tp">{user?.fullName ?? '—'}</span>
              <span className="text-[10px] text-tpsubtle uppercase tracking-wide">
                {user?.roles?.[0] ?? '—'}
              </span>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-tpmuted" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 panel p-1 z-50"
              style={{ boxShadow: 'var(--tp-shadow-lg)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--tp-border)' }}>
                <div className="text-[12px] font-semibold text-tp truncate">{user?.email}</div>
                <div className="text-[10px] text-tpsubtle uppercase">
                  {(user?.roles ?? []).join(' · ')}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-bgpanelhover text-[13px] text-tp"
                role="menuitem"
              >
                {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-bgpanelhover text-[13px] text-tp"
                role="menuitem"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface KpiPillProps {
  Icon: React.FC<any>;
  label: string;
  value: string;
  delta?: number;
  accentClass: string;
  deltaFormat?: 'float' | 'int';
}

function KpiPill({ Icon, label, value, delta, accentClass, deltaFormat = 'float' }: KpiPillProps) {
  const showDelta = typeof delta === 'number' && delta !== 0;
  const TrendIcon = (delta ?? 0) > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const deltaText = deltaFormat === 'int'
    ? Math.abs(delta ?? 0).toString()
    : Math.abs(delta ?? 0).toFixed(2);
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{ background: 'var(--tp-bg-panel-soft)', borderColor: 'var(--tp-border)' }}
    >
      <Icon className={`w-4 h-4 ${accentClass} shrink-0`} />
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[11px] font-semibold text-tpmuted uppercase tracking-wide">
          {label}
        </span>
        <span className="text-[16px] font-bold tabular-nums text-tp">{value}</span>
        {showDelta && (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-tpsubtle tabular-nums">
            <TrendIcon className="w-3 h-3" />
            {deltaText}
          </span>
        )}
      </div>
    </div>
  );
}
