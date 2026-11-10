import {
  CdkDrag,
  CdkDragHandle,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import type {
  TaonSpreadsheetColumn,
  TaonSpreadsheetColumnType,
  TaonSpreadsheetData,
} from './taon-spreadsheet-table.models';
import {
  importSpreadsheetJson,
  normalizeSpreadsheetKey,
  parseSpreadsheetCsv,
  serializeSpreadsheetCsv,
  TAON_SPREADSHEET_MAX_BYTES,
  validateSpreadsheetData,
} from './taon-spreadsheet-table.utils';

@Component({
  selector: 'taon-spreadsheet-table',
  standalone: true,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './taon-spreadsheet-table.component.html',
  styleUrl: './taon-spreadsheet-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonSpreadsheetTableComponent {
  readonly data = model<TaonSpreadsheetData>({
    version: 1,
    columns: [],
    rows: [],
  });
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly validationError = model('');
  readonly view = signal<'table' | 'json' | 'settings'>('table');
  readonly activeCell = signal<{ row: number; column: number } | null>(null);
  readonly pendingImport = signal<TaonSpreadsheetData | null>(null);
  readonly importFormat = signal('');
  readonly importMode = signal<'replace' | 'append'>('replace');
  readonly columnTypes: TaonSpreadsheetColumnType[] = [
    'string',
    'number',
    'boolean',
    'date',
    'json',
  ];
  readonly jsonPreview = computed(() =>
    JSON.stringify(this.data().rows, null, 2),
  );
  private readonly undoStack: TaonSpreadsheetData[] = [];
  private readonly redoStack: TaonSpreadsheetData[] = [];

  addColumn(): void {
    if (!this.canEdit()) {
      return;
    }
    const data = this.data();
    let number = data.columns.length + 1;
    let key = `column${number}`;
    while (data.columns.some(column => column.key === key)) {
      number += 1;
      key = `column${number}`;
    }
    this.commit({
      ...data,
      columns: [
        ...data.columns,
        { key, label: `Column ${number}`, type: 'string' },
      ],
      rows: data.rows.map(row => ({ ...row, [key]: null })),
    });
  }

  addRow(): void {
    if (!this.canEdit()) {
      return;
    }
    const row: Record<string, unknown> = {};
    for (const column of this.data().columns) {
      row[column.key] = null;
    }
    this.commit({ ...this.data(), rows: [...this.data().rows, row] });
  }

  deleteRow(rowIndex: number): void {
    if (
      !this.canEdit() ||
      !globalThis.confirm('Delete this row? This cannot be undone.')
    ) {
      return;
    }
    this.commit({
      ...this.data(),
      rows: this.data().rows.filter((_, index) => index !== rowIndex),
    });
  }

  duplicateRow(rowIndex: number): void {
    if (!this.canEdit()) {
      return;
    }
    const rows = [...this.data().rows];
    rows.splice(rowIndex + 1, 0, { ...rows[rowIndex] });
    this.commit({ ...this.data(), rows });
  }

  deleteColumn(columnIndex: number): void {
    if (
      !this.canEdit() ||
      !globalThis.confirm(
        'Delete this column and its cell values? This cannot be undone.',
      )
    ) {
      return;
    }
    const column = this.data().columns[columnIndex];
    const rows = this.data().rows.map(row => {
      const { [column.key]: _removed, ...remaining } = row;
      return remaining;
    });
    this.commit({
      ...this.data(),
      columns: this.data().columns.filter((_, index) => index !== columnIndex),
      rows,
    });
  }

  renameColumn(
    columnIndex: number,
    field: 'key' | 'label',
    value: string,
  ): void {
    if (!this.canEdit()) {
      return;
    }
    const columns = this.data().columns.map(column => ({ ...column }));
    const previousKey = columns[columnIndex].key;
    const nextValue = field === 'key' ? value.trim() : value;
    const nextKey = field === 'key' ? nextValue : previousKey;
    if (
      field === 'key' &&
      (!/^[a-z][A-Za-z0-9]*$/.test(nextKey) ||
        ['__proto__', 'prototype', 'constructor'].includes(nextKey) ||
        columns.some(
          (column, index) => index !== columnIndex && column.key === nextKey,
        ))
    ) {
      this.validationError.set(
        'Column keys must be unique, safe camelCase identifiers.',
      );
      return;
    }
    columns[columnIndex] = { ...columns[columnIndex], [field]: nextValue };
    const rows =
      field === 'key' && previousKey !== nextKey
        ? this.data().rows.map(row => {
            const { [previousKey]: value, ...remaining } = row;
            return { ...remaining, [nextKey]: value };
          })
        : this.data().rows;
    this.commit({ ...this.data(), columns, rows });
  }

  setColumnType(columnIndex: number, type: TaonSpreadsheetColumnType): void {
    if (!this.canEdit()) {
      return;
    }
    const columns = this.data().columns.map(column => ({ ...column }));
    columns[columnIndex] = { ...columns[columnIndex], type };
    this.commit({ ...this.data(), columns });
  }

  setCell(rowIndex: number, column: TaonSpreadsheetColumn, event: Event): void {
    if (!this.canEdit()) {
      return;
    }
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    let value: unknown = target.value;
    if (column.type === 'number') {
      value = target.value === '' ? null : Number(target.value);
      if (value !== null && !Number.isFinite(value)) {
        this.validationError.set(
          `Row ${rowIndex + 1}, ${column.label || column.key}: enter a valid number.`,
        );
        return;
      }
    } else if (column.type === 'boolean') {
      value = (target as HTMLInputElement).checked;
    } else if (column.type === 'date') {
      value = target.value
        ? new Date(`${target.value}T00:00:00.000Z`).toISOString().slice(0, 10)
        : null;
    } else if (column.type === 'json') {
      if (!target.value.trim()) {
        value = null;
      } else {
        try {
          value = JSON.parse(target.value);
        } catch {
          this.validationError.set(
            `Row ${rowIndex + 1}, ${column.label || column.key}: enter valid JSON.`,
          );
          return;
        }
      }
    }
    const rows = this.data().rows.map((row, index) =>
      index === rowIndex ? { ...row, [column.key]: value } : row,
    );
    this.commit({ ...this.data(), rows });
  }

  onCellKeydown(event: KeyboardEvent, row: number, column: number): void {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName === 'TEXTAREA') {
        return;
      }
      if (
        target instanceof HTMLInputElement &&
        target.type !== 'checkbox' &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        const atBoundary =
          event.key === 'ArrowLeft'
            ? target.selectionStart === 0
            : target.selectionStart === target.value.length;
        if (!atBoundary) {
          return;
        }
      }
      event.preventDefault();
      const next = {
        row:
          row +
          (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0),
        column:
          column +
          (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0),
      };
      this.focusCell(next.row, next.column);
      return;
    }
    if (
      (event.target as HTMLElement).tagName === 'TEXTAREA' &&
      event.key === 'Enter' &&
      !(event.ctrlKey || event.metaKey)
    ) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      const value = this.cellValue(row, this.data().columns[column]);
      void (
        navigator.clipboard?.writeText(value) ??
        Promise.reject(new Error('Clipboard access is unavailable.'))
      ).catch(() => {
        this.validationError.set('Could not access the clipboard.');
      });
      return;
    }
    if (event.key === 'Escape') {
      (event.target as HTMLElement).blur();
      return;
    }
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      const direction = event.shiftKey ? -1 : 1;
      let next = { row, column };
      if (event.key === 'Tab') {
        let nextColumn = column + direction;
        let nextRow = row;
        if (nextColumn >= this.data().columns.length) {
          nextColumn = 0;
          nextRow += 1;
        } else if (nextColumn < 0) {
          nextColumn = this.data().columns.length - 1;
          nextRow -= 1;
        }
        next = { row: nextRow, column: nextColumn };
      } else {
        next = { row: row + direction, column };
      }
      if (
        event.key === 'Tab' &&
        !event.shiftKey &&
        next.row === this.data().rows.length
      ) {
        this.addRow();
      }
      this.activeCell.set(next);
      this.focusCell(next.row, next.column);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (
        !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        this.clearCell(row, column);
      }
    }
  }

  onCellPaste(
    event: ClipboardEvent,
    rowIndex: number,
    columnIndex: number,
  ): void {
    if (!this.canEdit()) {
      return;
    }
    const text = event.clipboardData?.getData('text/plain');
    if (!text || (!text.includes('\t') && !/[\r\n]/.test(text))) {
      return;
    }
    event.preventDefault();
    try {
      const matrix = parseClipboardMatrix(text);
      const columns = [...this.data().columns];
      const pastedWidth = Math.max(...matrix.map(row => row.length));
      while (
        columns.length < columnIndex + pastedWidth &&
        columns.length < 200
      ) {
        let number = columns.length + 1;
        let key = `column${number}`;
        while (columns.some(column => column.key === key)) {
          key = `column${++number}`;
        }
        columns.push({ key, label: `Column ${number}`, type: 'string' });
      }
      if (columns.length < columnIndex + pastedWidth) {
        throw new Error('Pasted data exceeds the 200-column table limit.');
      }
      const rows = [...this.data().rows];
      while (rows.length < rowIndex + matrix.length && rows.length < 10_000) {
        const newRow: Record<string, unknown> = {};
        for (const column of columns) {
          newRow[column.key] = null;
        }
        rows.push(newRow);
      }
      if (rows.length < rowIndex + matrix.length) {
        throw new Error('Pasted data exceeds the 10,000-row table limit.');
      }
      matrix.forEach((values, pastedRowIndex) => {
        values.forEach((rawValue, pastedColumnIndex) => {
          const targetColumn = columnIndex + pastedColumnIndex;
          const column = columns[targetColumn];
          rows[rowIndex + pastedRowIndex] = {
            ...rows[rowIndex + pastedRowIndex],
            [column.key]: parsePastedCell(rawValue, column),
          };
        });
      });
      this.commit({ version: 1, columns, rows });
    } catch (error) {
      this.validationError.set(
        error instanceof Error ? error.message : 'The pasted data is invalid.',
      );
    }
  }

  onRowDrop(event: CdkDragDrop<TaonSpreadsheetData['rows']>): void {
    if (!this.canEdit() || event.previousIndex === event.currentIndex) {
      return;
    }
    const rows = [...this.data().rows];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.commit({ ...this.data(), rows });
  }

  onColumnDrop(event: CdkDragDrop<TaonSpreadsheetColumn[]>): void {
    if (!this.canEdit() || event.previousIndex === event.currentIndex) {
      return;
    }
    const columns = [...this.data().columns];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.commit({ ...this.data(), columns });
  }

  undo(): void {
    if (!this.canEdit()) {
      return;
    }
    const previous = this.undoStack.pop();
    if (!previous) {
      return;
    }
    this.redoStack.push(this.data());
    this.data.set(previous);
    this.validationError.set('');
  }

  redo(): void {
    if (!this.canEdit()) {
      return;
    }
    const next = this.redoStack.pop();
    if (!next) {
      return;
    }
    this.undoStack.push(this.data());
    this.data.set(next);
    this.validationError.set('');
  }

  async importFile(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    inputElement.value = '';
    if (!file || !this.canEdit()) {
      return;
    }
    try {
      if (file.size > TAON_SPREADSHEET_MAX_BYTES) {
        throw new Error('Import files must be 10 MB or smaller.');
      }
      const text = await file.text();
      const imported = /\.json$/i.test(file.name)
        ? importSpreadsheetJson(text)
        : /\.csv$/i.test(file.name)
          ? parseSpreadsheetCsv(text)
          : (() => {
              throw new Error('Only JSON and CSV files are supported.');
            })();
      this.importFormat.set(/\.json$/i.test(file.name) ? 'JSON' : 'CSV');
      this.importMode.set('replace');
      this.pendingImport.set(imported);
    } catch (error) {
      this.validationError.set(
        error instanceof Error
          ? error.message
          : 'The selected file could not be imported.',
      );
    }
  }

  applyImport(): void {
    const imported = this.pendingImport();
    if (!imported || !this.canEdit()) {
      return;
    }
    if (
      this.importMode() === 'replace' &&
      (this.data().rows.length > 0 || this.data().columns.length > 0) &&
      !globalThis.confirm('Replace the current table with the imported data?')
    ) {
      return;
    }
    if (this.importMode() === 'append') {
      const currentColumns = this.data().columns;
      const compatible =
        currentColumns.length === imported.columns.length &&
        currentColumns.every(
          (column, index) =>
            column.key === imported.columns[index].key &&
            column.type === imported.columns[index].type,
        );
      if (!compatible) {
        this.validationError.set(
          'Append requires imported columns with the same keys, types, and order as this table.',
        );
        return;
      }
      this.commit({
        ...this.data(),
        rows: [...this.data().rows, ...imported.rows],
      });
    } else {
      this.commit(imported);
    }
    this.pendingImport.set(null);
  }

  cancelImport(): void {
    this.pendingImport.set(null);
  }

  previewCell(
    row: Record<string, unknown>,
    column: TaonSpreadsheetColumn,
  ): string {
    const value = row[column.key];
    return value === undefined
      ? ''
      : typeof value === 'string'
        ? value
        : JSON.stringify(value);
  }

  downloadJson(fullTable = false): void {
    const content = JSON.stringify(
      fullTable ? this.data() : this.data().rows,
      null,
      2,
    );
    this.download(
      content,
      fullTable ? 'json-table.json' : 'table-data.json',
      'application/json',
    );
  }

  downloadCsv(): void {
    this.download(
      serializeSpreadsheetCsv(this.data()),
      'table-data.csv',
      'text/csv',
    );
  }

  async copyJson(): Promise<void> {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard access is unavailable.');
      }
      await navigator.clipboard.writeText(this.jsonPreview());
      this.validationError.set('');
    } catch {
      this.validationError.set(
        'Could not access the clipboard. Copy the preview manually.',
      );
    }
  }

  keyFromLabel(label: string): string {
    return normalizeSpreadsheetKey(label);
  }

  setColumnWidth(columnIndex: number, value: string): void {
    if (!this.canEdit()) {
      return;
    }
    const width = Number(value);
    if (!Number.isFinite(width) || width < 40 || width > 1000) {
      this.validationError.set(
        'Column width must be between 40 and 1000 pixels.',
      );
      return;
    }
    const columns = this.data().columns.map(column => ({ ...column }));
    columns[columnIndex] = { ...columns[columnIndex], width };
    this.commit({ ...this.data(), columns });
  }

  cellValue(rowIndex: number, column: TaonSpreadsheetColumn): string {
    const value = this.data().rows[rowIndex]?.[column.key];
    if (column.type === 'json' && value !== null && value !== undefined) {
      return JSON.stringify(value);
    }
    return value === null || value === undefined ? '' : String(value);
  }

  trackColumn(_index: number, column: TaonSpreadsheetColumn): string {
    return column.key;
  }

  private clearCell(rowIndex: number, columnIndex: number): void {
    const column = this.data().columns[columnIndex];
    const rows = this.data().rows.map((row, index) =>
      index === rowIndex ? { ...row, [column.key]: null } : row,
    );
    this.commit({ ...this.data(), rows });
  }

  private focusCell(row: number, column: number): void {
    if (
      row < 0 ||
      row >= this.data().rows.length ||
      column < 0 ||
      column >= this.data().columns.length
    ) {
      return;
    }
    this.activeCell.set({ row, column });
    setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[data-cell="${row}:${column}"]`)
        ?.focus();
    });
  }

  private commit(value: TaonSpreadsheetData): void {
    try {
      const validated = validateSpreadsheetData(value);
      this.undoStack.push(this.data());
      if (this.undoStack.length > 100) {
        this.undoStack.shift();
      }
      this.redoStack.length = 0;
      this.data.set(validated);
      this.validationError.set('');
    } catch (error) {
      this.validationError.set(
        error instanceof Error ? error.message : 'Table data is invalid.',
      );
    }
  }

  private canEdit(): boolean {
    return !this.readOnly() && !this.disabled();
  }

  private download(
    content: string,
    fileName: string,
    contentType: string,
  ): void {
    const url = URL.createObjectURL(new Blob([content], { type: contentType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function parseClipboardMatrix(value: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && !cell) {
      quoted = true;
    } else if (character === '\t') {
      row.push(cell);
      cell = '';
    } else if (character === '\r' || character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (character === '\r' && value[index + 1] === '\n') {
        index += 1;
      }
    } else {
      cell += character;
    }
  }
  if (quoted) {
    throw new Error('Pasted data contains an unterminated quoted value.');
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function parsePastedCell(
  value: string,
  column: TaonSpreadsheetColumn,
): unknown {
  if (value === '') {
    return null;
  }
  if (column.type === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(
        `"${value}" is not a valid number for ${column.label || column.key}.`,
      );
    }
    return parsed;
  }
  if (column.type === 'boolean') {
    if (/^(true|1|yes)$/i.test(value)) {
      return true;
    }
    if (/^(false|0|no)$/i.test(value)) {
      return false;
    }
    throw new Error(
      `"${value}" is not a valid boolean for ${column.label || column.key}.`,
    );
  }
  if (column.type === 'date') {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    ) {
      throw new Error(
        `"${value}" is not a valid date for ${column.label || column.key}.`,
      );
    }
    return value;
  }
  if (column.type === 'json') {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(
        `"${value}" is not valid JSON for ${column.label || column.key}.`,
      );
    }
  }
  return value;
}
