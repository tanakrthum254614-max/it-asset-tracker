import QRCode from 'qrcode';

// คืน QR (SVG) ที่ชี้ไปหน้า /a.html?tag=... ของเครื่องนั้น
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://local');
  const tag = url.searchParams.get('tag') || '';
  if (!/^[\w-]{1,40}$/.test(tag)) {
    res.statusCode = 400;
    return res.end('bad tag');
  }
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const svg = await QRCode.toString(`${proto}://${host}/a.html?tag=${encodeURIComponent(tag)}`, {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M',
  });
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(svg);
}
