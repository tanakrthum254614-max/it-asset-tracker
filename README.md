<div align="center">

<img src="docs/banner.svg" alt="IT Asset Tracker" width="100%">

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-3c873a?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Vercel-Serverless-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
<img src="https://img.shields.io/badge/Upstash-Redis-00e9a3?style=flat-square&logo=upstash&logoColor=white" alt="Upstash">

</div>

## Overview

ระบบทะเบียนครุภัณฑ์ไอที ทดแทนการบันทึกด้วย Excel ติดป้าย QR ที่อุปกรณ์แต่ละเครื่อง เมื่อสแกนจะแสดงผู้ถือครอง สถานที่ใช้งาน และวันสิ้นสุดการรับประกันได้ทันที

*An IT asset register with QR labels, custody history, warranty tracking and CSV import/export — a replacement for spreadsheet-based inventories.*

<table>
<tr>
<td width="72%"><img src="docs/screenshot.png" alt="IT Asset Tracker — desktop"></td>
<td width="28%"><img src="docs/screenshot-phone.png" alt="IT Asset Tracker — mobile"></td>
</tr>
<tr><td align="center"><sub>หน้าจอคอมพิวเตอร์ (ข้อมูลตัวอย่าง)</sub></td><td align="center"><sub>หน้าจอโทรศัพท์มือถือ</sub></td></tr>
</table>

## Key Features

- **ทะเบียนอุปกรณ์** — สร้างรหัสครุภัณฑ์อัตโนมัติ (IT-0001, IT-0002, …) พร้อมหมายเลขเครื่อง ผู้ถือครอง แผนก สถานที่ ราคา และวันสิ้นสุดการรับประกัน
- **ป้าย QR** — พิมพ์ป้ายขนาด 62 × 30 มม. บนสติกเกอร์ A4
- **การสแกน QR** — ผู้ใช้ทั่วไปเห็นข้อมูลโดยย่อและแจ้งปัญหาได้ ผู้ดูแลระบบเห็นข้อมูลเต็มพร้อมคำสั่ง ส่งมอบ / รับคืน / ส่งซ่อม
- **ประวัติอัตโนมัติ** — บันทึกทุกครั้งที่เปลี่ยนผู้ถือครอง สถานะ หรือสถานที่
- **นำเข้า / ส่งออก CSV** — รองรับหัวคอลัมน์ภาษาไทย สำหรับย้ายข้อมูลจาก Excel
- **ภาพรวม** — จำนวนอุปกรณ์ที่ใช้งาน สำรอง ส่งซ่อม การรับประกันที่ใกล้สิ้นสุด และมูลค่ารวม

## Tech Stack

- Node.js (ES Modules) · Vercel Serverless Functions
- Upstash Redis (ฐานข้อมูล) · QR code generation · HTML / CSS / JavaScript

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

หากยังไม่ได้กำหนดฐานข้อมูล ระบบจะจัดเก็บข้อมูลเป็นไฟล์ภายในโฟลเดอร์ `.data/` สำหรับการทดสอบในเครื่อง

## Configuration

| Variable | Description |
|---|---|
| `ADMIN_KEY` | รหัสผู้ดูแลระบบ สำหรับดูและแก้ไขทะเบียน (จำเป็น) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | การเชื่อมต่อ Upstash Redis |
| `ORG_NAME` | ชื่อหน่วยงานที่แสดงบนหน้าเว็บ |
| `TICKET_URL` | ลิงก์แจ้งปัญหา ใช้กับปุ่ม "แจ้งปัญหาเครื่องนี้" ในหน้าสแกน |

## Deployment (Vercel)

1. นำเข้าโปรเจกต์จาก GitHub ใน Vercel
2. เพิ่มฐานข้อมูล **Upstash Redis** ในเมนู Storage
3. กำหนดค่า `ADMIN_KEY` (จำเป็น), `ORG_NAME` และ `TICKET_URL`
4. Deploy

## Usage Notes

พิมพ์ป้าย QR **หลังจากติดตั้งระบบแล้วเท่านั้น** เนื่องจาก QR จะอ้างอิงโดเมนที่ใช้เปิดหน้าพิมพ์ · สามารถใช้ร่วมกับ IT Expiry Alert เพื่อแจ้งเตือนการสิ้นสุดการรับประกันของอุปกรณ์สำคัญ

## Related Projects

[IT Runbook](https://github.com/tanakrthum254614-max/it-runbook) · [IT Expiry Alert](https://github.com/tanakrthum254614-max/it-expiry-alert) — ชุดเครื่องมือสำหรับงานสนับสนุนไอทีภายในองค์กร

---

<div align="center"><sub>Developed by <a href="https://github.com/tanakrthum254614-max">Tan Akrthum</a> · Bangkok, Thailand</sub></div>
