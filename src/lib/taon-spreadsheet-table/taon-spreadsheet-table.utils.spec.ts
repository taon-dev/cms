import { describe, expect, it } from 'vitest';
import {
  importSpreadsheetJson,
  normalizeSpreadsheetKey,
  parseSpreadsheetCsv,
  parseSpreadsheetDocument,
  serializeSpreadsheetCsv,
  validateSpreadsheetData,
} from './taon-spreadsheet-table.utils';

describe('taon-spreadsheet-table utilities', () => {
  it('normalizes labels to camelCase keys', () => {
    expect(normalizeSpreadsheetKey('Duration (min)')).toBe('durationMin');
    expect(normalizeSpreadsheetKey('Teacher Name')).toBe('teacherName');
  });

  it('imports JSON arrays and infers safe columns and types', () => {
    const data = importSpreadsheetJson(
      '[{"Dance Level":"Beginner","active":true,"minutes":60}]',
    );
    expect(data.columns.map(column => column.key)).toEqual([
      'danceLevel',
      'active',
      'minutes',
    ]);
    expect(data.columns.map(column => column.type)).toEqual([
      'string',
      'boolean',
      'number',
    ]);
    expect(data.rows).toEqual([
      { danceLevel: 'Beginner', active: true, minutes: 60 },
    ]);
  });

  it('preserves versioned schema and row data through JSON serialization', () => {
    const data = {
      version: 1 as const,
      columns: [{ key: 'startsAt', label: 'Starts at', type: 'date' as const }],
      rows: [{ startsAt: '2026-11-10' }],
    };
    expect(parseSpreadsheetDocument(JSON.stringify(data))).toEqual(data);
  });

  it('reads legacy row-only content and derives a compatible schema', () => {
    expect(parseSpreadsheetDocument('[{"Start Time":"18:00"}]')).toEqual({
      version: 1,
      columns: [{ key: 'startTime', label: 'Start Time', type: 'string' }],
      rows: [{ startTime: '18:00' }],
    });
  });

  it('parses semicolon CSV with quoted commas, quotes, and multiline values', () => {
    const data = parseSpreadsheetCsv(
      '\uFEFFTeacher;Notes;Active\r\n"Matt";"said ""hello""; then, goodbye";true\r\n"Anna";"line one\nline two";false',
    );
    expect(data.columns.map(column => column.key)).toEqual([
      'teacher',
      'notes',
      'active',
    ]);
    expect(data.rows).toEqual([
      { teacher: 'Matt', notes: 'said "hello"; then, goodbye', active: true },
      { teacher: 'Anna', notes: 'line one\nline two', active: false },
    ]);
  });

  it('round-trips CSV safely and prefixes spreadsheet formulas', () => {
    const data = {
      version: 1 as const,
      columns: [{ key: 'value', label: 'Value', type: 'string' as const }],
      rows: [{ value: '=SUM(A1:A2)' }],
    };
    expect(serializeSpreadsheetCsv(data)).toBe("Value\r\n'=SUM(A1:A2)");
  });

  it('rejects dangerous keys and values that do not match column types', () => {
    expect(() =>
      validateSpreadsheetData({
        version: 1,
        columns: [{ key: '__proto__', type: 'string' }],
        rows: [],
      }),
    ).toThrow(/invalid key/i);
    expect(() =>
      validateSpreadsheetData({
        version: 1,
        columns: [{ key: 'count', type: 'number' }],
        rows: [{ count: 'not a number' }],
      }),
    ).toThrow(/does not match type/i);
  });
});
