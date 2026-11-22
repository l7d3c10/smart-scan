import { strToU8, zipSync } from 'fflate';

const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

const headers = [
  'Mã tài liệu', 'Tên tài liệu', 'Loại', 'Mô tả',
  'Trạng thái xử lý', 'Chế độ xử lý', 'Ngày tạo', 'Cập nhật',
];

function xmlText(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index) {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const digit = (value - 1) % 26;
    name = String.fromCharCode(65 + digit) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function inlineCell(ref, value, style = '') {
  const styleAttribute = style ? ` s="${style}"` : '';
  return `<c r="${ref}" t="inlineStr"${styleAttribute}><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh', hour12: false,
  }).format(date).replace(' ', ' ');
}

export function createDocumentsXlsx(items) {
  const rows = [headers, ...items.map((item) => [
    item.code,
    item.title,
    item.type_label,
    item.description,
    item.is_processed ? 'Đã xử lý' : 'Chưa xử lý',
    item.process_mode || '—',
    formatDate(item.created_at),
    formatDate(item.updated_at),
  ])];
  const lastRow = Math.max(rows.length, 1);
  const sheetRows = rows.map((values, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = values.map((value, columnIndex) => inlineCell(
      `${columnName(columnIndex)}${rowNumber}`,
      value,
      rowIndex === 0 ? '1' : ''
    )).join('');
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join('');

  const files = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}"><bookViews><workbookView/></bookViews><sheets><sheet name="Tài liệu" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${MAIN_NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D4ED8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${MAIN_NS}"><dimension ref="A1:H${lastRow}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="42" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/><col min="4" max="4" width="56" customWidth="1"/><col min="5" max="6" width="20" customWidth="1"/><col min="7" max="8" width="22" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:H${lastRow}"/></worksheet>`),
  };
  return zipSync(files, { level: 6 });
}
