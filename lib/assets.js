import { uid } from './http.js';

export const STATUS = { in_use: 'ใช้งาน', spare: 'สำรอง', repair: 'ส่งซ่อม', retired: 'ปลดระวาง' };
export const CATEGORY = {
  laptop: 'โน้ตบุ๊ก', desktop: 'คอมตั้งโต๊ะ', monitor: 'จอ', printer: 'เครื่องพิมพ์',
  phone: 'มือถือ/แท็บเล็ต', network: 'อุปกรณ์เครือข่าย', other: 'อื่น ๆ',
};
export const FIELDS = ['tag', 'name', 'category', 'serial', 'status', 'assignee', 'department', 'location', 'purchaseDate', 'price', 'warrantyUntil', 'note'];

const clean = (s, max = 500) => String(s ?? '').trim().slice(0, max);
const date = (s) => {
  const d = s ? new Date(s) : null;
  return d && !isNaN(d) ? d.toISOString().slice(0, 10) : '';
};
// รับได้ทั้ง key ภาษาอังกฤษและชื่อภาษาไทย (สำหรับ import จาก Excel)
const pick = (map, v, fallback) => map[v] ? v : Object.keys(map).find((k) => map[k] === v) || fallback;

export function nextTag(assets, prefix = 'IT') {
  const max = assets.reduce((m, a) => Math.max(m, Number(a.tag.match(/(\d+)$/)?.[1] || 0)), 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

// รวมข้อมูลที่ส่งมาเข้ากับ asset เดิม (หรือสร้างใหม่) และบันทึกประวัติเมื่อผู้ถือ/สถานะเปลี่ยน
export function upsert(assets, input) {
  let a = assets.find((x) => x.id === input.id) ||
    (input.tag && assets.find((x) => x.tag.toLowerCase() === clean(input.tag).toLowerCase()));
  const isNew = !a;
  // ช่องที่ไม่ได้ส่งมา (เช่นคอลัมน์ที่ไม่มีใน CSV) ใช้ค่าเดิม
  if (!isNew) input = { ...a, ...input };
  if (isNew) a ={ id: uid(), tag: clean(input.tag, 40).toUpperCase() || nextTag(assets), history: [], createdAt: new Date().toISOString() };

  const next = {
    name: clean(input.name, 200),
    category: pick(CATEGORY, clean(input.category), 'other'),
    serial: clean(input.serial, 100),
    status: pick(STATUS, clean(input.status), input.assignee ? 'in_use' : 'spare'),
    assignee: clean(input.assignee, 100),
    department: clean(input.department, 100),
    location: clean(input.location, 100),
    purchaseDate: date(input.purchaseDate),
    price: input.price === '' || input.price == null ? '' : Number(String(input.price).replace(/,/g, '')) || 0,
    warrantyUntil: date(input.warrantyUntil),
    note: clean(input.note, 2000),
  };
  if (!next.name) throw Object.assign(new Error('กรุณาใส่ชื่อ/รุ่นของอุปกรณ์'), { status: 400 });

  const log = [];
  if (isNew) log.push(`ลงทะเบียน${next.assignee ? ` ให้ ${next.assignee}` : ''}`);
  else {
    if (a.assignee !== next.assignee) log.push(next.assignee ? `ส่งมอบให้ ${next.assignee}${a.assignee ? ` (เดิม: ${a.assignee})` : ''}` : `รับคืนจาก ${a.assignee}`);
    if (a.status !== next.status) log.push(`สถานะ: ${STATUS[a.status]} → ${STATUS[next.status]}`);
    if (a.location !== next.location && next.location) log.push(`ย้ายไป ${next.location}`);
  }
  if (input.logNote) log.push(clean(input.logNote, 300));

  Object.assign(a, next, { updatedAt: new Date().toISOString() });
  const at = new Date().toISOString();
  a.history = [...log.map((text) => ({ at, text })), ...(a.history || [])].slice(0, 100);
  if (isNew) assets.push(a);
  return a;
}

// ข้อมูลที่แสดงให้คนทั่วไปที่สแกน QR เห็น (ไม่มีราคา, serial, หมายเหตุ)
export const publicView = (a) => ({
  tag: a.tag, name: a.name, category: a.category, status: a.status,
  assignee: a.assignee, department: a.department, location: a.location, warrantyUntil: a.warrantyUntil,
});
