export type TaonSpreadsheetColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json';

export interface TaonSpreadsheetColumn {
  key: string;
  label?: string;
  type: TaonSpreadsheetColumnType;
  width?: number;
}

export interface TaonSpreadsheetData {
  version: 1;
  columns: TaonSpreadsheetColumn[];
  rows: Record<string, unknown>[];
}
