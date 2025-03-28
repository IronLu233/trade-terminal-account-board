module.exports = {
  apps: [
    {
      name: "account-board",
      cwd: "apps/backend",
      script: "npm",
      args: "start",
      watch: false,
      env: {
        PORT: 5006,
      },
    },
    {
      name: "account-board-worker",
      cwd: "apps/worker",
      script: "npm",
      args: "start",
      watch: false,
    },
  ],
  deploy: {
    app: {
      user: "ubuntu",
      host: ['35.74.195.20'],
      ref: "origin/v2",
      repo: "git@github.com:IronLu233/trade-terminal-account-board.git",
      path: "/home/ubuntu/bull-dashboard-app",
      "post-deploy":
        "export PATH=$HOME/.bun/bin:$PATH && bun install && bun run build && pm2 startOrRestart ecosystem.config.js --only account-board",
    },
    worker: {
      user: "ubuntu",
      host: ["3.115.99.150", "3.115.219.178", "52.197.123.66"],
      ref: "origin/v2",
      repo: "git@github.com:IronLu233/trade-terminal-account-board.git",
      path: "/home/ubuntu/bull-dashboard-worker",
      "post-deploy":
        "export PATH=$HOME/.bun/bin:$PATH && bun install && pm2 startOrRestart ecosystem.config.js --only account-board-worker",
    },
  },
};
