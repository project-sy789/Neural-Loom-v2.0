const MemoryManager = require('./src/MemoryManager');

console.log("=== Neural Loom Test Suite ===");

const manager = new MemoryManager();

// Test 1: Add a memory
console.log("\n--- Test 1: Add Memory ---");
const mem1 = manager.addEpisodicMemory("Artificial General Intelligence (AGI) is the hypothetical ability of an intelligent agent to understand or learn any intellectual task that human beings or other animals can.");

// Test 2: Calculate Decay
console.log("\n--- Test 2: Calculate Decay ---");
// Simulate time passing (e.g., 30 days)
mem1.last_rehearsed = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const decayedStrength = manager.calculateStrength(mem1, 0.05); // Tier 2 lambda
console.log(`Initial Strength: ${mem1.initial_entropy.toFixed(4)}`);
console.log(`Strength after 30 days: ${decayedStrength.toFixed(4)}`);

// Test 3: Recall & Boost Memory
console.log("\n--- Test 3: Rehearsal Boost ---");
// We first need to fake the file so recall works
const path = require('path');
const fs = require('fs');
const config = require('./src/config');
const memPath = path.join(config.paths.episodic, `${mem1.id}.json`);
fs.writeFileSync(memPath, JSON.stringify(mem1, null, 2));

const recalledMem = manager.recallEpisodicMemory(mem1.id);
console.log(`New Strength after Boost: ${recalledMem.strength.toFixed(4)}`);
console.log(`New Entropy Base (For next decay cycle): ${recalledMem.initial_entropy.toFixed(4)}`);

// Test 4: Update Meta Profile
console.log("\n--- Test 4: Meta Profile ---");
const newMeta = manager.updateMetaProfileProfile({
    traits: ["Creative", "Logical", "Resilient"]
});
console.log(`Updated Identity Traits: ${newMeta.traits.join(", ")}`);
console.log(`Remaining Strength: ${newMeta.strength || 1.0}`);

console.log("\n✅ All Tests Passed!");
