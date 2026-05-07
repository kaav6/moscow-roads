import type { IncidentDto } from '../shared/types';

const TYPE_LABEL: Record<string, string> = {
  accident: 'ДТП',
  works: 'Работы',
  closure: 'Перекрытие',
  camera: 'Камера',
  weather: 'Погода',
};
const TYPE_CLS: Record<string, string> = {
  accident: 'chip--danger',
  works: 'chip--warn',
  closure: 'chip--purple',
  camera: 'chip--camera',
  weather: 'chip--weather',
};
const PRIO_LABEL: Record<string, string> = { high: 'Высокий', med: 'Средний', low: 'Низкий' };

interface Props {
  incidents: IncidentDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IncidentList({ incidents, selectedId, onSelect }: Props) {
  if (!incidents.length) {
    return <p className="text-[12px] text-tpmuted px-3 py-6 text-center">Активных инцидентов нет</p>;
  }
  return (
    <ul className="space-y-1.5">
      {incidents.map(inc => {
        const selected = inc.id === selectedId;
        return (
          <li key={inc.id}>
            <button
              onClick={() => onSelect(inc.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                selected ? 'bg-brand-soft' : 'bg-bgpanelsoft hover:bg-bgpanelhover'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`chip ${TYPE_CLS[inc.type] ?? ''}`}>{TYPE_LABEL[inc.type] ?? inc.type}</span>
                <span className="font-mono text-[11px] text-tpmuted">{inc.id}</span>
                <span className="ml-auto text-[11px] text-tpsubtle">{inc.age.humanised}</span>
              </div>
              <div className="text-[13px] font-semibold text-tp leading-tight">{inc.title}</div>
              <div className="text-[11px] text-tpmuted truncate">{inc.address}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-wider text-tpsubtle">{PRIO_LABEL[inc.priority]}</span>
                <span className="font-mono text-[10px] text-tpsubtle">{inc.district.code}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
