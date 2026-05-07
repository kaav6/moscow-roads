import type {
  AnalyticsDashboardDto,
  DistrictDto,
  FeedEventDto,
  IncidentDto,
  KpiDto,
  LoginResponse,
  UserDto,
} from '../types';

import analyticsTodayJson from './data/analytics-today.json';
import analyticsWeekJson from './data/analytics-week.json';
import analyticsMonthJson from './data/analytics-month.json';
import districtsJson from './data/districts.json';
import districtsRankingJson from './data/districts-ranking.json';
import feedJson from './data/feed.json';
import incidentsJson from './data/incidents.json';
import kpiJson from './data/kpi.json';
import loginJson from './data/login.json';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

interface IncidentListPayload {
  items: IncidentDto[];
  total: number;
  page: number;
  size: number;
}

const incidentsPayload = incidentsJson as unknown as IncidentListPayload;
const incidentIndex = new Map<string, IncidentDto>(
  incidentsPayload.items.map(i => [i.id, i]),
);

export const demo = {
  login(): LoginResponse {
    return loginJson as unknown as LoginResponse;
  },
  me(): { user: UserDto } {
    return { user: (loginJson as unknown as LoginResponse).user };
  },
  incidents(): IncidentListPayload {
    return incidentsPayload;
  },
  incident(id: string): IncidentDto {
    const found = incidentIndex.get(id);
    if (!found) throw new Error(`demo: incident ${id} not found`);
    return found;
  },
  districts(): DistrictDto[] {
    return districtsJson as unknown as DistrictDto[];
  },
  districtsRanking(): DistrictDto[] {
    return districtsRankingJson as unknown as DistrictDto[];
  },
  kpi(): KpiDto {
    return kpiJson as unknown as KpiDto;
  },
  feed(): FeedEventDto[] {
    return feedJson as unknown as FeedEventDto[];
  },
  analytics(range: 'today' | 'week' | 'month'): AnalyticsDashboardDto {
    const map = {
      today: analyticsTodayJson,
      week: analyticsWeekJson,
      month: analyticsMonthJson,
    } as const;
    return map[range] as unknown as AnalyticsDashboardDto;
  },
};
