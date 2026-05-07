import { useFeed } from '@/shared/api/feed';
import { format } from 'date-fns';

const TAG_DOT: Record<string, string> = {
  incident: 'var(--tp-inc-accident)',
  dispatch: 'var(--tp-brand)',
  camera: 'var(--tp-inc-camera)',
  sensor: 'var(--tp-inc-closure)',
  weather: 'var(--tp-inc-weather)',
  status: 'var(--tp-text-subtle)',
  event: 'var(--tp-text-muted)',
};

export function FeedPanel() {
  const { data } = useFeed();
  return (
    <section className="panel p-3 h-[170px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-tp">Лента событий</h3>
        <span className="text-[10px] text-tpsubtle">{data?.length ?? 0} записей</span>
      </div>
      <div className="overflow-y-auto flex-1">
        <ul className="space-y-1">
          {(data ?? []).slice(0, 40).map(ev => (
            <li
              key={ev.id}
              className="flex items-center gap-3 text-[12px] py-1 px-1.5 rounded hover:bg-bgpanelhover"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: TAG_DOT[ev.tag] ?? 'var(--tp-text-subtle)' }}
              />
              <span className="font-mono text-[10px] text-tpsubtle w-12 shrink-0 tabular-nums">
                {format(new Date(ev.ts), 'HH:mm:ss')}
              </span>
              <span className="flex-1 truncate text-tp">{ev.message}</span>
              {ev.incidentId && (
                <span className="font-mono text-[10px] text-tpsubtle">{ev.incidentId}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
