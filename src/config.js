const os = require('os');
const path = require('path');

// Core Paths
const HOME_DIR = os.homedir();
const MEMORY_BASE_DIR = path.join(HOME_DIR, '.openclaw', 'v2', 'memory');
const BACKUP_DIR = path.join(HOME_DIR, '.openclaw', 'backups');

module.exports = {
    paths: {
        base: MEMORY_BASE_DIR,
        episodic: path.join(MEMORY_BASE_DIR, 'episodic'),
        procedural: path.join(MEMORY_BASE_DIR, 'procedural'),
        semantic: path.join(MEMORY_BASE_DIR, 'semantic-index'),
        metaProfile: path.join(MEMORY_BASE_DIR, 'meta-profile.json'),
        backups: BACKUP_DIR
    },
    decayRates: {
        episodic: 0.05, // lambda for tier 2
        meta: 0.01      // lambda for tier 5
    },
    thresholds: {
        consolidationDelete: 0.1,  // Delete if strength < 0.1
        workingMemoryTokens: 1400  // Limit for tier 1
    }
};
