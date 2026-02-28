const memoryApi = require('./index.js');

console.log("=== Neural Loom Event Listener Test ===");
console.log("Waiting for Neural Loom notifications...");

// 1. Register the Event Listener (This is what the user's host script will do)
memoryApi.on('notification', (markdownMessage) => {
    console.log("\n🔔 [HOST SCRIPT CAUGHT EVENT]:");
    console.log("-----------------------------------------");
    console.log(markdownMessage);
    console.log("-----------------------------------------");
    console.log("✅ The host script can now forward this to Telegram.");

    // Auto-exit the test after receiving the first ping
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

// 2. Trigger a fake consolidation to force a notification emission
setTimeout(() => {
    console.log("... Simulating midnight consolidation ...");
    const Consolidator = require('./src/Consolidator');
    const MemoryManager = require('./src/MemoryManager');
    const c = new Consolidator(new MemoryManager());
    c.runDaily(); // This eventually triggers Reporter.sendDailyConsolidationReport() which emits a 'notification'
}, 1000);
