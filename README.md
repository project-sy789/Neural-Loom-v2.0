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

// เริ่มต้น Session ใหม่ (ดึงความจำเก่ามารวมเป็น Prompt เและตัวตนของ AI)
const systemContext = memoryApi.buildContext();
console.log("นำข้อความนี้ไปใส่ใน System Prompt ก่อนเริ่มคุย:", systemContext);

// สร้างความจำใหม่ (Add Memory) - ระบบจะ commit Git ทันที
await memoryApi.addMemory("ผู้ใช้บอกว่าเขาชอบทานไอศกรีมรสสตรอเบอร์รี่");

// ดึงความจำ (Recall Memory) - กระตุ้นการเพิ่มความจำ (Rehearsal Boost) และ commit Git ทันที
await memoryApi.recallMemory("delta-1700000000000");
```

## การแจ้งเตือนและระบบ Report — Smart Reporter v2.3 📱

Neural Loom v2.3 ใช้ระบบ **Smart Reporter** ที่อ่าน Config ภายนอก Git เพื่อปรับวิธีส่งรายงาน ทำให้ `git pull` อัปเดตได้โดยไม่กระทบ Bridge ส่วนตัวของคุณ

### Config File (ไม่ติด Git)
สร้างหรือแก้ไขไฟล์ `~/.openclaw/v2/memory/neural-loom-config.json`:
```json
{
  "report_mode": "both"
}
```
| Mode | พฤติกรรม |
|---|---|
| `event` | Emit Node.js event ให้ host script รับ |
| `telegram` | เขียนลง `report-queue.json` ให้ bridge อ่านส่ง Telegram |
| `both` | ทำทั้งคู่ (ค่า default) |

### วิธีใช้ใน Host Script
```javascript
const memoryApi = require('./neural-loom/index.js');
memoryApi.on('notification', (msg) => {
    // ส่งต่อเข้า Telegram หรือ API อื่นๆ ของคุณได้เลย
});
```

### Queue-based Bridge
หากใช้ bridge script แยกต่างหาก (เช่น `bridge-telegram.js`) ระบบจะเขียน report เข้า:
`~/.openclaw/v2/memory/report-queue.json`
```json
[{ "id": 1700000000000, "message": "รายงานจาก Neural Loom" }]
```
Bridge อ่าน queue ตามรอบ และล้างหลังส่งสำเร็จ

ขอให้สนุกกับระบบความจำ AI สำหรับบอทที่ไม่มีวันสูญหายของคุณ! 🔒🧠✨

เพื่อให้ง่ายต่อการนำไปประกอบร่างกับบอทหลักของคุณ (เช่น สคริปต์ที่ต่อ Telegram หรือ n8n Webhook ไว้แล้ว) Neural Loom v2.2 จะทำงานในรูปแบบของ **Node.js Event Emitter**. 

ทุกๆ เที่ยงคืน หรือเมื่อมีการ Backup ระบบจะตะโกน (Emit) ข้อความออกมารอฟังได้เลย:

```javascript
const memoryApi = require('./neural-loom/index.js');

// ดักฟัง Event ชื่อ 'notification'
memoryApi.on('notification', (markdownMessage) => {
    console.log("ได้รับรายงานจากสมองกล แตะเพื่อส่งเข้า Telegram:");
    // ตรงนี้นำ markdownMessage ไปส่งเข้า API Telegram ของคุณได้เลย!
    // myTelegramBot.sendMessage(chatId, markdownMessage);
});
```

สามารถรันสคริปต์ทดสอบการดักฟัง Event ได้ด้วย:
```bash
node test-events.js
```

ขอให้สนุกกับระบบความจำ AI สำหรับบอทที่ไม่มีวันสูญหายของคุณ! 🔒🧠✨
