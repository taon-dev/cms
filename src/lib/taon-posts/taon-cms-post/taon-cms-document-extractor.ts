import JSZip from 'jszip';

const DOC_COMPOUND_SIGNATURE = [
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
];
const END_OF_CHAIN = 0xfffffffe;
const FREE_SECTOR = 0xffffffff;

export async function extractDocumentHtml(file: File): Promise<string> {
  //#region @websqlFunc
  const extension = file.name.split('.').pop()?.toLowerCase();
  let paragraphs: string[];
  switch (extension) {
    case 'txt':
      paragraphs = textParagraphs(await file.text());
      break;
    case 'rtf':
      paragraphs = textParagraphs(parseRtf(await readRtf(file)));
      break;
    case 'docx':
      paragraphs = await extractDocxParagraphs(file);
      break;
    case 'doc':
      paragraphs = extractDocParagraphs(new Uint8Array(await file.arrayBuffer()));
      break;
    default:
      throw new Error('Unsupported document format.');
  }
  const content = paragraphs
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  if (!content.length) {
    throw new Error('The document contains no readable text.');
  }
  return content
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
  //#endregion
}

async function readRtf(file: File): Promise<string> {
  //#region @websqlFunc
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder('windows-1252').decode(bytes.subarray(0, 1024));
  const codePage = Number(header.match(/\\ansicpg(\d+)/i)?.[1] ?? 1252);
  try {
    return new TextDecoder(`windows-${codePage}`).decode(bytes);
  } catch {
    throw new Error(`The RTF character encoding ${codePage} is unsupported.`);
  }
  //#endregion
}

async function extractDocxParagraphs(file: File): Promise<string[]> {
  //#region @websqlFunc
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (
    DOC_COMPOUND_SIGNATURE.every((byte, index) => signature[index] === byte)
  ) {
    throw new Error('Encrypted Office documents are not supported.');
  }
  const archive = await JSZip.loadAsync(await file.arrayBuffer(), {
    checkCRC32: true,
  });
  const documentXml = await archive.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('The DOCX file is corrupt or has no document content.');
  }
  const xml = new DOMParser().parseFromString(documentXml, 'application/xml');
  if (xml.querySelector('parsererror')) {
    throw new Error('The DOCX document XML is corrupt.');
  }
  const paragraphs = Array.from(
    xml.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'p',
    ),
  ).map(paragraph => {
    let text = '';
    const visit = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.localName === 't') {
          text += element.textContent ?? '';
        } else if (element.localName === 'tab') {
          text += '\t';
        } else if (element.localName === 'br' || element.localName === 'cr') {
          text += '\n';
        } else {
          Array.from(element.childNodes).forEach(visit);
        }
      }
    };
    Array.from(paragraph.childNodes).forEach(visit);
    return text;
  });
  if (!paragraphs.some(paragraph => paragraph.trim())) {
    throw new Error('The DOCX document contains no readable text.');
  }
  return paragraphs;
  //#endregion
}

function extractDocParagraphs(bytes: Uint8Array): string[] {
  //#region @websqlFunc
  const compound = readCompoundFile(bytes);
  const wordDocument = compound.get('worddocument');
  if (!wordDocument) {
    throw new Error('The DOC file has no Word document stream.');
  }
  const wordView = new DataView(
    wordDocument.buffer,
    wordDocument.byteOffset,
    wordDocument.byteLength,
  );
  const fibFlags = wordView.getUint16(0x0a, true);
  if (fibFlags & 0x0100) {
    throw new Error('Encrypted Word documents are not supported.');
  }
  const table = compound.get(fibFlags & 0x0200 ? '1table' : '0table');
  if (!table) {
    throw new Error('The DOC file has no Word content table.');
  }
  const fibOffset =
    32 +
    2 +
    wordView.getUint16(32, true) * 2 +
    2;
  const cslw = wordView.getUint16(fibOffset, true);
  const fcLcbCountOffset = fibOffset + 2 + cslw * 4;
  const fcLcbCount = wordView.getUint16(fcLcbCountOffset, true);
  const fcLcbStart = fcLcbCountOffset + 2;
  const clxPairIndex = 33;
  if (fcLcbCount <= clxPairIndex) {
    throw new Error('The Word document format is unsupported.');
  }
  const clxOffset = wordView.getUint32(fcLcbStart + clxPairIndex * 8, true);
  const clxLength = wordView.getUint32(
    fcLcbStart + clxPairIndex * 8 + 4,
    true,
  );
  if (!clxLength || clxOffset + clxLength > table.byteLength) {
    throw new Error('The Word document content table is corrupt.');
  }
  let cursor = clxOffset;
  const clxEnd = clxOffset + clxLength;
  while (cursor < clxEnd && table[cursor] === 0x01) {
    if (cursor + 3 > clxEnd) {
      throw new Error('The Word document content table is corrupt.');
    }
    const groupLength = new DataView(
      table.buffer,
      table.byteOffset + cursor + 1,
      2,
    ).getUint16(0, true);
    cursor += 3 + groupLength;
  }
  if (cursor + 5 > clxEnd || table[cursor] !== 0x02) {
    throw new Error('The Word document has no readable text table.');
  }
  const pieceTableLength = new DataView(
    table.buffer,
    table.byteOffset + cursor + 1,
    4,
  ).getUint32(0, true);
  const pieceTableStart = cursor + 5;
  const pieceTableEnd = pieceTableStart + pieceTableLength;
  const pieceTableBytes = pieceTableEnd - pieceTableStart;
  if (
    pieceTableEnd > clxEnd ||
    pieceTableBytes < 4 ||
    (pieceTableBytes - 4) % 12 !== 0
  ) {
    throw new Error('The Word document piece table is corrupt.');
  }
  const pieceCount = (pieceTableBytes - 4) / 12;
  const pieceView = new DataView(
    table.buffer,
    table.byteOffset + pieceTableStart,
    pieceTableBytes,
  );
  const pieces: string[] = [];
  for (let index = 0; index < pieceCount; index += 1) {
    const cpStart = pieceView.getUint32(index * 4, true);
    const cpEnd = pieceView.getUint32((index + 1) * 4, true);
    const pcdOffset = 4 * (pieceCount + 1) + index * 8;
    const encodedOffset = pieceView.getUint32(pcdOffset + 2, true);
    const isCompressed = (encodedOffset & 0x40000000) !== 0;
    const textOffset = encodedOffset & 0x3fffffff;
    const textLength = (cpEnd - cpStart) * (isCompressed ? 1 : 2);
    const start = isCompressed ? Math.floor(textOffset / 2) : textOffset;
    if (
      cpEnd < cpStart ||
      start + textLength > wordDocument.byteLength
    ) {
      throw new Error('The Word document text table is corrupt.');
    }
    pieces.push(
      isCompressed
        ? new TextDecoder('windows-1252').decode(
            wordDocument.subarray(start, start + textLength),
          )
        : new TextDecoder('utf-16le').decode(
            wordDocument.subarray(start, start + textLength),
          ),
    );
  }
  const text = pieces
    .join('')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const paragraphs = text
    .split(/\r|\n|\f/)
    .map(paragraph => paragraph.replace(/\t/g, ' ').trim())
    .filter(Boolean);
  if (!paragraphs.length) {
    throw new Error('The Word document contains no readable text.');
  }
  return paragraphs;
  //#endregion
}

function readCompoundFile(bytes: Uint8Array): Map<string, Uint8Array> {
  //#region @websqlFunc
  if (
    bytes.length < 512 ||
    DOC_COMPOUND_SIGNATURE.some((byte, index) => bytes[index] !== byte)
  ) {
    throw new Error('The DOC file is not a valid binary Word document.');
  }
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sectorSize = 2 ** header.getUint16(0x1e, true);
  const miniSectorSize = 2 ** header.getUint16(0x20, true);
  const majorVersion = header.getUint16(0x1a, true);
  if (
    ![512, 4096].includes(sectorSize) ||
    miniSectorSize !== 64 ||
    ![3, 4].includes(majorVersion)
  ) {
    throw new Error('The DOC file uses an unsupported compound format.');
  }
  const sectorCount = Math.floor(bytes.length / sectorSize) - 1;
  const sector = (id: number): Uint8Array => {
    if (!Number.isInteger(id) || id < 0 || id >= sectorCount) {
      throw new Error('The DOC file contains an invalid sector reference.');
    }
    const start = (id + 1) * sectorSize;
    return bytes.subarray(start, start + sectorSize);
  };
  const difat: number[] = [];
  for (let offset = 0x4c; offset < 0x200; offset += 4) {
    const id = header.getUint32(offset, true);
    if (id !== FREE_SECTOR) {
      difat.push(id);
    }
  }
  let nextDifat = header.getUint32(0x44, true);
  const difatSectorCount = header.getUint32(0x48, true);
  const difatVisited = new Set<number>();
  for (
    let index = 0;
    index < difatSectorCount && nextDifat !== END_OF_CHAIN;
    index += 1
  ) {
    if (difatVisited.has(nextDifat)) {
      throw new Error('The DOC file contains a circular DIFAT chain.');
    }
    difatVisited.add(nextDifat);
    const data = sector(nextDifat);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let offset = 0; offset < sectorSize - 4; offset += 4) {
      const id = view.getUint32(offset, true);
      if (id !== FREE_SECTOR) {
        difat.push(id);
      }
    }
    nextDifat = view.getUint32(sectorSize - 4, true);
  }
  const fatSectorCount = header.getUint32(0x2c, true);
  if (difat.length < fatSectorCount) {
    throw new Error('The DOC file FAT is incomplete.');
  }
  const fat: number[] = [];
  for (const id of difat.slice(0, fatSectorCount)) {
    const data = sector(id);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    for (let offset = 0; offset < sectorSize; offset += 4) {
      fat.push(view.getUint32(offset, true));
    }
  }
  const readFatChain = (start: number): Uint8Array => {
    const chunks: Uint8Array[] = [];
    const visited = new Set<number>();
    let current = start;
    while (current !== END_OF_CHAIN && current !== FREE_SECTOR) {
      if (visited.has(current) || visited.size > sectorCount) {
        throw new Error('The DOC file contains a circular FAT chain.');
      }
      visited.add(current);
      chunks.push(sector(current));
      current = fat[current] ?? END_OF_CHAIN;
    }
    return concat(chunks);
  };
  const directoryBytes = readFatChain(header.getUint32(0x30, true));
  const entries: {
    name: string;
    type: number;
    start: number;
    size: number;
  }[] = [];
  for (let offset = 0; offset + 128 <= directoryBytes.length; offset += 128) {
    const view = new DataView(
      directoryBytes.buffer,
      directoryBytes.byteOffset + offset,
      128,
    );
    const nameLength = view.getUint16(64, true);
    if (nameLength < 2 || nameLength > 64) {
      continue;
    }
    const name = new TextDecoder('utf-16le')
      .decode(directoryBytes.subarray(offset, offset + nameLength - 2))
      .toLowerCase();
    const size =
      majorVersion === 3
        ? view.getUint32(120, true)
        : view.getUint32(120, true) +
          view.getUint32(124, true) * 0x100000000;
    entries.push({
      name,
      type: view.getUint8(66),
      start: view.getUint32(116, true),
      size,
    });
  }
  const root = entries.find(entry => entry.type === 5);
  if (!root) {
    throw new Error('The DOC file has no compound root directory.');
  }
  const miniStream = readFatChain(root.start).subarray(0, root.size);
  const miniFatStart = header.getUint32(0x3c, true);
  const miniFatCount = header.getUint32(0x40, true);
  const miniFatData =
    miniFatCount > 0 ? readFatChain(miniFatStart).subarray(0, miniFatCount * sectorSize) : new Uint8Array();
  const miniFatView = new DataView(
    miniFatData.buffer,
    miniFatData.byteOffset,
    miniFatData.byteLength,
  );
  const readMiniChain = (start: number, size: number): Uint8Array => {
    const chunks: Uint8Array[] = [];
    const visited = new Set<number>();
    let current = start;
    let remaining = size;
    while (
      remaining > 0 &&
      current !== END_OF_CHAIN &&
      current !== FREE_SECTOR
    ) {
      if (
        visited.has(current) ||
        visited.size > miniFatData.length / 4 ||
        current * miniSectorSize + miniSectorSize > miniStream.length
      ) {
        throw new Error('The DOC file contains a circular mini-FAT chain.');
      }
      visited.add(current);
      const length = Math.min(remaining, miniSectorSize);
      chunks.push(
        miniStream.subarray(
          current * miniSectorSize,
          current * miniSectorSize + length,
        ),
      );
      remaining -= length;
      current =
        current * 4 + 4 <= miniFatData.length
          ? miniFatView.getUint32(current * 4, true)
          : END_OF_CHAIN;
    }
    if (remaining > 0) {
      throw new Error('The DOC file contains an incomplete mini-FAT chain.');
    }
    return concat(chunks);
  };
  const streams = new Map<string, Uint8Array>();
  for (const entry of entries.filter(entry => entry.type === 2)) {
    if (entry.size > bytes.length * 100) {
      throw new Error('The DOC file stream is too large to process.');
    }
    const content =
      entry.size < header.getUint32(0x38, true)
        ? readMiniChain(entry.start, entry.size)
        : readFatChain(entry.start).subarray(0, entry.size);
    streams.set(entry.name, content);
  }
  if (!streams.has('worddocument')) {
    throw new Error('The DOC file has no Word document stream.');
  }
  return streams;
  //#endregion
}

function parseRtf(rtf: string): string {
  //#region @websqlFunc
  if (!/^\s*\{\\rtf\d?/i.test(rtf)) {
    throw new Error('The RTF file is corrupt or has an unsupported format.');
  }
  const codePage = Number(rtf.match(/\\ansicpg(\d+)/i)?.[1] ?? 1252);
  let ansiDecoder: TextDecoder;
  try {
    ansiDecoder = new TextDecoder(`windows-${codePage}`);
  } catch {
    throw new Error(`The RTF character encoding ${codePage} is unsupported.`);
  }
  const destinations = new Set([
    'fonttbl',
    'colortbl',
    'stylesheet',
    'info',
    'pict',
    'object',
    'header',
    'footer',
    'listtable',
    'listoverridetable',
    'generator',
    'xmlopen',
    'xmlclose',
  ]);
  const stack: { skip: boolean; unicodeFallback: number }[] = [];
  let skip = false;
  let unicodeFallback = 1;
  let fallbackCharacters = 0;
  let output = '';
  for (let index = 0; index < rtf.length; index += 1) {
    const character = rtf[index];
    if (character === '{') {
      stack.push({ skip, unicodeFallback });
      continue;
    }
    if (character === '}') {
      const state = stack.pop();
      if (!state) {
        throw new Error('The RTF document has unbalanced groups.');
      }
      skip = state.skip;
      unicodeFallback = state.unicodeFallback;
      continue;
    }
    if (character !== '\\') {
      if (!skip && !/\r|\n/.test(character)) {
        if (fallbackCharacters > 0) {
          fallbackCharacters -= 1;
        } else {
          output += character;
        }
      }
      continue;
    }
    const next = rtf[index + 1];
    if (next === "'" && /^[0-9a-f]{2}$/i.test(rtf.slice(index + 2, index + 4))) {
      const value = Number.parseInt(rtf.slice(index + 2, index + 4), 16);
      index += 3;
      if (!skip) {
        if (fallbackCharacters > 0) {
          fallbackCharacters -= 1;
        } else {
          output += ansiDecoder.decode(new Uint8Array([value]));
        }
      }
      continue;
    }
    if (next === '\\' || next === '{' || next === '}') {
      index += 1;
      if (!skip) {
        if (fallbackCharacters > 0) {
          fallbackCharacters -= 1;
        } else {
          output += next;
        }
      }
      continue;
    }
    if (next === '*') {
      skip = true;
      index += 1;
      continue;
    }
    const control = rtf.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i);
    if (!control) {
      index += 1;
      continue;
    }
    const word = control[1].toLowerCase();
    const parameter = control[2] ? Number(control[2]) : undefined;
    index += control[0].length;
    if (stack.length && destinations.has(word)) {
      skip = true;
      continue;
    }
    if (skip) {
      continue;
    }
    if (word === 'uc' && parameter !== undefined) {
      unicodeFallback = Math.max(0, parameter);
    } else if (word === 'u' && parameter !== undefined) {
      output += String.fromCharCode(parameter < 0 ? parameter + 65536 : parameter);
      fallbackCharacters = unicodeFallback;
    } else if (word === 'par' || word === 'line') {
      output += '\n';
    } else if (word === 'tab') {
      output += '\t';
    } else if (word === 'emdash') {
      output += '\u2014';
    } else if (word === 'endash') {
      output += '\u2013';
    } else if (word === 'bullet') {
      output += '\u2022';
    }
  }
  if (stack.length) {
    throw new Error('The RTF document has unbalanced groups.');
  }
  return output;
  //#endregion
}

function textParagraphs(text: string): string[] {
  //#region @websqlFunc
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(paragraph => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean);
  //#endregion
}

function escapeHtml(text: string): string {
  //#region @websqlFunc
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  //#endregion
}

function concat(chunks: Uint8Array[]): Uint8Array {
  //#region @websqlFunc
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
  //#endregion
}
