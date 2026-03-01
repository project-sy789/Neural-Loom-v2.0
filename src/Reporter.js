const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Smart Reporter v2.3
 *
 * Reads ~/.openclaw/v2/memory/neural-loom-config.json to decide how to deliver reports:
 *
 *   report_mode: "event"    -> Emit Node.js events only (host script receives them)
 *   report_mode: "telegram" -> Write to report-queue.json only (bridge-telegram picks them up)
 *   report_mode: "both"     -> Do both (DEFAULT)
 *
 * Config file lives OUTSIDE the git directory so it is never overwritten by git pull.
 * queue file: ~/.openclaw/v2/memory/report-queue.json
 */
class Reporter extends EventEmitter {
    constructor() {
        super();
        this.configPath = path.join(os.homedir(), '.openclaw', 'v2', 'memory', 'neural-loom-config.json');
        this.queuePath = path.join(os.homedir(), '.openclaw', 'v2', 'memory', 'report-queue.json');
        this.config = this._loadConfig();
        console.log(`[Reporter] Smart Reporter v2.3 ready | mode: ${this.config.report_mode}`);
    }

    _loadConfig() {
        const defaults = { report_mode: 'both' };
        try {
            if (fs.existsSync(this.configPath)) {
                return { ...defaults, ...JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) };
            }
        } catch (e) {
            console.warn(`[Reporter] Could not parse config, using defaults.`);
        }
        return defaults;
    }

    /**
     * Main delivery method.
     * Kept as `sendTelegramMessage` for backward-compatibility with Consolidator & index.js calls.
     */
    async sendTelegramMessage(message) {
        const mode = this.config.report_mode || 'both';

        if (mode === 'event' || mode === 'both') {
            console.log(`[Reporter] Emitting 'notification' event...`);
            this.emit('notification', message);
        }

        if (mode === 'telegram' || mode === 'both') {
            this._writeToQueue(message);
        }

        return true;
    }

    /**
     * Write a report entry to the queue JSON file.
     * bridge-telegram.js reads this file periodically and forwards to Telegram.
     */
    _writeToQueue(message) {
        let queue = [];
        try {
            if (fs.existsSync(this.queuePath)) {
                queue = JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
            }
        } catch (e) {
            queue = [];
        }

        queue.push({ id: Date.now(), message });

        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2), 'utf-8');
        console.log(`[Reporter] Report written to queue (${queue.length} pending).`);
    }

    /**
     * Standard midnight consolidation report.
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

// Singleton — all modules share the same instance and event bus
module.exports = new Reporter();
