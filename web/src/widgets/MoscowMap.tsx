import { useEffect, useRef, useState } from 'react';
import type { IncidentDto } from '../shared/types';

declare global {
  interface Window {
    ymaps: any;
  }
}

const YMAPS_KEY = (import.meta as any).env?.VITE_YANDEX_MAPS_KEY || 'decbf268-5dfb-4665-8b2e-715ab3fb7836';
const SCRIPT_ID = 'yandex-maps-2.1';

let loaderPromise: Promise<any> | null = null;
function loadYmaps(): Promise<any> {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(YMAPS_KEY)}&lang=ru_RU`;
    s.async = true;
    s.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    s.onerror = () => reject(new Error('Yandex Maps script failed to load'));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

const COLOR_BY_TYPE: Record<string, string> = {
  accident: '#DC2626',
  works: '#F59E0B',
  closure: '#7C3AED',
  camera: '#2563EB',
  weather: '#0E9A95',
};

interface Props {
  incidents: IncidentDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showTraffic: boolean;
}

export function MoscowMap({ incidents, selectedId, onSelect, showTraffic }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const trafficRef = useRef<any>(null);
  const placemarksRef = useRef<Map<string, any>>(new Map());
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    loadYmaps()
      .then(ymaps => {
        if (cancelled || !ref.current) return;
        const map = new ymaps.Map(ref.current, {
          center: [55.751244, 37.618423],
          zoom: 11,
          controls: ['zoomControl'],
        });
        mapRef.current = map;
        const trafficProvider = new ymaps.traffic.provider.Actual({}, { autoUpdate: true });
        trafficProvider.setMap(map);
        trafficRef.current = trafficProvider;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.destroy(); } catch { /* ignore */ }
        mapRef.current = null;
      }
      placemarksRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.ymaps) return;
    const seen = new Set<string>();
    for (const inc of incidents) {
      seen.add(inc.id);
      const existing = placemarksRef.current.get(inc.id);
      const color = COLOR_BY_TYPE[inc.type] ?? '#1A4FBA';
      if (existing) {
        existing.geometry.setCoordinates([inc.lat, inc.lng]);
        continue;
      }
      const pm = new window.ymaps.Placemark(
        [inc.lat, inc.lng],
        {
          balloonContentHeader: inc.title,
          balloonContentBody: inc.address,
          hintContent: inc.title,
        },
        {
          preset: 'islands#circleIcon',
          iconColor: color,
        },
      );
      pm.events.add('click', () => onSelectRef.current?.(inc.id));
      map.geoObjects.add(pm);
      placemarksRef.current.set(inc.id, pm);
    }
    for (const [id, pm] of placemarksRef.current.entries()) {
      if (!seen.has(id)) {
        map.geoObjects.remove(pm);
        placemarksRef.current.delete(id);
      }
    }
  }, [incidents]);

  useEffect(() => {
    const map = mapRef.current;
    const pm = selectedId ? placemarksRef.current.get(selectedId) : null;
    if (map && pm) {
      const coords = pm.geometry.getCoordinates();
      map.setCenter(coords, Math.max(map.getZoom(), 13), { duration: 600 });
      pm.balloon.open();
    }
  }, [selectedId, incidents]);

  useEffect(() => {
    if (!trafficRef.current || !mapRef.current) return;
    if (showTraffic) trafficRef.current.setMap(mapRef.current);
    else trafficRef.current.setMap(null);
  }, [showTraffic]);

  if (failed) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-center p-6"
        style={{ background: 'var(--tp-bg-map)', borderRadius: 10, color: 'var(--tp-text-muted)', fontSize: 13 }}
      >
        Не удалось загрузить Яндекс.Карты. Маркеры доступны в списке справа.
      </div>
    );
  }

  return <div ref={ref} style={{ width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden' }} />;
}
