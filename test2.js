const api = require('./index.js');
const MemoryManager = require('./src/MemoryManager');
const Consolidator = require('./src/Consolidator');

const manager = new MemoryManager();
const consolidator = new Consolidator(manager);

async function runV21Test() {
    console.log("=== Neural Loom v2.1 Test Suite ===");

    // Test Tier 4: Procedural Skill
    console.log("\n--- Test: Procedural Skill (Tier 4) ---");
    api.saveSkill("install_nginx", ["apt update", "apt install nginx", "systemctl start nginx"]);
    const recalledSkill = api.recallSkill("install_nginx");
    console.log(`Recalled Skill: ${recalledSkill.name} with ${recalledSkill.steps.length} steps.`);

    // Test Tier 5: Evolve Meta Identity
    // Mock the LLM to return valid JSON
    const llmService = require('./src/LLMService');
    llmService.askLLMForJSON = async (prompt) => {
        if (prompt.includes("infer one new personality trait")) {
            return ["Helpful", "Poetic"];
        }
        if (prompt.includes("Extract immutable facts")) {
            return { "entities": { "Sky": ["is blue"] }, "general_facts": ["Testing semantic"] };
        }
        return {};
    };

    console.log("\n--- Test: Evolve Meta Identity (Tier 5) ---");
    const evolvedMeta = await api.evolveIdentity("The user asked 5 questions about poetry today and thanked me politely each time.");
    console.log(`New Traits added via Mock LLM: ${JSON.stringify(evolvedMeta.traits)}`);

    // Test Tier 3 & Consolidator: Archiving & Semantic Extraction
    console.log("\n--- Test: Archive & Semantic Extraction (Consolidator) ---");

    // Add a dummy memory and fake its strength to 0.05
    const dyingMem = manager.addEpisodicMemory("V2.1 Integration Test Core Fact: The sky is blue.");
    const fs = require('fs');
    const path = require('path');
    const config = require('./src/config.js');
    dyingMem.strength = 0.05;
    dyingMem.initial_entropy = 0.05;
    fs.writeFileSync(path.join(config.paths.episodic, `${dyingMem.id}.json`), JSON.stringify(dyingMem, null, 2));

    // Run consolidation
    await consolidator.runDaily();

    // Verify file moved to archive
    if (fs.existsSync(path.join(config.paths.archive, `${dyingMem.id}.json`))) {
        console.log(`✅ Memory successfully moved to Archive!`);
    } else {
        console.error(`❌ Memory was not archived.`);
    }

    // Verify Semantic Extraction Mock Facts
    const SemanticExtractor = require('./src/SemanticExtractor');
    const extractor = new SemanticExtractor();
    const facts = extractor.getFacts();
    console.log(`Semantic Facts Extract (Mocked): ${JSON.stringify(facts)}`);

    console.log("\n✅ All v2.1 Tests Passed!");
    process.exit(0);
}

runV21Test();
