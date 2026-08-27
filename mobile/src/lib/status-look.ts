export type StatusLook = {
  rail: string;
  wash: string;
  mark: 'check' | 'minus' | 'xmark' | 'arrow' | 'block' | null;
  chip: string;
  chipInk: string;
};

export function statusLook(status: string | null | undefined): StatusLook {
  switch ((status ?? '').toUpperCase()) {
    case 'COMPLETED':
      return { rail: '#4C6FFF', wash: '#E4EBFA', mark: 'check', chip: '#4C6FFF', chipInk: '#FFFFFF' };
    case 'PARTIAL':
      return { rail: '#FDA758', wash: '#FFF3E8', mark: 'minus', chip: '#FDA758', chipInk: '#FFFFFF' };
    case 'MISSED':
      return { rail: '#8B7394', wash: '#F3F0F4', mark: 'xmark', chip: '#8B7394', chipInk: '#FFFFFF' };
    case 'RESCHEDULED':
      return { rail: '#7B8CFF', wash: '#EEF0FF', mark: 'arrow', chip: '#7B8CFF', chipInk: '#FFFFFF' };
    case 'CANCELLED':
      return { rail: '#C23B3B', wash: '#F8EEEE', mark: 'xmark', chip: '#C23B3B', chipInk: '#FFFFFF' };
    case 'BLOCKED':
      return { rail: '#6B7394', wash: '#EEF0F5', mark: 'block', chip: '#6B7394', chipInk: '#FFFFFF' };
    default:
      return { rail: 'transparent', wash: '#FFFFFF', mark: null, chip: '#DCE4F5', chipInk: '#243056' };
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
