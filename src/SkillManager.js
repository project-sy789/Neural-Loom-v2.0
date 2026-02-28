const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Procedural Memory Manager (Tier 4)
 * Handles learning and recalling step-by-step instructions or skills.
 */
class SkillManager {
    constructor() {
        this.baseDir = config.paths.procedural;
    }

    /**
     * Save a new skill or procedure
     * @param {string} skillName Unique name for the skill (e.g., "nginx_backup")
     * @param {Array<string>} steps Array of string instructions
     */
    saveSkill(skillName, steps) {
        const safeName = skillName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const skillPath = path.join(this.baseDir, `${safeName}.json`);

        const skillData = {
            name: skillName,
            steps: steps,
            learned_at: new Date().toISOString(),
            last_used: new Date().toISOString(),
            usage_count: 0
        };

        fs.writeFileSync(skillPath, JSON.stringify(skillData, null, 2));
        console.log(`[Tier 4] Skill saved: ${skillName}`);
        return skillData;
    }

    /**
     * Recall a skill to execute
     * @param {string} skillName The name of the skill to fetch
     */
    recallSkill(skillName) {
        const safeName = skillName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
        const skillPath = path.join(this.baseDir, `${safeName}.json`);

        if (!fs.existsSync(skillPath)) {
            console.log(`[Tier 4] Skill not found: ${skillName}`);
            return null;
        }

        const skillData = JSON.parse(fs.readFileSync(skillPath, 'utf-8'));

        // Update freshness
        skillData.last_used = new Date().toISOString();
        skillData.usage_count += 1;
        fs.writeFileSync(skillPath, JSON.stringify(skillData, null, 2));

        console.log(`[Tier 4] Recalled skill: ${skillName}`);
        return skillData;
    }
}

module.exports = SkillManager;
