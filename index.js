require('fs');
const cron = require('node-cron');
const MemoryManager = require('./src/MemoryManager');
const Consolidator = require('./src/Consolidator');
const BackupService = require('./src/BackupService');

const startTime = Date.now();

console.log("==========================================");
console.log("🧠 Starting Neural Loom v2.3 Memory Service");
console.log("==========================================");

// Initialize Components
const memoryManager = new MemoryManager();
const backupService = require('./src/BackupService');
const bs = new backupService();
const consolidator = new Consolidator(memoryManager);
const Reporter = require('./src/Reporter');

// Helper: build a short system status string
function buildHeartbeat() {
    const episodicFiles = require('fs').readdirSync(memoryManager.episodicPath || require('./src/config').paths.episodic).filter(f => f.endsWith('.json'));
    const uptimeMins = Math.floor((Date.now() - startTime) / 60000);
    const uptimeStr = uptimeMins < 60 ? `${uptimeMins}m` : `${Math.floor(uptimeMins / 60)}h ${uptimeMins % 60}m`;
    return `💓 *Neural Loom — Heartbeat*
🕐 Uptime: \`${uptimeStr}\`
🧠 Episodic memories: \`${episodicFiles.length}\` เหตุการณ์
⚙️ All systems nominal ✅`;
}

// Boot Notification
Reporter.sendTelegramMessage("🟢 *Neural Loom v2.3 Started*\n_System is alive and listening..._");

// Schedule Daily Consolidation at 00:00
cron.schedule('0 0 * * *', () => {
    console.log(`[Cron] Triggering Daily Consolidation`);
    consolidator.runDaily();
    bs.autoCommit("chore: Daily consolidation completed");
});

// Schedule Auto-Tar Backup every 6 hours
cron.schedule('0 */6 * * *', async () => {
    console.log(`[Cron] Triggering Auto-Tar Backup`);
    bs.createTarBackup();
    await Reporter.sendTelegramMessage("📦 *Memory Backup Completed* \n_System created a new tar archive successfully._");
});

// Schedule Remote Push every 12 hours (Requires setup)
cron.schedule('0 */12 * * *', () => {
    console.log(`[Cron] Triggering Remote Push`);
    bs.pushToRemote();
});

// Schedule Hourly Change-Detection Heartbeat
let _lastMemoryCount = -1;
cron.schedule('0 * * * *', async () => {
    const config = require('./src/config');
    const fs = require('fs');
    const currentCount = fs.readdirSync(config.paths.episodic).filter(f => f.endsWith('.json')).length;

    if (currentCount !== _lastMemoryCount) {
        const delta = _lastMemoryCount === -1 ? currentCount : currentCount - _lastMemoryCount;
        const sign = delta >= 0 ? `+${delta}` : `${delta}`;
        console.log(`[Heartbeat] Memory count changed: ${_lastMemoryCount} -> ${currentCount}`);
        await Reporter.sendTelegramMessage(
            `💓 *Neural Loom — Status Update*\n` +
            `🧠 Memories: \`${currentCount}\` เหตุการณ์ (${sign} ชั่วโมงนี้)\n` +
            `⚙️ All systems nominal ✅`
        );
        _lastMemoryCount = currentCount;
    } else {
        console.log(`[Heartbeat] No change (${currentCount} memories). Silent.`);
    }
});

console.log("✅ Cron Jobs Scheduled.");
console.log("   - Heartbeat:    Every Hour");
console.log("   - Consolidation: Daily at 00:00");
console.log("   - Tar Backup:   Every 6 Hours");
console.log("   - Remote Push:  Every 12 Hours");

// Simulate Usage Loop or Keep Alive
console.log("⏳ Service is running. Press Ctrl+C to exit.");

const SkillManager = require('./src/SkillManager');
const skillManager = new SkillManager();

/**
 * Example APIs for interacting with memory (for integration into other OpenClaw components)
 */
const api = {
    addMemory: async (content) => {
        const mem = memoryManager.addEpisodicMemory(content);
        await bs.autoCommit(`feat: Added semantic chunk ${mem.id}`);
        return mem;
    },
    recallMemory: async (id) => {
        const mem = memoryManager.recallEpisodicMemory(id);
        if (mem) {
            await bs.autoCommit(`feat: Recalled and boosted memory ${id}`);
        }
        return mem;
    },
    // Context Building (For Session Starts)
    buildContext: () => memoryManager.buildContext(),
    // Tier 4
    saveSkill: (name, steps) => skillManager.saveSkill(name, steps),
    recallSkill: (name) => skillManager.recallSkill(name),
    // Tier 5 Evolve
    evolveIdentity: async (recentInteractions) => await memoryManager.evolveIdentity(recentInteractions),
    // Event Listeners for Host Application
    on: (event, callback) => Reporter.on(event, callback)
};

module.exports = api;
