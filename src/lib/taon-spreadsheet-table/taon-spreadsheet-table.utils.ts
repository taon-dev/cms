import type {
  TaonSpreadsheetColumn,
  TaonSpreadsheetColumnType,
  TaonSpreadsheetData,
} from './taon-spreadsheet-table.models';

const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor']);
const supportedTypes = new Set<TaonSpreadsheetColumnType>([
  'string',
  'number',
  'boolean',
  'date',
  'json',
]);
const maximumColumns = 200;
const maximumRows = 10_000;
export const TAON_SPREADSHEET_MAX_BYTES = 10_000_000;

export function normalizeSpreadsheetKey(header: string): string {
  const words = header
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[A-Za-z0-9]+/g);
  if (!words?.length) {
    return '';
  }
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

export function validateSpreadsheetData(value: unknown): TaonSpreadsheetData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Table data must be an object.');
  }
  const source = value as Partial<TaonSpreadsheetData>;
  if (
    source.version !== 1 ||
    !Array.isArray(source.columns) ||
    !Array.isArray(source.rows)
  ) {
    throw new Error('Table data must use the supported version 1 format.');
  }
  if (source.columns.length > maximumColumns) {
    throw new Error(`A table cannot have more than ${maximumColumns} columns.`);
  }
  if (source.rows.length > maximumRows) {
    throw new Error(`A table cannot have more than ${maximumRows} rows.`);
  }

  const keys = new Set<string>();
  const columns = source.columns.map((column, index) => {
    if (!column || typeof column !== 'object') {
      throw new Error(`Column ${index + 1} is invalid.`);
    }
    const candidate = column as TaonSpreadsheetColumn;
    if (
      typeof candidate.key !== 'string' ||
      !/^[a-z][A-Za-z0-9]*$/.test(candidate.key) ||
      dangerousKeys.has(candidate.key)
    ) {
      throw new Error(`Column ${index + 1} has an invalid key.`);
    }
    if (keys.has(candidate.key)) {
      throw new Error(`The column key "${candidate.key}" is duplicated.`);
    }
    if (!supportedTypes.has(candidate.type)) {
      throw new Error(`Column "${candidate.key}" has an unsupported type.`);
    }
    if (candidate.label !== undefined && typeof candidate.label !== 'string') {
      throw new Error(`Column "${candidate.key}" has an invalid label.`);
    }
    if (
      candidate.width !== undefined &&
      (!Number.isFinite(candidate.width) ||
        candidate.width < 40 ||
        candidate.width > 1000)
    ) {
      throw new Error(`Column "${candidate.key}" has an invalid width.`);
    }
    keys.add(candidate.key);
    return {
      key: candidate.key,
      ...(candidate.label !== undefined ? { label: candidate.label } : {}),
      type: candidate.type,
      ...(candidate.width !== undefined ? { width: candidate.width } : {}),
    };
  });

  const rows = source.rows.map((row, rowIndex) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Row ${rowIndex + 1} must be an object.`);
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      if (dangerousKeys.has(key)) {
        throw new Error(`Row ${rowIndex + 1} contains a dangerous key.`);
      }
      if (!keys.has(key)) {
        throw new Error(
          `Row ${rowIndex + 1} contains unknown column "${key}".`,
        );
      }
      const cell = (row as Record<string, unknown>)[key];
      const column = columns.find(candidate => candidate.key === key)!;
      if (cell !== null && cell !== undefined) {
        const validType =
          column.type === 'string'
            ? typeof cell === 'string'
            : column.type === 'number'
              ? typeof cell === 'number' && Number.isFinite(cell)
              : column.type === 'boolean'
                ? typeof cell === 'boolean'
                : column.type === 'date'
                  ? typeof cell === 'string' && isValidDateOnly(cell)
                  : true;
        if (!validType) {
          throw new Error(
            `Row ${rowIndex + 1}, column "${key}" does not match type "${column.type}".`,
          );
        }
      }
      if (column.type === 'json' && cell !== null && cell !== undefined) {
        assertSafeJson(cell, `Row ${rowIndex + 1}, column "${key}"`);
      }
      result[key] = cell;
    }
    return result;
  });

  return { version: 1, columns, rows };
}

export function parseSpreadsheetDocument(
  body: string | null,
): TaonSpreadsheetData {
  if (!body?.trim()) {
    return { version: 1, columns: [], rows: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error('The saved JSON Table content is not valid JSON.');
  }
  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    (parsed as { version?: unknown }).version === 1
  ) {
    return validateSpreadsheetData(parsed);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      'JSON Table content must be a versioned table or an array.',
    );
  }
  return inferSpreadsheetData(parsed);
}

export function importSpreadsheetJson(text: string): TaonSpreadsheetData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('The selected JSON file is not valid JSON.');
  }
  if (
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    (parsed as { version?: unknown }).version === 1
  ) {
    return validateSpreadsheetData(parsed);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('JSON import must contain an array of row objects.');
  }
  return inferSpreadsheetData(parsed);
}

export function inferSpreadsheetData(rows: unknown[]): TaonSpreadsheetData {
  if (rows.length > maximumRows) {
    throw new Error(`A table cannot have more than ${maximumRows} rows.`);
  }
  if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error('Every imported row must be an object.');
  }
  const headers = [...new Set(rows.flatMap(row => Object.keys(row as object)))];
  if (headers.length > maximumColumns) {
    throw new Error(`A table cannot have more than ${maximumColumns} columns.`);
  }
  const usedKeys = new Set<string>();
  const columns = headers.map(header => {
    let key = normalizeSpreadsheetKey(header);
    if (!key || !/^[A-Za-z]/.test(key)) {
      key = `column${key ? key.charAt(0).toUpperCase() + key.slice(1) : ''}`;
    }
    const base = key;
    let suffix = 2;
    while (usedKeys.has(key) || dangerousKeys.has(key)) {
      key = `${base}${suffix++}`;
    }
    usedKeys.add(key);
    const values = rows.map(row => (row as Record<string, unknown>)[header]);
    return {
      key,
      ...(header !== key ? { label: header } : {}),
      type: inferType(values),
    } satisfies TaonSpreadsheetColumn;
  });
  const keyByHeader = new Map(
    headers.map((header, index) => [header, columns[index].key]),
  );
  const normalizedRows = rows.map(row => {
    const result: Record<string, unknown> = {};
    for (const header of headers) {
      const key = keyByHeader.get(header)!;
      result[key] = (row as Record<string, unknown>)[header] ?? null;
    }
    return result;
  });
  return validateSpreadsheetData({
    version: 1,
    columns,
    rows: normalizedRows,
  });
}

export function parseSpreadsheetCsv(
  text: string,
  delimiter?: ',' | ';' | '\t',
): TaonSpreadsheetData {
  const source = text.replace(/^\uFEFF/, '');
  const separator = delimiter ?? detectDelimiter(source);
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === separator) {
      record.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      if (char === '\r' && source[index + 1] === '\n') {
        index += 1;
      }
    } else {
      field += char;
    }
  }
  if (quoted) {
    throw new Error('The CSV file contains an unterminated quoted value.');
  }
  if (field.length || record.length) {
    record.push(field);
    records.push(record);
  }
  const nonEmptyRecords = records.filter(row => row.some(cell => cell !== ''));
  if (!nonEmptyRecords.length) {
    return { version: 1, columns: [], rows: [] };
  }
  const headers = nonEmptyRecords[0].map(header => header.trim());
  if (!headers.length || headers.some(header => !header)) {
    throw new Error('CSV header cells must not be empty.');
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error('CSV headers must be unique before import.');
  }
  const rows = nonEmptyRecords.slice(1).map((cells, rowIndex) => {
    if (cells.length > headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} has more cells than the header.`,
      );
    }
    const result: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      result[header] = parseCsvValue(cells[index] ?? '');
    });
    return result;
  });
  const inferred = inferSpreadsheetData(
    rows.length
      ? rows
      : [Object.fromEntries(headers.map(header => [header, '']))],
  );
  return {
    version: 1,
    columns: inferred.columns,
    rows: rows.length ? inferred.rows : [],
  };
}

export function serializeSpreadsheetCsv(data: TaonSpreadsheetData): string {
  const escape = (value: unknown): string => {
    let text =
      value === null || value === undefined
        ? ''
        : typeof value === 'string'
          ? value
          : JSON.stringify(value);
    if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = data.columns.map(column => escape(column.label || column.key));
  const rows = data.rows.map(row =>
    data.columns.map(column => escape(row[column.key] ?? '')).join(','),
  );
  return [header.join(','), ...rows].join('\r\n');
}

function inferType(values: unknown[]): TaonSpreadsheetColumnType {
  const present = values.filter(
    value => value !== null && value !== undefined && value !== '',
  );
  if (
    present.length &&
    present.every(value => typeof value === 'string' && isValidDateOnly(value))
  ) {
    return 'date';
  }
  if (present.length && present.every(value => typeof value === 'boolean')) {
    return 'boolean';
  }
  if (
    present.length &&
    present.every(value => typeof value === 'number' && Number.isFinite(value))
  ) {
    return 'number';
  }
  if (present.length && present.every(value => typeof value === 'object')) {
    return 'json';
  }
  return 'string';
}

function detectDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? '';
  const candidates: (',' | ';' | '\t')[] = [',', ';', '\t'];
  return candidates.reduce((selected, candidate) =>
    countUnquoted(firstLine, candidate) > countUnquoted(firstLine, selected)
      ? candidate
      : selected,
  );
}

function countUnquoted(line: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"' && line[index + 1] === '"' && quoted) {
      index += 1;
    } else if (line[index] === '"') {
      quoted = !quoted;
    } else if (line[index] === delimiter && !quoted) {
      count += 1;
    }
  }
  return count;
}

function parseCsvValue(value: string): unknown {
  if (!value) {
    return null;
  }
  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === 'true';
  }
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return value;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function assertSafeJson(value: unknown, path: string): void {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} contains a non-finite number.`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeJson(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      if (dangerousKeys.has(key)) {
        throw new Error(`${path} contains a dangerous JSON key.`);
      }
      assertSafeJson(nestedValue, `${path}.${key}`);
    }
    return;
  }
  throw new Error(
    `${path} contains a value that cannot be serialized as JSON.`,
  );
}
