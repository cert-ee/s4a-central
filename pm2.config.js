module.exports = {
    apps: [
        {
            name: 's4a-central-api-server',
            cwd: './server',
            script: './server/server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                MONGODB_HOST: process.env.MONGODB_HOST,
                MONGODB_PORT: process.env.MONGODB_PORT,
                MONGODB_DATABASE: process.env.MONGODB_DATABASE,
                MONGODB_USER: process.env.MONGODB_USER,
                MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
                SHELL: '/bin/bash',
                API_HOST: process.env.API_HOST,
                API_PORT: process.env.API_PORT,
                API_REST_ROOT_URL: process.env.API_REST_ROOT_URL,
                URL_FEEDBACK_FAQ: process.env.URL_FEEDBACK_FAQ,
                URL_SURICATA_EM_RULES: process.env.URL_SURICATA_EM_RULES,
                PATH_BASE: process.env.PATH_BASE,
                PATH_SURICATA_ALERTS: process.env.PATH_SURICATA_ALERTS,
                DEBUG: process.env.DEBUG,
                DEBUG_LEVEL: process.env.DEBUG_LEVEL
            }
        },
        {
            name: 's4a-central-client',
            cwd: './client',
            interpreter: '/bin/sh',
            script: 'yarn',
            args: 'prodenv',
            env: {
                NODE_ENV: 'production',
                API_URL: process.env.API_URL,
                API_URL_BROWSER: process.env.API_URL_BROWSER,
                URL_GRAFANA: process.env.URL_GRAFANA,
                URL_FEEDBACK_FAQ: process.env.URL_FEEDBACK_FAQ,
                DEBUG: process.env.DEBUG,
                DEBUG_LEVEL: process.env.DEBUG_LEVEL
            }
        }
    ]
}
