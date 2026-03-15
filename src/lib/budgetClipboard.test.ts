import { describe, expect, it } from 'vitest';

import {
  parseItemsFromPlainText,
  serializeItemsToHtmlTable,
  serializeItemsToTsv,
} from './budgetClipboard';

describe('budgetClipboard', () => {
  describe('serializeItemsToTsv', () => {
    it('serializes rows preserving numeric amounts as stored', () => {
      const result = serializeItemsToTsv([
        {
          name: 'Salary',
          type: '+',
          amount: 1250.5,
          categoryTag: 'Income',
          date: '2026-03-15',
        },
        {
          name: 'Rent',
          type: '-',
          amount: 700,
        },
      ]);

      expect(result).toBe('Salary\t+\t1250.5\tIncome\t2026-03-15\nRent\t-\t700\t\t');
    });
  });

  describe('serializeItemsToHtmlTable', () => {
    it('escapes unsafe html content', () => {
      const result = serializeItemsToHtmlTable([
        {
          name: '<script>alert(1)</script>',
          type: '-',
          amount: 10,
          categoryTag: 'Food & Drinks',
        },
      ]);

      expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(result).toContain('Food &amp; Drinks');
      expect(result).not.toContain('<script>alert(1)</script>');
    });
  });

  describe('parseItemsFromPlainText', () => {
    it('parses valid tsv rows and skips invalid ones', () => {
      const parsed = parseItemsFromPlainText(
        'Salary\t+\t1000\tIncome\t2026-03-15\ninvalid\t*\tABC\t\t\nRent\t-\t700\t\t'
      );

      expect(parsed).toEqual({
        ok: true,
        items: [
          {
            name: 'Salary',
            type: '+',
            amount: 1000,
            categoryTag: 'Income',
            date: '2026-03-15',
          },
          {
            name: 'Rent',
            type: '-',
            amount: 700,
            categoryTag: undefined,
            date: undefined,
          },
        ],
      });
    });

    it('returns no-valid-items when text has no parseable budget rows', () => {
      const parsed = parseItemsFromPlainText('Name\tType\tAmount\nRow\t?\tN/A');

      expect(parsed).toEqual({ ok: false, error: 'no-valid-items' });
    });
  });
});
