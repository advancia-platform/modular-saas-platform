module.exports = {
  /**
   * PM2 Ecosystem Configuration for Advancia PayLedger
   * Production-ready with log rotation, environment variables, and auto-restart
   */

  apps: [
    {
      name: "advancia-backend",
      script: "./dist/index.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        LOG_LEVEL: "info",
      },
      env_file: "./backend/.env.production",
      error_file: "./backend/logs/err.log",
      out_file: "./backend/logs/out.log",
      log_file: "./backend/logs/combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      // Production optimizations
      node_args: "--max-old-space-size=1024 --optimize-for-size",
      // Health check
      health_check: {
        enabled: true,
        max_memory: "1G",
        max_restarts: 10,
        min_uptime: "10s",
      },
    },
    {
      name: "advancia-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: "./frontend/.env.production",
      error_file: "./frontend/logs/err.log",
      out_file: "./frontend/logs/out.log",
      log_file: "./frontend/logs/combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      // Production optimizations
      node_args: "--max-old-space-size=512",
    },
  ],

  /**
   * PM2 Logrotate Configuration
   * Automatically rotates logs to prevent disk space issues
   */
  logrotate: {
    max_size: "10M", // Rotate when log reaches 10MB
    retain: 7, // Keep 7 rotated log files
    compress: true, // Compress rotated logs with gzip
    dateFormat: "YYYY-MM-DD_HH-mm-ss", // Timestamp format for rotated files
    rotateInterval: "0 0 * * *", // Daily rotation at midnight
    rotateModule: true, // Enable log rotation module
  },

  /**
   * Deploy Configuration
   * For zero-downtime deployments
   */
  deploy: {
    production: {
      user: "root",
      host: "your-server-ip",
      ref: "origin/main",
      repo: "git@github.com:muchaeljohn739337-cloud/-modular-saas-platform.git",
      path: "/root/projects/advancia-pay-ledger",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
