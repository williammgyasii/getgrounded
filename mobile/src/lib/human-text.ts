/** Plain English for AI or UI copy: no em dashes, en dashes, or awkward hyphenation. */
export function humanAiText(text: string | null | undefined): string {
  let line = text?.trim() ?? '';
  if (!line) {
    return '';
  }

  line = line.replace(/\u2014/g, ', ').replace(/\u2013/g, ', ').replace(/—/g, ', ').replace(/–/g, ', ');
  line = line.replace(/\s-\s/g, ', ');
  while (/\b(\w+)-(\w+)\b/.test(line)) {
    line = line.replace(/\b(\w+)-(\w+)\b/g, '$1 $2');
  }
  line = line.replace(/\s+,/g, ',').replace(/,\s*/g, ', ');
  line = line.replace(/\s+\./g, '.');
  line = line.replace(/[ ]{2,}/g, ' ');
  line = line.replace(/\.{2,}/g, '.');
  return line.trim();
}
