// Local copies of server enums for UI wiring. Keep in sync with API.
export const DISTANCE_BANDS = [
  'Y10_20','Y20_30','Y30_40','Y40_50','Y50_60','Y60_70','Y70_80','Y80_90','Y90_100','Y100_110','Y110_120','Y120_130','Y130_140','Y140_150','Y150_160','Y160_170','Y170_180','Y180_190','Y190_200','Y200_210','Y210_220','Y220_230','Y230_240','Y240_250','Y250_260','Y260_270','Y270_280','Y280_290','Y290_300','Y300_310','Y310_320','Y320_330','Y330_340','Y340_350','Y350_360','Y360_370','Y370_380','Y380_390','Y390_400',
] as const;

export const DISPERSION_BANDS = [
  'D0_10','D10_20','D20_30','D30_40','D40_50','D50_60','D60_70','D70_80','D80_90','D90_100',
] as const;

export const SHOT_RESULTS = ['Thin', 'Fat', 'Pure', 'Toe', 'Heel'] as const;

export type DistanceBandValue = (typeof DISTANCE_BANDS)[number];
export type DispersionBandValue = (typeof DISPERSION_BANDS)[number];
export type ShotResultValue = (typeof SHOT_RESULTS)[number];

export const CLUB_TYPES = [
  'DRIVER','MINI_DRIVER','WOOD3','WOOD5','WOOD7','WOOD9','WOOD11','WOOD13','WOOD15',
  'HYBRID2','HYBRID3','HYBRID4','HYBRID5','HYBRID6','HYBRID7',
  'IRON1','IRON2','IRON3','IRON4','IRON5','IRON6','IRON7','IRON8','IRON9',
  'PW','GW','SW','LW','PUTTER',
] as const;
export type ClubTypeValue = (typeof CLUB_TYPES)[number];

export const SHOT_FLIGHTS = [
  'STRAIGHT',
  'DRAW',
  'FADE',
  'HOOK',
  'SLICE',
  'PUSH',
  'PULL',
] as const;
export type ShotFlightValue = (typeof SHOT_FLIGHTS)[number];

export function shotFlightLabel(v: ShotFlightValue) {
  return v.charAt(0) + v.slice(1).toLowerCase();
}

export function distanceBandLabel(v: DistanceBandValue) {
  const m = v.match(/^Y(\d+)_?(\d+)?$/);
  if (!m) return v;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : undefined;
  return b ? `${a}-${b} yd` : `${a}+ yd`;
}

export function dispersionBandLabel(v: DispersionBandValue) {
  const m = v.match(/^D(\d+)_?(\d+)?$/);
  if (!m) return v;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : undefined;
  const core = b ? `${a}-${b} yd` : `${a}+ yd`;
  return `± ${core}`;
}

export function clubTypeLabel(v: ClubTypeValue) {
  if (v === 'DRIVER') return 'Driver';
  if (v === 'MINI_DRIVER') return 'Mini driver';
  if (v === 'PW' || v === 'GW' || v === 'SW' || v === 'LW') return v;
  if (v === 'PUTTER') return 'Putter';
  const iron = v.match(/^IRON(\d)$/);
  if (iron) return `${iron[1]} iron`;
  const wood = v.match(/^WOOD(\d{1,2})$/);
  if (wood) return `${wood[1]} wood`;
  const hyb = v.match(/^HYBRID(\d)$/);
  if (hyb) return `${hyb[1]} hybrid`;
  return v.replaceAll('_', ' ').toLowerCase();
}

// New enums from server for trajectory and swing path
export const TRAJECTORIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TrajectoryValue = (typeof TRAJECTORIES)[number];

export const SWING_PATHS = ['Neutral', 'Out-to-in', 'In-to-out'] as const;
export type SwingPathValue = (typeof SWING_PATHS)[number];

export const DISPERSION_DIRECTIONS = ['Left', 'Center', 'Right'] as const;
export type DispersionDirectionValue = (typeof DISPERSION_DIRECTIONS)[number];
