# Neural Loom v2.0 🧠

สถาปัตยกรรมหน่วยความจำอัจฉริยะ 5 ระดับ (5-Tier Cognitive Architecture) สำหรับระบบความจำของ OpenClaw 

## คุณสมบัติหลัก (Features)
- **Tier 1 (Working)**: จัดการจากภายนอก (ตามขีดจำกัดของ RAM)
- **Tier 2 (Episodic)**: บันทึกเหตุการณ์ (delta events) เป็นไฟล์ `.json` ที่ `~/.openclaw/v2/memory/episodic/`
- **Tier 5 (Meta)**: ประวัติและตัวตนของ AI ที่รวมศูนย์ไว้ใน `~/.openclaw/v2/memory/meta-profile.json`
- **สูตรการสลายของความจำ (Ebbinghaus Decay Formula)**: คำนวณการเลือนหายของความจำตามกาลเวลาโดยอัตโนมัติ
- **การเพิ่มความจำผ่านการทบทวน (Rehearsal Boost)**: ความจำจะแข็งแกร่งขึ้นเมื่อมีการเรียกใช้งานหรือนึกถึง (Recall)
- **การรวบรวมและลบความจำอัตโนมัติ (Automated Consolidation)**: ทำงานตอนเที่ยงคืนของทุกวัน เพื่อลบความจำที่มีระดับความชัดเจน (Strength) ต่ำกว่า `0.1` ทิ้ง
- **ระบบสำรองข้อมูลอัตโนมัติ (Automated Backups)**:
  - ทุกการเปลี่ยนแปลงจะกระตุ้นการทำ `git commit` ในเครื่องทันที
  - สามารถบีบอัดไฟล์รูปแบบ Tarball (`.tar.gz`) เพื่อสำรองข้อมูลทุก 6 ชั่วโมง
  - มีระบบ Push ไปยัง GitHub ทุก 12 ชั่วโมง

## การติดตั้ง (Installation) 🚀

ทำการโคลน Repository นี้ลงในเครื่อง Ubuntu/Mac ของคุณ และรันสคริปต์ติดตั้ง:

```bash
cd Neural-Loom-v2.0
chmod +x install.sh
./install.sh
```

สคริปต์นี้จะจัดการ:
1. สร้างโครงสร้างโฟลเดอร์ที่จำเป็นทั้งหมดที่ `~/.openclaw/`
2. เริ่มต้นระบบควบคุมเวอร์ชัน (Git repository) ในโฟลเดอร์ `~/.openclaw/v2/memory` เพื่อติดตามประวัติความจำ
3. ติดตั้ง Dependencies สำหรับ Node.js (`node-cron`, `simple-git`)

## การใช้งาน (Usage) ⚙️

เริ่ม service เป็น background process เพื่อเปิดการทำงานของ cron jobs (consolidation และ backups):

```bash
npm start
```

### การตั้งค่าการเชื่อมต่อย้อนกลับไปยัง GitHub (Remote Push)
เพื่อเปิดการทำงานการผลักดันข้อมูล Git (Push) กลับไปยัง Remote Repository บน GitHub สำหรับการแบ็กอัปข้อมูลออนไลน์ คุณต้องตั้งค่า URL ด้วยขั้นตอนต่อไปนี้:

เข้าไปที่โฟลเดอร์ของ memory และกำหนดค่า Git remote URL ของคุณ:

```bash
cd ~/.openclaw/v2/memory
git remote add origin https://<YOUR_GITHUB_TOKEN>@github.com/YourUser/YourMemoryRepo.git
git push -u origin main
```
เมื่อตั้งค่าเรียบร้อยแล้ว, Neural Loom จะทำงานอัตโนมัติในการผลักดันข้อมูลกลับไปยัง GitHub ทุกๆ 12 ชั่วโมง

## การเรียกใช้งานบน API (API Integration)

คุณสามารถ require เครื่องมือนี้ไปใช้ในสคริปต์ปกติของ OpenClaw ได้เลย:

```javascript
const memoryApi = require('./neural-loom/index.js');

// สร้างความจำใหม่ (Add Memory) - ระบบจะ commit Git ทันที
await memoryApi.addMemory("ผู้ใช้บอกว่าเขาชอบทานไอศกรีมรสสตรอเบอร์รี่");

// ดึงความจำ (Recall Memory) - กระตุ้นการเพิ่มความจำ (Rehearsal Boost) และ commit Git ทันที
await memoryApi.recallMemory("delta-1700000000000");
```

ขอให้สนุกกับระบบความจำ AI สำหรับบอทที่ไม่มีวันสูญหายของคุณ! 🔒🧠✨
