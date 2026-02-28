require('fs');
const cron = require('node-cron');
const MemoryManager = require('./src/MemoryManager');
const Consolidator = require('./src/Consolidator');
const BackupService = require('./src/BackupService');

console.log("==========================================");
console.log("🧠 Starting Neural Loom v2.0 Memory Service");
console.log("==========================================");

// Initialize Components
const memoryManager = new MemoryManager();
const backupService = require('./src/BackupService');
const bs = new backupService();
const consolidator = new Consolidator(memoryManager);
const Reporter = require('./src/Reporter');

// Boot Notification
Reporter.sendTelegramMessage("🟢 *Neural Loom Memory Node Started* \\(v2.2\\)\n_System is alive and listening..._");

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

console.log("✅ Cron Jobs Scheduled.");
console.log("   - Consolidation: Daily at 00:00");
console.log("   - Tar Backup: Every 6 Hours");
console.log("   - Remote Push: Every 12 Hours");

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
