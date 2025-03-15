module.exports = {
    apps: [
        {
            name: 'agenda42',
            script : "npx",
            // instances: 4,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '1000M',
            env_prod: {
                NODE_ENV: 'production'
            },
            args: 'npm run start',
        }
    ]
}