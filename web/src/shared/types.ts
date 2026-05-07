export type Role = 'viewer' | 'operator' | 'dispatcher';

export type IncidentType = 'accident' | 'works' | 'closure' | 'camera' | 'weather';
export type Priority = 'high' | 'med' | 'low';
export type IncidentStatus = 'active' | 'in_progress' | 'resolved';
export type FeedTag =
  | 'event'
  | 'dispatch'
  | 'camera'
  | 'incident'
  | 'sensor'
  | 'status'
  | 'weather';
export type ResponderKind = 'dps' | 'ambulance' | 'tow' | 'inspector';
export type ResponderStatus = 'active' | 'en_route' | 'idle';
export type TimeOfDay = 'day' | 'peak' | 'night';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  shift: string | null;
  roles: Role[];
  createdAt: string;
}

export interface LoginResponse {
  user: UserDto;
  accessToken: string;
  expiresAt: string;
}

export interface DistrictDto {
  code: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  incidents: { active: number };
}

export interface ResponderRef {
  code: string;
  label: string;
  kind: ResponderKind;
  status: ResponderStatus;
  eta: string | null;
}

export interface CameraRef {
  code: string;
  label: string;
}

export interface IncidentEventDto {
  id: string;
  kind: string;
  at: string;
  comment: string | null;
  actor: { id: string; fullName: string } | null;
}

export interface IncidentDto {
  id: string;
  type: IncidentType;
  priority: Priority;
  title: string;
  address: string;
  district: { code: string; name: string };
  lat: number;
  lng: number;
  status: IncidentStatus;
  reportedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  source: string | null;
  injured: number | null;
  lanes: string | null;
  avgSpeedKmh: number | null;
  eta: string | null;
  age: { humanised: string; seconds: number };
  responders: ResponderRef[];
  cameras: CameraRef[];
  timeline?: IncidentEventDto[];
  impact?: { spark: number[]; forecastDelayMin: number };
}

export interface KpiDto {
  ts: string;
  score: number;
  activeIncidents: number;
  avgSpeedKmh: number;
  camerasOnline: number;
  timeOfDay: TimeOfDay;
  delta: { score: number; activeIncidents: number };
}

export interface FeedEventDto {
  id: number;
  ts: string;
  tag: FeedTag;
  incidentId: string | null;
  message: string;
  meta: string | null;
}

export interface CameraDto {
  code: string;
  label: string;
  district: { code: string; name: string } | null;
  lat: number;
  lng: number;
  online: boolean;
  hasRtsp: boolean;
}

export interface AnalyticsDashboardDto {
  range: 'today' | 'week' | 'month';
  jamHistory: {
    points: { t: string; v: number }[];
    compareToPreviousWeek: { points: { t: string; v: number }[] };
  };
  incidentsByHour: number[];
  byType: { type: string; value: number; color: string }[];
  byDistrict: { code: string; name: string; score: number }[];
  reactionTime: {
    detectionSec: number;
    arrivalSec: number;
    resolutionSec: number;
    trend: number[];
  };
  sources: { label: string; value: number; color: string }[];
  weeklyHeatmap: number[][];
}

export type RealtimeFrame =
  | { type: 'welcome'; sessionId: string; serverTime: string }
  | { type: 'kpi.tick'; snapshot: KpiDto }
  | { type: 'incident.new'; incident: IncidentDto }
  | { type: 'incident.update'; incident: IncidentDto }
  | { type: 'incident.close'; incidentId: string }
  | { type: 'feed.event'; event: FeedEventDto }
  | { type: 'jam.update'; districtCode: string; score: number }
  | { type: 'heartbeat'; serverTime: string }
  | { type: 'shutdown' };
