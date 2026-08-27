const Skip = new Set(['a', 'an', 'the', 'my', 'to', 'for', 'and', 'of', 'on', 'in', 'at', 'i']);

export function mentioned(title: string, spoken: string): boolean {
  const hay = spoken.toLowerCase();
  const whole = title.trim().toLowerCase();
  if (!whole || !hay) {
    return false;
  }
  if (hay.includes(whole)) {
    return true;
  }

  const needles = whole.split(/\s+/).filter((word) => word.length > 2 && !Skip.has(word));
  if (needles.length === 0) {
    return hay.includes(whole);
  }

  const hits = needles.filter((word) => hay.includes(word)).length;
  return hits >= Math.max(1, Math.ceil(needles.length * 0.6));
}

export function heardIds(titles: { id: string; title: string }[], spoken: string): string[] {
  return titles.filter((item) => mentioned(item.title, spoken)).map((item) => item.id);
}
