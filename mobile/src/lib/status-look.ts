export type StatusLook = {
  rail: string;
  wash: string;
  mark: 'check' | 'minus' | 'xmark' | 'arrow' | 'block' | null;
  chip: string;
  chipInk: string;
};

const cream = '#FAF7F1';
const ink = '#1C1915';

export function statusLook(status: string | null | undefined): StatusLook {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
      return { rail: '#2F4A3C', wash: '#DCE6DF', mark: 'check', chip: '#2F4A3C', chipInk: cream };
    case 'PARTIAL':
      return { rail: '#8B7355', wash: '#F0EBE3', mark: 'minus', chip: '#8B7355', chipInk: cream };
    case 'MISSED':
      return { rail: '#6B645C', wash: '#EDEAE4', mark: 'xmark', chip: '#6B645C', chipInk: cream };
    case 'RESCHEDULED':
      return { rail: '#5A7A6B', wash: '#E0EBE6', mark: 'arrow', chip: '#5A7A6B', chipInk: cream };
    case 'CANCELLED':
      return { rail: '#A04A4A', wash: '#F5EBEB', mark: 'xmark', chip: '#A04A4A', chipInk: cream };
    case 'BLOCKED':
      return { rail: '#7A756D', wash: '#EDEAE4', mark: 'block', chip: '#7A756D', chipInk: cream };
    default:
      return { rail: 'transparent', wash: cream, mark: null, chip: '#DCE6DF', chipInk: ink };
  }
}

export function statusIcon(mark: StatusLook['mark']) {
  switch (mark) {
    case 'check':
      return { ios: 'checkmark', android: 'check', web: 'check' } as const;
    case 'minus':
      return { ios: 'minus', android: 'remove', web: 'remove' } as const;
    case 'xmark':
      return { ios: 'xmark', android: 'close', web: 'close' } as const;
    case 'arrow':
      return { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' } as const;
    case 'block':
      return { ios: 'pause.fill', android: 'pause', web: 'pause' } as const;
    default:
      return null;
  }
}
