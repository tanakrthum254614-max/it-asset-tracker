import { api, esc, fmtDate, toast } from './common.js';
import { parseCSV, toCSV, download } from './csv.js';

const $ = (s) => document.querySelector(s);
const HEADERS = {
  tag: 'รหัสทรัพย์สิน', name: 'ชื่อ/รุ่น', category: 'ประเภท', serial: 'Serial', status: 'สถานะ',
  assignee: 'ผู้ถือ', department: 'แผนก', location: 'สถานที่', purchaseDate: 'วันที่ซื้อ',
  price: 'ราคา', warrantyUntil: 'ประกันหมด', note: 'หมายเหตุ',
};
const STATUS_CLS = { in_use: 'ok', spare: '', repair: 'warn', retired: 'danger' };

let assets = [];
let cfg = { status: {}, category: {}, fields: [] };
let quick = '';
const selected = new Set();

const daysTo = (d) => Math.floor((new Date(d) - Date.now()) / 86400000);

function warrantyCell(a) {
  if (!a.warrantyUntil) return '<span class="sub">–</span>';
  const d = daysTo(a.warrantyUntil);
  const cls = d < 0 ? 'sub' : d <= 90 ? 'warn-text' : '';
  const note = d < 0 ? 'หมดแล้ว' : d <= 90 ? `อีก ${d} วัน` : '';
  return `<span class="${cls}">${fmtDate(a.warrantyUntil)}</span>${note ? `<div class="sub ${cls}">${note}</div>` : ''}`;
}

const QUICK = {
  all: { label: 'ทั้งหมด', test: () => true },
  in_use: { label: 'ใช้งานอยู่', test: (a) => a.status === 'in_use' },
  spare: { label: 'สำรอง (พร้อมแจก)', test: (a) => a.status === 'spare' },
  repair: { label: 'ส่งซ่อม', test: (a) => a.status === 'repair' },
  warranty: { label: 'ประกันหมดใน 90 วัน', test: (a) => a.warrantyUntil && daysTo(a.warrantyUntil) >= 0 && daysTo(a.warrantyUntil) <= 90 },
};

function filtered() {
  const q = $('#q').value.trim().toLowerCase();
  const cat = $('#fCat').value, st = $('#fStatus').value;
  return assets
    .filter((a) => (!quick || QUICK[quick].test(a)) && (!cat || a.category === cat) && (!st || a.status === st))
    .filter((a) => !q || [a.tag, a.name, a.serial, a.assignee, a.department, a.location, a.note].join(' ').toLowerCase().includes(q))
    .sort((a, b) => a.tag.localeCompare(b.tag, undefined, { numeric: true }));
}

function render() {
  $('#stats').innerHTML = Object.entries(QUICK).map(([k, v]) => `
    <button class="card stat ${quick === k || (!quick && k === 'all') ? 'active' : ''}" data-quick="${k}">
      <div class="n">${assets.filter(v.test).length}</div><div class="l">${v.label}</div>
    </button>`).join('');

  const list = filtered();
  const total = list.reduce((s, a) => s + (Number(a.price) || 0), 0);
  $('#rows').innerHTML = list.length ? list.map((a) => `
    <tr>
      <td class="check"><input type="checkbox" data-sel="${a.id}" ${selected.has(a.id) ? 'checked' : ''} aria-label="เลือก ${esc(a.tag)}"></td>
      <td class="tag"><a href="a.html?tag=${encodeURIComponent(a.tag)}">${esc(a.tag)}</a></td>
      <td>${esc(a.name)}<div class="sub">${esc(cfg.category[a.category] || a.category)}${a.serial ? ` · S/N ${esc(a.serial)}` : ''}</div></td>
      <td>${esc(a.assignee) || '<span class="sub">–</span>'}<div class="sub">${esc([a.department, a.location].filter(Boolean).join(' · '))}</div></td>
      <td><span class="badge ${STATUS_CLS[a.status]}">${esc(cfg.status[a.status] || a.status)}</span></td>
      <td>${warrantyCell(a)}</td>
      <td class="actions"><button class="small" data-edit="${a.id}">แก้ไข</button>
        <button class="small danger" data-del="${a.id}">ลบ</button></td>
    </tr>`).join('') + (total ? `<tr><td></td><td colspan="6" class="sub">${list.length} รายการ · มูลค่ารวม ${total.toLocaleString('th-TH')} บาท</td></tr>` : '')
    : `<tr><td colspan="7" class="empty">${assets.length ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีอุปกรณ์ กด “＋ เพิ่มอุปกรณ์” หรือนำเข้าจาก CSV'}</td></tr>`;

  $('#selAll').checked = list.length > 0 && list.every((a) => selected.has(a.id));
  $('#selbar').classList.toggle('show', selected.size > 0);
  $('#selCount').textContent = `เลือกไว้ ${selected.size} รายการ`;
}

async function refresh() {
  try { ({ assets } = await api('/api/assets')); render(); } catch (e) { toast(e.message, true); }
}

// ---------- ฟอร์ม ----------
function openForm(a = {}) {
  const f = $('#form');
  f.reset();
  for (const k of cfg.fields) if (f[k]) f[k].value = a[k] ?? '';
  f.id.value = a.id || '';
  f.tag.readOnly = !!a.id;
  if (!a.id) f.status.value = 'spare';
  $('#depts').innerHTML = [...new Set(assets.map((x) => x.department).filter(Boolean))].map((d) => `<option value="${esc(d)}">`).join('');
  $('#dlgTitle').textContent = a.id ? `แก้ไข ${a.tag}` : 'เพิ่มอุปกรณ์';
  $('#dlg').returnValue = '';
  $('#dlg').showModal();
}

$('#dlg').addEventListener('close', async () => {
  if ($('#dlg').returnValue !== 'save') return;
  try {
    const { asset } = await api('/api/assets', { method: 'POST', body: Object.fromEntries(new FormData($('#form'))) });
    toast(`บันทึก ${asset.tag} แล้ว`);
    refresh();
  } catch (e) { toast(e.message, true); }
});

// ผู้ถือถูกกรอก → เปลี่ยนสถานะเป็น "ใช้งาน" ให้อัตโนมัติ (ถ้ายังเป็นสำรอง)
$('#form').assignee.addEventListener('change', (e) => {
  const st = $('#form').status;
  if (e.target.value && st.value === 'spare') st.value = 'in_use';
  if (!e.target.value && st.value === 'in_use') st.value = 'spare';
});

// ---------- CSV ----------
$('#btnExport').onclick = () => {
  const rows = [cfg.fields.map((k) => HEADERS[k]), ...filtered().map((a) => cfg.fields.map((k) =>
    k === 'status' ? cfg.status[a.status] : k === 'category' ? cfg.category[a.category] : a[k]))];
  download(`it-assets-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
};

$('#dlTemplate').onclick = (e) => {
  e.preventDefault();
  download('it-assets-template.csv', toCSV([
    cfg.fields.map((k) => HEADERS[k]),
    ['', 'Dell Latitude 5440', 'โน้ตบุ๊ก', 'ABC1234', 'ใช้งาน', 'สมชาย ใจดี', 'บัญชี', 'ชั้น 3', '2025-01-15', '32900', '2028-01-15', ''],
  ]));
};

let importRows = [];
$('#csvFile').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const [head, ...body] = parseCSV(await file.text());
  // จับคู่หัวคอลัมน์: รับทั้งชื่อไทย (HEADERS) และชื่อ field อังกฤษ
  const keys = head.map((h) => {
    h = h.trim();
    return cfg.fields.find((k) => k.toLowerCase() === h.toLowerCase() || HEADERS[k] === h);
  });
  const known = keys.filter(Boolean);
  importRows = body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]]).filter(([k]) => k)));
  $('#importPreview').innerHTML = known.includes('name')
    ? `พบ ${importRows.length} แถว · คอลัมน์ที่ใช้: ${known.map((k) => HEADERS[k]).join(', ')}`
    : '<span class="danger-text">ไม่พบคอลัมน์ “ชื่อ/รุ่น” (name) ลองดูไฟล์ตัวอย่าง</span>';
  $('#btnDoImport').disabled = !known.includes('name') || !importRows.length;
};

$('#btnImport').onclick = () => {
  $('#formImport').reset();
  $('#importPreview').textContent = '';
  $('#btnDoImport').disabled = true;
  $('#dlgImport').returnValue = '';
  $('#dlgImport').showModal();
};

$('#dlgImport').addEventListener('close', async () => {
  if ($('#dlgImport').returnValue !== 'import') return;
  try {
    const r = await api('/api/assets', { method: 'POST', body: { rows: importRows } });
    toast(`นำเข้า ${r.imported} รายการ${r.errors.length ? ` · ข้าม ${r.errors.length} แถว` : ''}`, r.errors.length > 0);
    if (r.errors.length) console.warn(r.errors);
    refresh();
  } catch (e) { toast(e.message, true); }
});

// ---------- เหตุการณ์อื่น ๆ ----------
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.quick) { quick = t.dataset.quick === 'all' ? '' : t.dataset.quick; return render(); }
  if (t.dataset.edit) return openForm(assets.find((a) => a.id === t.dataset.edit));
  if (t.dataset.del) {
    const a = assets.find((x) => x.id === t.dataset.del);
    if (!confirm(`ลบ ${a.tag} (${a.name}) ออกจากทะเบียน?\nถ้าแค่เลิกใช้ แนะนำให้เปลี่ยนสถานะเป็น “ปลดระวาง” แทน`)) return;
    try { await api(`/api/assets?id=${a.id}`, { method: 'DELETE' }); selected.delete(a.id); refresh(); } catch (err) { toast(err.message, true); }
  }
});

document.addEventListener('change', (e) => {
  if (e.target.dataset.sel) {
    e.target.checked ? selected.add(e.target.dataset.sel) : selected.delete(e.target.dataset.sel);
    render();
  }
});

$('#selAll').onchange = (e) => {
  for (const a of filtered()) e.target.checked ? selected.add(a.id) : selected.delete(a.id);
  render();
};
$('#btnClearSel').onclick = () => { selected.clear(); render(); };
$('#btnLabels').onclick = () => {
  const tags = assets.filter((a) => selected.has(a.id)).map((a) => a.tag);
  window.open(`labels.html?tags=${encodeURIComponent(tags.join(','))}`, '_blank');
};

$('#btnAdd').onclick = () => openForm();
$('#q').oninput = render;
$('#fCat').onchange = render;
$('#fStatus').onchange = render;

(async () => {
  cfg = await fetch('/api/config').then((r) => r.json());
  $('#org').textContent = cfg.orgName;
  const opts = (map) => Object.entries(map).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  $('#fCat').insertAdjacentHTML('beforeend', opts(cfg.category));
  $('#fStatus').insertAdjacentHTML('beforeend', opts(cfg.status));
  $('#form').category.innerHTML = opts(cfg.category);
  $('#form').status.innerHTML = opts(cfg.status);
  refresh();
})();
