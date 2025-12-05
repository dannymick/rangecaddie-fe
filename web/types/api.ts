// Lightweight API-facing types for the web app

export type Club = { id: string; name: string; type: string; createdAt: string };
export type ClubType = { id: string; label: string; code: string };

export type RangeSession = {
  id: string;
  createdAt: string;
  mode?: 'SHORT' | 'LONG' | 'FREE' | 'PUTTING' | null;
  _count?: { shots: number };
};
export type SessionListItem = RangeSession;
export type SessionListResponse = SessionListItem[];

export type PreShotInput = {
  club?: string;
  clubId?: string;
  clubCode?: string;
  target?: string; // e.g., intended distance label
  targetDistance?: number;
  lie?: 'TEE'|'FAIRWAY'|'FIRST_CUT'|'ROUGH'|'BUNKER'|'HARDPAN'|'UPHILL'|'DOWNHILL'|'SIDEHILL';
  intendedFlight?: 'STRAIGHT'|'DRAW'|'FADE'|'HOOK'|'SLICE'|'PUSH'|'PULL';
  intendedTrajectory?: 'LOW'|'MEDIUM'|'HIGH';
  intendedDispersion?: 'D0_10'|'D10_20'|'D20_30'|'D30_40'|'D40_50'|'D50_60'|'D60_70'|'D70_80'|'D80_90'|'D90_100';
  aimOffset?: number;
};

export type PostShotInput = {
  actualFlight?: 'STRAIGHT'|'DRAW'|'FADE'|'HOOK'|'SLICE'|'PULL'|'PUSH';
  trajectory?: 'LOW'|'MEDIUM'|'HIGH';
  actualTrajectory?: 'LOW'|'MEDIUM'|'HIGH';
  distanceBand?: 'Y10_20'|'Y20_30'|'Y30_40'|'Y40_50'|'Y50_60'|'Y60_70'|'Y70_80'|'Y80_90'|'Y90_100'|'Y100_110'|'Y110_120'|'Y120_130'|'Y130_140'|'Y140_150'|'Y150_160'|'Y160_170'|'Y170_180'|'Y180_190'|'Y190_200'|'Y200_210'|'Y210_220'|'Y220_230'|'Y230_240'|'Y240_250'|'Y250_260'|'Y260_270'|'Y270_280'|'Y280_290'|'Y290_300'|'Y300_310'|'Y310_320'|'Y320_330'|'Y330_340'|'Y340_350'|'Y350_360'|'Y360_370'|'Y370_380'|'Y380_390'|'Y390_400';
  dispersionBand?: 'D0_10'|'D10_20'|'D20_30'|'D30_40'|'D40_50'|'D50_60'|'D60_70'|'D70_80'|'D80_90'|'D90_100';
  dispersionDirection?: 'LEFT'|'CENTER'|'RIGHT';
  distance?: number;
  total?: number;
  lateral?: number;
  swingPath?: 'IN-TO-OUT'|'OUT-TO-IN'|'NEUTRAL';
  contact?: 'PURE'|'THIN'|'FAT'|'TOE'|'HEEL';
  resultEnum?: string; // server enums
  result?: string; // optional free text
  note?: string; // optional free text
};

export type Shot = {
  id: string;
  sessionId: string;
  preShot?: Record<string, unknown>;
  postShot?: Record<string, unknown>;
  createdAt: string;
};

export type SessionSummary = {
  pairs: Array<{ intended: string | null; actual: string | null; count: number }>;
  aggregates: { _avg: { distance: number | null; dispersion: number | null } };
  byClub: Array<{ club: string | null; count: number }>;
  scatter: Array<{ distance: number | null; lateral: number | null }>;
  trajectoryPairs?: Array<{ intended: string | null; actual: string | null; count: number }>;
  contact?: Array<{ type: string; count: number }>;
  shots?: Array<{
    shotId: string;
    createdAt: string;
    club?: string | null;
    intendedFlight?: string | null;
    actualFlight?: string | null;
    distance?: number | null;
    lateral?: number | null;
    trajectory?: string | null;
    contact?: string | null;
  }>;
};

export type OverviewMetrics = {
  sessions: Array<{
    id: string;
    date: string;
    matchRate: number;
    avgDispersion: number;
    mode?: string | null;
    shots: number;
  }>;
  gapping: Array<{ club: string | null; avgCarry: number | null; stdev: number | null }>;
  practiceCalendar: Array<{ date: string; shots: number }>;
  missTrend: Array<{
    date: string;
    left: number;
    right: number;
    short: number;
    long: number;
    other: number;
  }>;
  shots?: Array<{
    date: string;
    sessionId: string;
    club?: string | null;
    intendedFlight?: string | null;
    actualFlight?: string | null;
    distance?: number | null;
    lateral?: number | null;
  }>;
};

export type UserProfile = {
  userId: string;
  email: string;
  role: string;
};
