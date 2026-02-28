const api = require('./index.js');
const fs = require('fs');
const path = require('path');
const config = require('./src/config.js');

async function runIntegrationTest() {
    console.log("=== Running Integration Test ===");

    // 1. Add a memory
    console.log("-> Adding memory...");
    const mem = await api.addMemory("Integration test memory content: Neural Loom v2.0 is alive.");
    console.log(`Memory ID: ${mem.id}`);

    // Check if file exists
    const memPath = path.join(config.paths.episodic, `${mem.id}.json`);
    if (!fs.existsSync(memPath)) {
        console.error("❌ Memory file not created!");
        process.exit(1);
    }
    console.log("✅ Memory file created.");

    // 2. Recall memory
    console.log("-> Recalling memory...");
    const recalledMem = await api.recallMemory(mem.id);
    if (!recalledMem) {
        console.error("❌ Memory could not be recalled!");
        process.exit(1);
    }
    if (recalledMem.rehearsal_count !== 1) {
        console.error("❌ Rehearsal count did not increment!");
        process.exit(1);
    }
    console.log(`✅ Memory recalled successfully. New strength: ${recalledMem.strength.toFixed(4)}`);

    // Wait slightly to let Git operations finish if any
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("✅ Integration test passed. Exiting...");
    process.exit(0);
}

runIntegrationTest();
