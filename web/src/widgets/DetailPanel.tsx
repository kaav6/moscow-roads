import { useState } from 'react';
import { toast } from 'sonner';
import { useIncident, useEscalate, useAcknowledge, useResolve } from '@/shared/api/incidents';
import { useAuth } from '@/shared/auth';
import {
  CameraIcon,
  ClockIcon,
  ShareIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDoubleRightIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

interface Props {
  selectedId: string | null;
  onClear: () => void;
  onCollapse: () => void;
}

const PRIO_CHIP: Record<string, string> = { high: 'chip--danger', med: 'chip--warn', low: '' };

export function DetailPanel({ selectedId, onClear, onCollapse }: Props) {
  const { user } = useAuth();
  const { data: inc, isLoading } = useIncident(selectedId);
  const escalate = useEscalate();
  const ack = useAcknowledge();
  const resolve = useResolve();
  const [comment, setComment] = useState('');

  const canEscalate = user?.roles?.includes('dispatcher');
  const canOperate = user?.roles?.includes('operator') || user?.roles?.includes('dispatcher');

  if (!selectedId) return null;
  if (isLoading || !inc) {
    return (
      <aside className="w-[360px] shrink-0 panel p-6">
        <p className="text-[12px] text-tpmuted">Загрузка инцидента…</p>
      </aside>
    );
  }

  const doEscalate = () => {
    escalate.mutate(
      { id: inc.id, comment: comment || undefined },
      {
        onSuccess: () => { toast.success(`Инцидент ${inc.id} эскалирован`); setComment(''); },
        onError: (err: any) => toast.error(err?.response?.status === 403 ? 'Требуется роль dispatcher' : 'Ошибка эскалации'),
      },
    );
  };
  const doAck = () => {
    ack.mutate(
      { id: inc.id, comment: comment || undefined },
      { onSuccess: () => { toast.success('Инцидент подтверждён'); setComment(''); } },
    );
  };
  const doResolve = () => {
    resolve.mutate(
      { id: inc.id, comment: comment || undefined },
      { onSuccess: () => { toast.success('Инцидент закрыт'); onClear(); } },
    );
  };
  const doShare = () => {
    const url = `${location.origin}/?selected=${inc.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Ссылка скопирована'));
  };

  return (
    <aside className="w-[360px] shrink-0 panel p-4 overflow-y-auto">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`chip ${PRIO_CHIP[inc.priority] ?? ''}`}>
              {inc.priority === 'high' ? 'Высокий' : inc.priority === 'med' ? 'Средний' : 'Низкий'}
            </span>
            <span className="font-mono text-[11px] text-tpmuted">{inc.id}</span>
          </div>
          <h2 className="text-[16px] font-extrabold leading-tight text-tp">{inc.title}</h2>
          <p className="text-[12px] text-tpmuted flex items-center gap-1 mt-1">
            <MapPinIcon className="w-3 h-3 inline" /> {inc.address}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onCollapse}
            className="btn-ghost p-1"
            aria-label="Свернуть панель"
            title="Свернуть панель"
          >
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="btn-ghost p-1"
            aria-label="Закрыть"
            title="Снять выбор"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="rounded-md mb-3 h-32 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0F1419 0%, #1E2A3A 100%)' }}
      >
        <CameraIcon className="w-10 h-10 text-white opacity-30" />
        <span className="absolute text-white text-[10px] font-mono opacity-50">CCTV · LIVE</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Возраст" value={inc.age.humanised} />
        <Stat label="Полосы" value={inc.lanes ?? '—'} />
        <Stat label="Ср. км/ч" value={inc.avgSpeedKmh != null ? String(inc.avgSpeedKmh) : '—'} />
        <Stat label="Источник" value={inc.source ?? '—'} />
        <Stat label="Пострадавшие" value={inc.injured != null ? String(inc.injured) : '—'} />
        <Stat label="ETA" value={inc.eta ?? '—'} />
      </div>

      {inc.responders.length > 0 && (
        <div className="mb-3">
          <h4 className="text-[10px] uppercase tracking-widest text-tpsubtle mb-1.5">Реагенты</h4>
          <ul className="space-y-1">
            {inc.responders.map(r => (
              <li key={r.code} className="flex items-center gap-2 text-[12px] panel-soft p-2">
                <span className="font-mono font-bold text-tp">{r.code}</span>
                <span className="flex-1 truncate text-tpmuted">{r.label}</span>
                <span className="text-[11px] uppercase font-semibold text-tp">{r.status}</span>
                {r.eta && <span className="font-mono text-tpsubtle text-[11px]">{r.eta}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {inc.timeline && inc.timeline.length > 0 && (
        <div className="mb-3">
          <h4 className="text-[10px] uppercase tracking-widest text-tpsubtle mb-1.5 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> Хронология
          </h4>
          <ul className="space-y-1.5">
            {inc.timeline.slice(0, 6).map(ev => (
              <li key={ev.id} className="text-[12px] flex gap-2">
                <span className="font-mono text-[10px] text-tpsubtle shrink-0 w-12">
                  {new Date(ev.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-tp">
                  <strong className="text-tpmuted uppercase text-[10px] mr-1">{ev.kind}</strong>
                  {ev.comment ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Комментарий к действию…"
        className="input mb-2"
        rows={2}
        maxLength={500}
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={doEscalate}
          className="btn-primary text-[12px] py-1.5 px-3"
          disabled={!canEscalate || escalate.isPending}
          title={canEscalate ? '' : 'Требуется роль dispatcher'}
        >
          Эскалировать
        </button>
        <button
          onClick={doAck}
          className="btn-ghost border text-[12px] py-1.5 px-3"
          style={{ borderColor: 'var(--tp-border)' }}
          disabled={!canOperate || ack.isPending}
        >
          Подтвердить
        </button>
        <button
          onClick={doResolve}
          className="btn-ghost border text-[12px] py-1.5 px-3"
          style={{ borderColor: 'var(--tp-border)' }}
          disabled={!canOperate || resolve.isPending}
        >
          Закрыть
        </button>
        <button onClick={doShare} className="btn-ghost border text-[12px] py-1.5 px-3" style={{ borderColor: 'var(--tp-border)' }}>
          <ShareIcon className="w-3 h-3 inline mr-1" /> Share
        </button>
        <button
          onClick={() => toast.info('Маршрут: рассчитывается')}
          className="btn-ghost border text-[12px] py-1.5 px-3"
          style={{ borderColor: 'var(--tp-border)' }}
        >
          <ArrowsRightLeftIcon className="w-3 h-3 inline mr-1" /> Маршрут
        </button>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-soft p-2">
      <div className="text-[9px] uppercase tracking-widest text-tpsubtle">{label}</div>
      <div className="text-[13px] font-bold text-tp truncate">{value}</div>
    </div>
  );
}
