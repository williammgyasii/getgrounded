export function planDayVibe(now = new Date()): { headline: string; sub: string } {
  const hour = now.getHours();

  if (hour >= 0 && hour < 5) {
    return {
      headline: 'One day at a time',
      sub: 'It’s late. Tomorrow is a fresh page. For now, just this day.',
    };
  }
  if (hour < 12) {
    return {
      headline: 'One day at a time',
      sub: 'Morning light. One list. No need to carry the whole week.',
    };
  }
  if (hour < 17) {
    return {
      headline: 'One day at a time',
      sub: 'Afternoon check-in. Adjust the plan, not your worth.',
    };
  }
  if (hour < 21) {
    return {
      headline: 'One day at a time',
      sub: 'Evening wind-down. Finish what matters; let the rest wait.',
    };
  }
  return {
    headline: 'One day at a time',
    sub: 'Night mode. Close the loop when you’re ready, then rest.',
  };
}

export function formatDayClock(now = new Date()): string {
  const hours = now.getHours();
  const mins = now.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
}
