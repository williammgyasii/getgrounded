export const LifeAreas = [
  'HEALTH',
  'WORK',
  'LEARNING',
  'HOME',
  'RELATIONSHIPS',
  'PERSONAL',
  'SPIRITUAL',
  'FINANCIAL',
] as const;

export type LifeArea = (typeof LifeAreas)[number];

export function areaLabel(area: string | null | undefined): string {
  const raw = (area ?? 'personal').trim().toLowerCase();
  return raw.length === 0 ? 'Personal' : raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function areaTint(area: string | null | undefined): string {
  switch ((area ?? 'PERSONAL').toUpperCase()) {
    case 'HEALTH':
      return '#6B9B7A';
    case 'WORK':
      return '#2F4A3C';
    case 'LEARNING':
      return '#5A7A9B';
    case 'HOME':
      return '#B8906A';
    case 'RELATIONSHIPS':
      return '#C17B7B';
    case 'SPIRITUAL':
      return '#4A5568';
    case 'FINANCIAL':
      return '#8B7B6B';
    default:
      return '#2F4A3C';
  }
}
