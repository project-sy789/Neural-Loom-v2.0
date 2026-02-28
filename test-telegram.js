const Reporter = require('./src/Reporter');

console.log("=== Neural Loom Telegram Test ===");

async function runTest() {
    if (!Reporter.isEnabled) {
        console.error("❌ Telegram Reporter is DISABLED. Have you set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in ~/.openclaw/v2/memory/.env ?");
        process.exit(1);
    }

    console.log("Sending a test Markdown message...");
    const success = await Reporter.sendTelegramMessage("👋 *Hello from Neural Loom v2.2!*\n_If you are seeing this, the notification system is working perfectly._");

    if (success) {
        console.log("✅ Test Complete: Message Sent.");
    } else {
        console.error("❌ Test Failed: Could not send message.");
    }

    process.exit(0);
}

runTest();
