import type { IncidentDto, IncidentType, Priority } from '../types';

const COLOR_BY_TYPE: Record<IncidentType, string> = {
  accident: '#DC2626',
  works: '#F59E0B',
  closure: '#7C3AED',
  camera: '#2563EB',
  weather: '#0E9A95',
};

/**
 * Доменная модель инцидента: оборачивает DTO и инкапсулирует правила
 * отображения метки на карте, чтобы виджеты не дублировали условную логику.
 */
export class Incident {
  constructor(private readonly dto: IncidentDto) {}

  get id(): string { return this.dto.id; }
  get type(): IncidentType { return this.dto.type; }
  get priority(): Priority { return this.dto.priority; }
  get coords(): [number, number] { return [this.dto.lat, this.dto.lng]; }

  isCritical(): boolean {
    return this.dto.priority === 'high';
  }

  iconColor(): string {
    return COLOR_BY_TYPE[this.dto.type] ?? '#1A4FBA';
  }

  iconPreset(): string {
    return this.isCritical() ? 'islands#circleDotIcon' : 'islands#circleIcon';
  }
}
