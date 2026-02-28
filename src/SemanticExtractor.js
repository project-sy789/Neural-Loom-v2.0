const fs = require('fs');
const path = require('path');
const config = require('./config');
const llmService = require('./LLMService');

class SemanticExtractor {
    constructor() {
        this.factsPath = path.join(config.paths.semantic, 'facts.json');
        this.ensureFactsFileExists();
    }

    ensureFactsFileExists() {
        if (!fs.existsSync(this.factsPath)) {
            fs.writeFileSync(this.factsPath, JSON.stringify({ entities: {}, general_facts: [] }, null, 2));
        }
    }

    getFacts() {
        try {
            return JSON.parse(fs.readFileSync(this.factsPath, 'utf-8'));
        } catch (err) {
            console.error(`[Semantic] Could not read facts.json: ${err.message}`);
            return { entities: {}, general_facts: [] };
        }
    }

    saveFacts(factsData) {
        fs.writeFileSync(this.factsPath, JSON.stringify(factsData, null, 2));
    }

    /**
     * Extracts absolute facts from a dying episodic memory and stores them persistently.
     * @param {string} episodicMemoryContent The context of the memory
     */
    async extractAndStore(episodicMemoryContent) {
        const prompt = `
You are the Semantic Memory engine. Extract immutable facts, rules, or core entities from the following episodic memory event.
If there are no lasting facts, return empty structures.
Event: "${episodicMemoryContent}"

Expected JSON Output format:
{
  "entities": {
    "EntityName": ["Fact 1 about entity", "Fact 2 about entity"]
  },
  "general_facts": ["General rule or lesson 1"]
}
`;

        console.log(`[Semantic] Extracting meaning from memory...`);
        const extractedData = await llmService.askLLMForJSON(prompt);

        if (!extractedData) return false;

        const currentFacts = this.getFacts();

        // Merge Entities
        if (extractedData.entities) {
            for (const [entity, facts] of Object.entries(extractedData.entities)) {
                if (!currentFacts.entities[entity]) currentFacts.entities[entity] = [];
                // Deduplicate and merge
                const newFacts = facts.filter(f => !currentFacts.entities[entity].includes(f));
                currentFacts.entities[entity].push(...newFacts);
            }
        }

        // Merge General Facts
        if (extractedData.general_facts) {
            const newGenFacts = extractedData.general_facts.filter(f => !currentFacts.general_facts.includes(f));
            currentFacts.general_facts.push(...newGenFacts);
        }

        this.saveFacts(currentFacts);
        console.log(`[Semantic] Successfully merged new facts into deep memory.`);
        return true;
    }
}

module.exports = SemanticExtractor;
