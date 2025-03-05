module.exports = {
  apps: [{
    name: 'account-board',
    cwd: 'apps/backend',
    script: 'npm',
    args: 'start',
    watch: false,
    env: {
      PORT: 5006
    }
  }],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'pre-deploy': 'bun run --filter "*" build',
      'post-deploy': 'cd apps/backend && bun install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
