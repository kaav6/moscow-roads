import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDoubleLeftIcon } from '@heroicons/react/24/outline';
import { useIncidents } from '@/shared/api/incidents';
import { MoscowMap } from '@/widgets/MoscowMap';
import { LayersPanel } from '@/widgets/LayersPanel';
import { IncidentList } from '@/widgets/IncidentList';
import { DetailPanel } from '@/widgets/DetailPanel';
import { FeedPanel } from '@/widgets/FeedPanel';

const ALL_LAYERS: Record<string, boolean> = {
  accident: true,
  works: true,
  closure: true,
  camera: true,
  weather: true,
};

export default function OperatorPage() {
  const { data } = useIncidents();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('selected');
  const [layers, setLayers] = useState<Record<string, boolean>>(ALL_LAYERS);
  const [trafficVisible, setTrafficVisible] = useState(true);
  const [detailCollapsed, setDetailCollapsed] = useState(false);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter(it => layers[it.type] !== false);
  }, [data, layers]);

  useEffect(() => {
    if (selectedId) setDetailCollapsed(false);
  }, [selectedId]);

  const onSelect = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('selected', id);
    setParams(next, { replace: true });
  };
  const onClear = () => {
    const next = new URLSearchParams(params);
    next.delete('selected');
    setParams(next, { replace: true });
  };
  const toggleLayer = (key: string) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showDetail = !!selectedId && !detailCollapsed;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex gap-3 flex-1 min-h-0">
        <LayersPanel
          layers={layers}
          onToggle={toggleLayer}
          trafficVisible={trafficVisible}
          onToggleTraffic={() => setTrafficVisible(v => !v)}
        />
        <div className="flex-1 min-w-0 flex gap-3">
          <section className="flex-1 panel p-2 relative min-w-0">
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-center pointer-events-none">
              <div className="chip chip--brand pointer-events-auto">
                {filtered.length} активных инцидентов
              </div>
              <div className="chip pointer-events-auto" style={{ background: 'rgba(255,255,255,0.95)' }}>
                Яндекс traffic#actual
              </div>
            </div>
            {selectedId && detailCollapsed && (
              <button
                onClick={() => setDetailCollapsed(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 panel p-2 hover:bg-bgpanelhover"
                title="Показать панель"
                aria-label="Показать панель инцидента"
              >
                <ChevronDoubleLeftIcon className="w-4 h-4 text-tpmuted" />
              </button>
            )}
            <div style={{ width: '100%', height: '100%' }}>
              <MoscowMap
                incidents={filtered}
                selectedId={selectedId}
                onSelect={onSelect}
                showTraffic={trafficVisible}
              />
            </div>
          </section>
          <div className="w-[280px] shrink-0 panel p-3 overflow-y-auto">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-tp mb-3">
              Активные инциденты
            </h3>
            <IncidentList
              incidents={filtered}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </div>
          {showDetail && (
            <DetailPanel
              selectedId={selectedId}
              onClear={onClear}
              onCollapse={() => setDetailCollapsed(true)}
            />
          )}
        </div>
      </div>
      <FeedPanel />
    </div>
  );
}
