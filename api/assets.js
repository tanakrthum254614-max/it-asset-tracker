import { send, readBody, query, isAdmin, denyUnlessAdmin } from '../lib/http.js';
import { load, save } from '../lib/store.js';
import { upsert, publicView } from '../lib/assets.js';

export default async function handler(req, res) {
  try {
    const assets = await load('assets', []);
    const q = query(req);

    // หน้าสแกน QR: ใครก็ดูได้ แต่เห็นข้อมูลเต็มเฉพาะแอดมิน
    if (req.method === 'GET' && q.tag) {
      const a = assets.find((x) => x.tag.toLowerCase() === q.tag.toLowerCase());
      if (!a) return send(res, 404, { error: `ไม่พบอุปกรณ์รหัส ${q.tag}` });
      return send(res, 200, isAdmin(req) ? { asset: a, admin: true } : { asset: publicView(a), admin: false });
    }

    if (denyUnlessAdmin(req, res)) return;

    if (req.method === 'GET') return send(res, 200, { assets });

    if (req.method === 'POST') {
      const body = await readBody(req);
      // { rows: [...] } = นำเข้าหลายรายการจาก CSV
      if (Array.isArray(body.rows)) {
        const errors = [];
        let count = 0;
        body.rows.forEach((row, i) => {
          // ช่องว่างใน CSV = ไม่แก้ค่าเดิม
          const values = Object.fromEntries(Object.entries(row || {}).filter(([, v]) => String(v ?? '').trim() !== ''));
          try { upsert(assets, values); count++; } catch (e) { errors.push(`แถว ${i + 2}: ${e.message}`); }
        });
        await save('assets', assets);
        return send(res, 200, { imported: count, errors });
      }
      const asset = upsert(assets, body);
      await save('assets', assets);
      return send(res, 200, { asset });
    }

    if (req.method === 'DELETE') {
      await save('assets', assets.filter((a) => a.id !== q.id));
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, e.status || 500, { error: e.message });
  }
}
