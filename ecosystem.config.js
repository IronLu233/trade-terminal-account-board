module.exports = {
  apps: [
    {
      name: "account-board-v2",
      cwd: "apps/backend",
      script: "npm",
      args: "start",
      watch: false,
      env: {
        PORT: 5006,
      },
    },
    {
      name: "account-board-worker-v2",
      cwd: "apps/worker",
      script: "npm",
      args: "start",
      watch: false,
    },
  ],
  deploy: {
    app: {
      host: ['arb04'],
      ref: "origin/v2",
      repo: "git@github.com:IronLu233/trade-terminal-account-board.git",
      path: "/home/ubuntu/bull-dashboard-app",
      "post-deploy":
        "source ~/.zshrc && bun install && bun run build && pm2 startOrRestart ecosystem.config.js --only account-board-v2",
    },
    worker: {
      host: ["arb06", "arb07", "arb08", "soloserver"],
      ref: "origin/v2",
      repo: "git@github.com:IronLu233/trade-terminal-account-board.git",
      path: "/home/ubuntu/bull-dashboard-worker",
      "post-deploy":
        "source ~/.zshrc && bun install && pm2 startOrRestart ecosystem.config.js --only account-board-worker-v2",
    },
  },
};
