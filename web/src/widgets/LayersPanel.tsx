import { useMemo } from 'react';
import { useIncidents } from '@/shared/api/incidents';
import { useDistrictsRanking } from '@/shared/api/districts';
import {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  NoSymbolIcon,
  VideoCameraIcon,
  CloudIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';

const LAYER_ICONS: Record<string, React.FC<any>> = {
  accident: ExclamationTriangleIcon,
  works: WrenchScrewdriverIcon,
  closure: NoSymbolIcon,
  camera: VideoCameraIcon,
  weather: CloudIcon,
};

const LAYER_LABEL: Record<string, string> = {
  accident: 'ДТП',
  works: 'Работы',
  closure: 'Перекрытия',
  camera: 'Камеры АСУДД',
  weather: 'Погода',
};

const LAYER_COLOR: Record<string, string> = {
  accident: 'var(--tp-inc-accident)',
  works: 'var(--tp-inc-works)',
  closure: 'var(--tp-inc-closure)',
  camera: 'var(--tp-inc-camera)',
  weather: 'var(--tp-inc-weather)',
};

function jamColor(score: number) {
  if (score < 3) return 'var(--tp-jam-0)';
  if (score < 5) return 'var(--tp-jam-1)';
  if (score < 6.5) return 'var(--tp-jam-2)';
  if (score < 8) return 'var(--tp-jam-3)';
  if (score < 9) return 'var(--tp-jam-4)';
  return 'var(--tp-jam-5)';
}

interface Props {
  layers: Record<string, boolean>;
  onToggle: (key: string) => void;
  trafficVisible: boolean;
  onToggleTraffic: () => void;
}

export function LayersPanel({ layers, onToggle, trafficVisible, onToggleTraffic }: Props) {
  const { data } = useIncidents();
  const { data: ranking } = useDistrictsRanking();

  const counts = useMemo(() => {
    const c: Record<string, number> = { accident: 0, works: 0, closure: 0, camera: 0, weather: 0 };
    for (const it of data?.items ?? []) {
      c[it.type] = (c[it.type] ?? 0) + 1;
    }
    return c;
  }, [data]);

  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto pr-2 space-y-3">
      <section className="panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <Square3Stack3DIcon className="w-4 h-4 text-tpmuted" />
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-tp">Слои</h3>
        </div>
        <div className="space-y-1.5">
          <Row
            label="Пробки"
            iconColor="var(--tp-brand)"
            count={null}
            active={trafficVisible}
            onToggle={onToggleTraffic}
            Icon={Square3Stack3DIcon}
          />
          {(['accident', 'works', 'closure', 'camera', 'weather'] as const).map(k => {
            const Icon = LAYER_ICONS[k];
            return (
              <Row
                key={k}
                label={LAYER_LABEL[k]}
                iconColor={LAYER_COLOR[k]}
                count={counts[k] ?? 0}
                active={layers[k] !== false}
                onToggle={() => onToggle(k)}
                Icon={Icon}
              />
            );
          })}
        </div>
      </section>

      <section className="panel p-3">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-tp mb-3">Рейтинг округов</h3>
        <ul className="space-y-2">
          {(ranking ?? []).map(d => (
            <li key={d.code} className="flex items-center gap-2 text-[12px]">
              <span
                className="inline-block w-2 h-6 rounded-sm shrink-0"
                style={{ background: jamColor(d.score) }}
              />
              <span className="font-mono text-tpmuted w-12">{d.code}</span>
              <span className="flex-1 truncate text-tp">{d.name}</span>
              <span className="tabular-nums font-semibold text-tp">{d.score.toFixed(1)}</span>
              <span className="text-tpsubtle text-[11px]">{d.incidents.active}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function Row({
  label,
  iconColor,
  count,
  active,
  onToggle,
  Icon,
}: {
  label: string;
  iconColor: string;
  count: number | null;
  active: boolean;
  onToggle: () => void;
  Icon: React.FC<any>;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[13px] transition-colors ${active ? 'bg-bgpanelsoft' : 'opacity-55'} hover:bg-bgpanelhover`}
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: iconColor }} />
      <span className="flex-1 truncate text-tp">{label}</span>
      {count !== null && (
        <span className="text-[11px] font-mono tabular-nums text-tpmuted">{count}</span>
      )}
      <span
        className={`w-7 h-4 rounded-full relative transition-colors ${active ? 'bg-brand' : 'bg-bgpanelhover'}`}
      >
        <span
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all"
          style={{ left: active ? '14px' : '2px', boxShadow: '0 1px 3px rgba(15,20,25,0.2)' }}
        />
      </span>
    </button>
  );
}
