const EventEmitter = require('events');

/**
 * Event-Driven Reporter (v2.2)
 * Emits Neural Loom summaries as Node.js events for the host application to consume.
 */
class Reporter extends EventEmitter {
    constructor() {
        super();
        console.log(`[Reporter] Registered internal Event Emitter mechanism.`);
    }

    /**
     * Emit Markdown formatted message externally
     * @param {string} message The markdown message content
     */
    async sendTelegramMessage(message) {
        // We keep the old method name so index.js backward-compatibility doesn't break
        // but it now acts as an emitter instead of an API dispatcher.

        console.log(`[Reporter] Emitting notification event to host...`);
        this.emit('notification', message);
        return true;
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

        // Trigger the general notification event
        await this.sendTelegramMessage(msg);
    }
}

// Export as a singleton so all components (Consolidator, index.js) use the same Emitter instance
module.exports = new Reporter();
