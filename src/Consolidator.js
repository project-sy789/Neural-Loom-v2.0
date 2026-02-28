const fs = require('fs');
const path = require('path');
const config = require('./config');

class Consolidator {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
    }

    /**
     * Run the daily consolidation and pruning
     */
    runDaily() {
        console.log(`[Consolidator] Running daily consolidation at ${new Date().toISOString()}`);

        // Scans episodic memories
        const files = fs.readdirSync(config.paths.episodic)
            .filter(f => f.endsWith('.json'));

        let deletedCount = 0;
        let survivedCount = 0;

        files.forEach(file => {
            const memoryPath = path.join(config.paths.episodic, file);
            try {
                const memoryData = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
                const currentStrength = this.memoryManager.calculateStrength(memoryData, config.decayRates.episodic);

                // Update the memory file with the new strength
                memoryData.strength = currentStrength;

                if (currentStrength < config.thresholds.consolidationDelete) {
                    console.log(`[Consolidator] Deleting memory ${memoryData.id} (strength: ${currentStrength.toFixed(4)} < ${config.thresholds.consolidationDelete})`);
                    fs.unlinkSync(memoryPath);
                    deletedCount++;
                } else {
                    fs.writeFileSync(memoryPath, JSON.stringify(memoryData, null, 2));
                    survivedCount++;
                }
            } catch (err) {
                console.error(`[Consolidator] Error processing memory ${file}: ${err.message}`);
            }
        });

        // Update Meta Profile Decay
        const metaProfile = this.memoryManager.getMetaProfile();
        if (metaProfile) {
            const metaStrength = this.memoryManager.calculateStrength({
                last_rehearsed: metaProfile.last_updated || metaProfile.created_at,
                initial_entropy: metaProfile.strength || 1.0
            }, config.decayRates.meta);

            this.memoryManager.updateMetaProfileProfile({
                strength: Math.max(0.01, metaStrength), // Meta profile doesn't drop below 0.01
                last_consolidated: new Date().toISOString()
            });
        }

        console.log(`[Consolidator] Finished. Deleted: ${deletedCount}, Survived: ${survivedCount}`);
    }
}

module.exports = Consolidator;
