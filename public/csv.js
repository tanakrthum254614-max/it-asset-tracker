// CSV แบบเรียบง่ายที่รองรับ "ข้อความ, มีจุลภาค" และขึ้นบรรทัดใหม่ในเครื่องหมายคำพูด
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

export function toCSV(rows) {
  const q = (v) => /[",\n\r]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '');
  // BOM ทำให้ Excel เปิดภาษาไทยได้ถูกต้อง
  return '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n');
}

export function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
