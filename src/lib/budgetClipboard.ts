import type { CopiedBudgetItem, ParseBudgetItemsResult } from '../types';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeCell = (value: string): string => value.replaceAll('\t', ' ').trim();

const toRow = (item: CopiedBudgetItem): string[] => [
  item.name,
  item.type,
  String(item.amount),
  item.categoryTag ?? '',
  item.date ?? '',
];

const isItemType = (value: string): value is '+' | '-' => value === '+' || value === '-';

export function serializeItemsToTsv(items: CopiedBudgetItem[]): string {
  return items
    .map((item) =>
      toRow(item)
        .map((cell) => normalizeCell(cell))
        .join('\t')
    )
    .join('\n');
}

export function serializeItemsToHtmlTable(items: CopiedBudgetItem[]): string {
  const rows = items
    .map((item) => {
      const [name, type, amount, categoryTag, date] = toRow(item);
      return `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(type)}</td><td>${escapeHtml(amount)}</td><td>${escapeHtml(categoryTag)}</td><td>${escapeHtml(date)}</td></tr>`;
    })
    .join('');

  return `<table><thead><tr><th>Name</th><th>Type</th><th>Amount</th><th>Category</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function parseItemsFromPlainText(text: string): ParseBudgetItemsResult {
  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    return { ok: false, error: 'empty-input' };
  }

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: 'empty-input' };
  }

  const parsedItems: CopiedBudgetItem[] = [];

  for (const line of lines) {
    const [
      rawName = '',
      rawType = '',
      rawAmount = '',
      rawCategoryTag = '',
      rawDate = '',
    ] = line.split('\t');

    const name = rawName.trim();
    const type = rawType.trim();
    const amount = Number(rawAmount.trim());

    if (!isItemType(type) || !Number.isFinite(amount)) {
      continue;
    }

    const categoryTag = rawCategoryTag.trim();
    const date = rawDate.trim();

    parsedItems.push({
      name,
      type,
      amount,
      categoryTag: categoryTag.length > 0 ? categoryTag : undefined,
      date: date.length > 0 ? date : undefined,
    });
  }

  if (parsedItems.length === 0) {
    return { ok: false, error: 'no-valid-items' };
  }

  return { ok: true, items: parsedItems };
}
