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
      return '#FDA758';
    case 'WORK':
      return '#4C6FFF';
    case 'LEARNING':
      return '#7B8CFF';
    case 'HOME':
      return '#FEA800';
    case 'RELATIONSHIPS':
      return '#FF6767';
    case 'SPIRITUAL':
      return '#1B237E';
    case 'FINANCIAL':
      return '#8B6E82';
    default:
      return '#FDA758';
  }
}
