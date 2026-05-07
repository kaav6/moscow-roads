import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Label,
} from 'recharts';
import { useAnalyticsDashboard } from '@/shared/api/analytics';
import { format } from 'date-fns';

const RANGES: { value: 'today' | 'week' | 'month'; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

const AXIS = { stroke: '#8A93A1', fontSize: 11, tickLine: false };
const GRID = { stroke: '#E3E6EC', strokeDasharray: '3 3', vertical: false };

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--tp-bg-panel)',
    border: '1px solid var(--tp-border)',
    borderRadius: 8,
    fontSize: 12,
    padding: '6px 10px',
    boxShadow: 'var(--tp-shadow-md)',
  },
  labelStyle: { color: 'var(--tp-text-muted)', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'var(--tp-text)' },
};

function fmtTick(t: string, range: 'today' | 'week' | 'month') {
  const d = new Date(t);
  if (range === 'today') return format(d, 'HH:mm');
  if (range === 'week') return format(d, 'EEE HH:mm');
  return format(d, 'd MMM');
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');
  const { data, isLoading } = useAnalyticsDashboard(range);

  const jamPoints = (data?.jamHistory.points ?? []).map(p => ({
    t: fmtTick(p.t, range),
    v: p.v,
  }));

  return (
    <div className="grid grid-cols-12 gap-3 h-full overflow-y-auto auto-rows-min pr-1">
      <div className="col-span-12 panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-tp">
              Динамика загруженности
            </h2>
            <p className="text-[11px] text-tpsubtle mt-0.5">
              Балл пробок (0–10) · {range === 'today' ? 'окно 24 часа, шаг 5 мин' : range === 'week' ? 'окно 7 дней, шаг 1 ч' : 'окно 30 дней, шаг 6 ч'}
            </p>
          </div>
          <div className="flex gap-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded-md text-[12px] font-semibold ${
                  range === r.value ? 'bg-brand-soft text-brand' : 'text-tpmuted hover:bg-bgpanelhover'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 240 }}>
          {isLoading ? (
            <Skeleton />
          ) : (
            <ResponsiveContainer>
              <AreaChart data={jamPoints} margin={{ top: 10, right: 16, bottom: 24, left: 4 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A4FBA" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#1A4FBA" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="t" {...AXIS} minTickGap={32}>
                  <Label value="Время" position="insideBottom" offset={-12} fill="#5B6573" fontSize={11} />
                </XAxis>
                <YAxis {...AXIS} domain={[0, 10]} width={36}>
                  <Label value="балл" position="insideLeft" angle={-90} offset={10} fill="#5B6573" fontSize={11} />
                </YAxis>
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [v.toFixed(2), 'балл']}
                  labelFormatter={(l: string) => `Время · ${l}`}
                />
                <Area type="monotone" dataKey="v" stroke="#1A4FBA" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="col-span-6 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">
          Инциденты по часам
        </h3>
        <p className="text-[11px] text-tpsubtle mb-2">Число событий, сгруппированных по часу регистрации</p>
        <div style={{ width: '100%', height: 200 }}>
          {data?.incidentsByHour && (
            <ResponsiveContainer>
              <BarChart
                data={data.incidentsByHour.map((v, h) => ({ h: `${String(h).padStart(2, '0')}:00`, v }))}
                margin={{ top: 8, right: 8, bottom: 24, left: 4 }}
              >
                <CartesianGrid {...GRID} />
                <XAxis dataKey="h" {...AXIS} interval={2}>
                  <Label value="Час суток" position="insideBottom" offset={-12} fill="#5B6573" fontSize={11} />
                </XAxis>
                <YAxis {...AXIS} allowDecimals={false} width={28}>
                  <Label value="шт" position="insideLeft" angle={-90} offset={10} fill="#5B6573" fontSize={11} />
                </YAxis>
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [v, 'инцидентов']}
                  labelFormatter={(l: string) => `Час · ${l}`}
                />
                <Bar dataKey="v" fill="#1A4FBA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="col-span-6 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">
          Распределение по типам
        </h3>
        <p className="text-[11px] text-tpsubtle mb-3">Доля инцидентов в выбранном периоде</p>
        <ul className="space-y-2.5">
          {(data?.byType ?? []).map(t => (
            <li key={t.type} className="flex items-center gap-2 text-[12px]">
              <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: t.color }} />
              <span className="flex-1 text-tp">{t.type}</span>
              <div className="flex-1 max-w-[220px] h-1.5 rounded-full bg-bgpanelsoft overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ background: t.color, width: `${t.value}%` }}
                />
              </div>
              <span className="font-mono tabular-nums text-tp font-semibold w-10 text-right">
                {t.value}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-12 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">
          Тепловая карта недели
        </h3>
        <p className="text-[11px] text-tpsubtle mb-3">
          Число инцидентов по часам (0–23) и дням недели · цвет = плотность
        </p>
        <Heatmap matrix={data?.weeklyHeatmap} />
      </div>

      <div className="col-span-4 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">Рейтинг округов</h3>
        <p className="text-[11px] text-tpsubtle mb-3">Балл пробок (0–10), сортировка по убыванию</p>
        <ul className="space-y-2">
          {(data?.byDistrict ?? []).slice(0, 9).map(d => (
            <li key={d.code} className="flex items-center gap-2 text-[12px]">
              <span className="font-mono w-12 text-tpmuted">{d.code}</span>
              <span className="flex-1 text-tp truncate">{d.name}</span>
              <div className="w-16 h-1.5 rounded-full bg-bgpanelsoft overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ background: 'var(--tp-brand)', width: `${(d.score / 10) * 100}%` }}
                />
              </div>
              <span className="font-mono tabular-nums font-semibold text-tp w-8 text-right">
                {d.score.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-4 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">Обработка инцидентов</h3>
        <p className="text-[11px] text-tpsubtle mb-3">Среднее время по стадиям, секунды</p>
        <div className="grid grid-cols-3 gap-2">
          <ReactBlock label="Детекция" sec={data?.reactionTime.detectionSec ?? 0} />
          <ReactBlock label="Прибытие" sec={data?.reactionTime.arrivalSec ?? 0} />
          <ReactBlock label="Завершение" sec={data?.reactionTime.resolutionSec ?? 0} />
        </div>
      </div>

      <div className="col-span-4 panel p-4">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-tp">Источники сообщений</h3>
        <p className="text-[11px] text-tpsubtle mb-3">Откуда поступают инциденты, доля от всех</p>
        <ul className="space-y-2">
          {(data?.sources ?? []).map(s => (
            <li key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 text-tp">{s.label}</span>
              <span className="font-mono tabular-nums font-semibold text-tp">{s.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="w-full h-full panel-soft animate-pulse" />;
}

function ReactBlock({ label, sec }: { label: string; sec: number }) {
  const fmt = sec >= 3600
    ? `${Math.round(sec / 360) / 10} ч`
    : sec >= 60
      ? `${Math.round(sec / 6) / 10} мин`
      : `${Math.round(sec)} с`;
  return (
    <div className="panel-soft p-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-tpsubtle">{label}</div>
      <div className="text-[16px] font-bold tabular-nums text-tp">{fmt}</div>
    </div>
  );
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOUR_TICKS = [0, 6, 12, 18];

function Heatmap({ matrix }: { matrix?: number[][] }) {
  if (!matrix) return <div className="h-24 panel-soft animate-pulse" />;
  const flat = matrix.flat();
  const max = Math.max(1, ...flat);
  return (
    <div>
      <div className="flex gap-2 items-stretch">
        <div className="flex flex-col gap-1 text-[10px] text-tpsubtle pt-0.5">
          {DAYS.map(d => (
            <div key={d} className="h-4 leading-4 w-6">{d}</div>
          ))}
          <div className="h-3" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {matrix.map((row, di) => (
            <div key={di} className="grid gap-1" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
              {row.map((v, hi) => {
                const alpha = Math.min(1, v / max);
                return (
                  <span
                    key={hi}
                    className="h-4 rounded-sm"
                    style={{ background: v === 0 ? 'var(--tp-bg-panel-soft)' : `rgba(26, 79, 186, ${0.15 + alpha * 0.8})` }}
                    title={`${DAYS[di]} ${String(hi).padStart(2, '0')}:00 — ${v}`}
                  />
                );
              })}
            </div>
          ))}
          <div className="grid gap-1 text-[10px] text-tpsubtle" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
            {Array.from({ length: 24 }).map((_, hi) => (
              <div key={hi} className="text-center">
                {HOUR_TICKS.includes(hi) ? `${hi}:00` : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-tpsubtle">
        <span>меньше</span>
        <div className="flex gap-0.5">
          {[0.15, 0.35, 0.55, 0.75, 0.95].map(a => (
            <span
              key={a}
              className="w-4 h-3 rounded-sm"
              style={{ background: `rgba(26, 79, 186, ${a})` }}
            />
          ))}
        </div>
        <span>больше · max {max}</span>
      </div>
    </div>
  );
}
