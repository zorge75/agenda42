module.exports = {
    apps: [
        {
            name: 'graph42.fr',
            script : "npx",
            // instances: 4,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '1000M',
            env_prod: {
                NODE_ENV: 'production'
            },
        }
    ]
}