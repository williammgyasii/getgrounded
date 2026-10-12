/** Plan tab — blue action palette (stone floor stays from global theme). */
export const PlanBlue = {
  deep: '#1A4578',
  primary: '#2563A8',
  mid: '#4A7FB8',
  light: '#7BA8D4',
  soft: '#D4E4F4',
  wash: '#EBF3FA',
  mist: '#F4F8FC',
  on: '#F8FBFF',
  approved: '#1B5EAA',
  approvedSoft: '#C9DDF5',
  approvedInk: '#134A88',
  border: '#B8D0EA',
} as const;

export type PlanMicPalette = {
  primary: string;
  primarySoft: string;
  primaryOn: string;
  record: string;
};

export const planMicPalette: PlanMicPalette = {
  primary: PlanBlue.primary,
  primarySoft: PlanBlue.soft,
  primaryOn: PlanBlue.on,
  record: PlanBlue.deep,
};
