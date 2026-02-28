const fs = require('fs');
const path = require('path');
const config = require('./config');

class MemoryManager {
    constructor() {
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            config.paths.base,
            config.paths.episodic,
            config.paths.procedural,
            config.paths.semantic,
            config.paths.backups
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Store an episodic memory (Tier 2)
     * @param {string} content Delta event content
     */
    addEpisodicMemory(content) {
        const timestamp = new Date().toISOString();
        const memoryId = `delta-${Date.now()}`;
        const memoryPath = path.join(config.paths.episodic, `${memoryId}.json`);

        const memoryData = {
            id: memoryId,
            content: content,
            created_at: timestamp,
            last_rehearsed: timestamp,
            rehearsal_count: 0,
            initial_entropy: 1.0,
            strength: 1.0
        };

        fs.writeFileSync(memoryPath, JSON.stringify(memoryData, null, 2));
        console.log(`[Tier 2] Added episodic memory: ${memoryId}`);
        return memoryData;
    }

    /**
     * Retrieve a memory and apply Rehearsal Boost
     */
    recallEpisodicMemory(memoryId) {
        const memoryPath = path.join(config.paths.episodic, `${memoryId}.json`);
        if (!fs.existsSync(memoryPath)) return null;

        const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));

        // Apply Rehearsal Boost
        memoryData.rehearsal_count += 1;
        const boost = Math.log(1 + memoryData.rehearsal_count) * 0.15;

        // Update strength and timestamps
        // We recalculate current decayed strength before adding boost.
        const currentDecayedStrength = this.calculateStrength(memoryData, config.decayRates.episodic);
        memoryData.strength = Math.min(1.0, currentDecayedStrength + boost); // Cap at 1.0
        memoryData.last_rehearsed = new Date().toISOString();

        // The base entropy is essentially reset to the new strength level on rehearsal
        memoryData.initial_entropy = memoryData.strength;

        fs.writeFileSync(memoryPath, JSON.stringify(memoryData, null, 2));
        console.log(`[Tier 2] Recalled memory: ${memoryId}, Boost Applied.`);
        return memoryData;
    }

    /**
     * Calculate Ebbinghaus Decay
     * strength = initialEntropy * exp(-lambda * sqrt(t))
     */
    calculateStrength(memoryData, lambda) {
        const lastTime = new Date(memoryData.last_rehearsed).getTime();
        const now = Date.now();
        const timeDiffDays = (now - lastTime) / (1000 * 60 * 60 * 24); // Difference in days

        if (timeDiffDays <= 0) return memoryData.initial_entropy;

        const decayFactor = Math.exp(-lambda * Math.sqrt(timeDiffDays));
        return memoryData.initial_entropy * decayFactor;
    }

    getMetaProfile() {
        if (!fs.existsSync(config.paths.metaProfile)) return null;
        return JSON.parse(fs.readFileSync(config.paths.metaProfile, 'utf-8'));
    }

    updateMetaProfileProfile(newData) {
        let currentMeta = this.getMetaProfile();
        if (!currentMeta) currentMeta = { traits: [] };

        const updatedMeta = { ...currentMeta, ...newData, last_updated: new Date().toISOString() };
        fs.writeFileSync(config.paths.metaProfile, JSON.stringify(updatedMeta, null, 2));
        return updatedMeta;
    }

    /**
     * Evolve Meta Profile Identity Tools (Tier 5)
     * Calls LLM to summarize recent interactions and add new traits based on behavior
     */
    async evolveIdentity(recentInteractionsText) {
        console.log(`[Tier 5] Evolving Meta Identity...`);
        const llmService = require('./LLMService');

        const prompt = `
Based on the following recent user interactions, infer one new personality trait or preference the AI should adopt.
Interactions:
"${recentInteractionsText}"

Return ONLY a valid JSON string array of 1 to 3 new traits. E.g. ["Helpful", "Prefers short answers"]
         `;

        const newTraits = await llmService.askLLMForJSON(prompt);
        if (newTraits && Array.isArray(newTraits)) {
            let currentMeta = this.getMetaProfile();
            if (!currentMeta) currentMeta = { traits: [] };

            // Deduplicate traits
            const currentTraits = currentMeta.traits || [];
            const mergedTraits = [...new Set([...currentTraits, ...newTraits])];

            return this.updateMetaProfileProfile({ traits: mergedTraits });
        }
        return null;
    }
}

module.exports = MemoryManager;
