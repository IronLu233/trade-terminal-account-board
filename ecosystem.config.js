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
  },
  {
    name: 'account-board-worker',
    cwd: 'apps/worker',
    script: 'npm',
    args: 'start',
    watch: false,
  }
],
};
