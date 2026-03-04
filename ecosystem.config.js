module.exports = {
    apps: [
        {
            name: 'neural-loom',
            script: 'index.js',
            cwd: __dirname,
            watch: false,
            autorestart: true,
            restart_delay: 5000,
            max_restarts: 10,
            env: {
                NODE_ENV: 'production'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            out_file: `${process.env.HOME}/.openclaw/v2/memory/logs/neural-loom-out.log`,
            error_file: `${process.env.HOME}/.openclaw/v2/memory/logs/neural-loom-err.log`,
            merge_logs: true
        }
    ]
};
