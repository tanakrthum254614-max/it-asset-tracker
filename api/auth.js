import { send, denyUnlessAdmin } from '../lib/http.js';

// ใช้ตรวจรหัสแอดมินก่อนเปิดโหมดแอดมินในหน้าเว็บ
export default function handler(req, res) {
  if (denyUnlessAdmin(req, res)) return;
  send(res, 200, { ok: true });
}
