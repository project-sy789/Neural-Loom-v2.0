const { exec } = require('child_process');
const simpleGit = require('simple-git');
const path = require('path');
const config = require('./config');

class BackupService {
    constructor() {
        this.git = simpleGit(config.paths.base);
    }

    /**
     * Commit memory changes to the local Git repository
     */
    async autoCommit(message = 'chore: auto-commit memory update') {
        try {
            console.log(`[Backup] Running Git auto-commit...`);
            await this.git.add('.');
            const status = await this.git.status();

            if (status.staged.length > 0 || status.not_added.length > 0 || status.modified.length > 0 || status.deleted.length > 0) {
                await this.git.commit(message);
                console.log(`[Backup] Successfully committed changes to memory repository.`);
            } else {
                console.log(`[Backup] No changes to commit.`);
            }
        } catch (error) {
            console.error(`[Backup Git Error] ${error.message}`);
        }
    }

    /**
     * Create a compressed tarball backup
     */
    createTarBackup() {
        console.log(`[Backup] Generating tarball backup...`);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tarFileName = `memory-backup-${timestamp}.tar.gz`;
        const tarPath = path.join(config.paths.backups, tarFileName);

        // Compress the v2/memory directory
        const command = `tar -czf "${tarPath}" -C "${path.dirname(config.paths.base)}" "${path.basename(config.paths.base)}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[Backup Tar Error] ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`[Backup Tar Stderr] ${stderr}`);
                return;
            }
            console.log(`[Backup] Tar archive created at ${tarPath}`);
        });
    }

    /**
     * Remote Push (Requires configured git remote and token)
     */
    async pushToRemote() {
        try {
            console.log(`[Backup] Attempting generic git push...`);
            await this.git.push();
            console.log(`[Backup] Pushed to remote successfully.`);
        } catch (error) {
            console.log(`[Backup Push Notice] Could not push to remote. Ensure origin and token are set. (${error.message})`);
        }
    }
}

module.exports = BackupService;
