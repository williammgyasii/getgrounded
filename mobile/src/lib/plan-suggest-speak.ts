import { type PlanLine } from '@/components/talk/plan-task-card';
import { minuteToClock } from '@/lib/clock';
import { type PlanSuggestBlock } from '@/lib/api';

export function truncateForDisplay(text: string, maxLen = 120): string {
  const line = text.trim().replace(/\s+/g, ' ');
  if (line.length <= maxLen) {
    return line;
  }

  return `${line.slice(0, maxLen - 1).trim()}…`;
}

export function suggestSpeakScript(intro: string, blocks: PlanSuggestBlock[]): string {
  const chunks: string[] = [];
  if (intro.trim()) {
    chunks.push(intro.trim());
  }

  const blockLine = suggestBlocksSummary(blocks);
  if (blockLine) {
    chunks.push(blockLine);
  }

  return chunks.join(' ') || 'Here is how I would shape your day.';
}

export function suggestBlocksSummary(blocks: PlanSuggestBlock[]): string {
  if (blocks.length === 0) {
    return '';
  }

  const parts = blocks.map((row) => {
    const time =
      row.plannedStartMinute != null ? ` around ${minuteToClock(row.plannedStartMinute)}` : '';
    const duration =
      row.plannedDurationMinutes != null ? ` for about ${row.plannedDurationMinutes} minutes` : '';
    return `${row.title}${time}${duration}`;
  });

  return `Based on what you said, here is how I would break down your day: ${parts.join('. ')}. How does this look?`;
}

export function linesFromSuggestBlocks(blocks: PlanSuggestBlock[], anchorMinute: number): PlanLine[] {
  let cursor = anchorMinute;

  return blocks.map((row, index) => {
    const duration = row.plannedDurationMinutes ?? 30;
    const startMin = row.plannedStartMinute ?? cursor;
    cursor = startMin + duration;
    const source: PlanLine['source'] = row.source === 'spoken' ? 'spoken' : 'inferred';

    return {
      key: `suggest-${index}-${row.title}`,
      title: row.title,
      minutes: String(duration),
      start: minuteToClock(startMin),
      area: 'PERSONAL',
      source,
      approved: true,
    };
  });
}

export function mergeSuggestIntoTranscript(transcript: string, museLine: string, blocks: PlanSuggestBlock[]) {
  const lines = [transcript.trim()];
  if (museLine.trim()) {
    lines.push('', 'Assistant proposal:', museLine.trim());
  }

  if (blocks.length > 0) {
    lines.push('', 'Suggested schedule:');
    blocks.forEach((row) => {
      const time = row.plannedStartMinute != null ? minuteToClock(row.plannedStartMinute) : 'flex';
      const duration = row.plannedDurationMinutes ?? 30;
      lines.push(`- ${row.title} at ${time}, ${duration} min (${row.source})`);
    });
  }

  return lines.filter(Boolean).join('\n');
}
