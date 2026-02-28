const fs = require('fs');
const path = require('path');
const config = require('./config');
const SemanticExtractor = require('./SemanticExtractor');
const Reporter = require('./Reporter');

class Consolidator {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.semanticExtractor = new SemanticExtractor();
    }

    /**
     * Run the daily consolidation, pruning, and summarization
     */
    async runDaily() {
        console.log(`[Consolidator] Running daily consolidation at ${new Date().toISOString()}`);

        // Scans episodic memories
        const files = fs.readdirSync(config.paths.episodic)
            .filter(f => f.endsWith('.json'));

        let survivedCount = 0;
        let archivedCount = 0;
        let decayingMemories = [];

        for (const file of files) {
            const memoryPath = path.join(config.paths.episodic, file);
            try {
                const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
                const currentStrength = this.memoryManager.calculateStrength(memoryData, config.decayRates.episodic);

                // Update the memory file with the new strength
                memoryData.strength = currentStrength;

                if (currentStrength < config.thresholds.consolidationDelete) {
                    // Stage 1: Extract Semantic Facts (Tier 3)
                    await this.semanticExtractor.extractAndStore(memoryData.content);

                    // Stage 2: Move to Archive instead of deleting
                    console.log(`[Consolidator] Archiving memory ${memoryData.id} (strength: ${currentStrength.toFixed(4)} < ${config.thresholds.consolidationDelete})`);
                    const archivePath = path.join(config.paths.archive, file);
                    fs.writeFileSync(archivePath, JSON.stringify(memoryData, null, 2));
                    fs.unlinkSync(memoryPath);
                    archivedCount++;

                    decayingMemories.push(memoryData.content);
                } else {
                    fs.writeFileSync(memoryPath, JSON.stringify(memoryData, null, 2));
                    survivedCount++;
                }
            } catch (err) {
                console.error(`[Consolidator] Error processing memory ${file}: ${err.message}`);
            }
        }

        // Stage 3: Auto-Summarization 
        // If we archived many small things, let's create a new dense episodic memory
        if (decayingMemories.length >= 5) { // Threshold for summarization
            console.log(`[Consolidator] Triggering LLM auto-summarization on ${decayingMemories.length} dying memories...`);
            const llmService = require('./LLMService');

            const prompt = `
Summarize the core learnings and narrative from these fading memories into a single concise memory event.
Memories:
${decayingMemories.join('\n')}
             `;

            const summaryContent = await llmService.askLLM(prompt);
            const newMem = this.memoryManager.addEpisodicMemory(`[Summary] ${summaryContent}`);
            console.log(`[Consolidator] Summarization complete. Created new memory: ${newMem.id}`);
        }

        // Stage 4: Meta Profile Evolution (Tier 5)
        const metaProfile = this.memoryManager.getMetaProfile();
        if (metaProfile) {
            const metaStrength = this.memoryManager.calculateStrength({
                last_rehearsed: metaProfile.last_updated || metaProfile.created_at,
                initial_entropy: metaProfile.strength || 1.0
            }, config.decayRates.meta);

            // We can also allow the LLM to evolve the identity traits here if needed
            this.memoryManager.updateMetaProfileProfile({
                strength: Math.max(0.01, metaStrength), // Meta profile doesn't drop below 0.01
                last_consolidated: new Date().toISOString()
            });
        }

        console.log(`[Consolidator] Finished. Archived: ${archivedCount}, Survived: ${survivedCount}`);

        // Stage 5: Reporting
        await Reporter.sendDailyConsolidationReport({
            survived: survivedCount,
            archived: archivedCount,
            newSemanticGroups: Object.keys(this.semanticExtractor.getFacts().entities || {}).length
        });
    }
}

module.exports = Consolidator;
