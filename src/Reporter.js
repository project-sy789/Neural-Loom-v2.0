const https = require('https');
const path = require('path');
const config = require('./config');

// Load environment variables from memory directory
require('dotenv').config({ path: path.join(config.paths.base, '.env') });

class Reporter {
    constructor() {
        this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.isEnabled = this.telegramToken && this.chatId;

        if (!this.isEnabled) {
            console.log(`[Reporter] Telegram reporting is disabled (Missing TOKEN or CHAT_ID in .env)`);
        }
    }

    /**
     * Send Markdown formatted message to Telegram
     * @param {string} message The markdown message content
     */
    async sendTelegramMessage(message) {
        if (!this.isEnabled) return false;

        console.log(`[Reporter] Sending message to Telegram...`);

        const payload = JSON.stringify({
            chat_id: this.chatId,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${this.telegramToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (d) => body += d);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log(`[Reporter] ✅ Message successfully sent to Telegram.`);
                        resolve(true);
                    } else {
                        console.error(`[Reporter] ❌ Telegram API Error: ${body}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`[Reporter] ❌ Connection error to Telegram: ${e.message}`);
                resolve(false);
            });

            req.write(payload);
            req.end();
        });
    }

    /**
     * Standard midnight report formatting
     */
    async sendDailyConsolidationReport({ survived, archived, newSemanticGroups }) {
        const msg = `🧠 *Neural Loom - Daily Report*
         
🌙 *Consolidation Cycle Finished!*
- ความจำที่ยังแข็งแกร่ง (Survived): \`${survived}\` เหตุการณ์
- ความจำที่ถูกลบและบีบอัด (Archived): \`${archived}\` เหตุการณ์
- ข้อเท็จจริงใหม่ที่ถูกเรียนรู้ (Semantics): \`${newSemanticGroups}\` กลุ่ม

_ระบบได้ทำการบันทึกและจัดการทรัพยากรเรียบร้อยแล้ว_ ✨`;

        await this.sendTelegramMessage(msg);
    }
}

module.exports = new Reporter();
