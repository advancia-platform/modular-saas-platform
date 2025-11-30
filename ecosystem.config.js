/**
 * PM2 Ecosystem Configuration for Advancia Platform
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    // ============================================
    // Backend API Server
    // ============================================
    {
      name: "advancia-backend",
      cwd: "./backend",
      script: "dist/index.js",

      // Process Management
      instances: process.env.NODE_ENV === "production" ? "max" : 1,
      exec_mode: process.env.NODE_ENV === "production" ? "cluster" : "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Restart Strategy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",

      // Logs
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      merge_logs: true,

      // Environment Variables (shared)
      env: {
        NODE_ENV: "development",
        PORT: 4000,
      },

      // Production Environment
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },

      // Staging Environment
      env_staging: {
        NODE_ENV: "staging",
        PORT: 4000,
      },
    },

    // ============================================
    // Frontend Next.js Server (Production)
    // ============================================
    {
      name: "advancia-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",

      // Process Management
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Restart Strategy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",

      // Logs
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      merge_logs: true,

      // Environment Variables
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      env_staging: {
        NODE_ENV: "staging",
        PORT: 3000,
      },
    },

    // ============================================
    // Background Worker (Notifications, Jobs)
    // ============================================
    {
      name: "advancia-worker",
      cwd: "./backend",
      script: "dist/workers/notificationWorker.js",

      // Process Management
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Restart Strategy
      exp_backoff_restart_delay: 1000,
      max_restarts: 5,
      min_uptime: "30s",

      // Logs
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      merge_logs: true,

      // Environment Variables
      env: {
        NODE_ENV: "development",
      },

      env_production: {
        NODE_ENV: "production",
      },
    },
  ],

  // ============================================
  // Deployment Configuration
  // ============================================
  deploy: {
    production: {
      user: "deploy",
      host: ["production-server.advanciapayledger.com"],
      ref: "origin/main",
      repo: "git@github.com:advancia-platform/modular-saas-platform.git",
      path: "/var/www/advancia",
      "pre-deploy-local": "",
      "post-deploy":
        "npm ci && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },

    staging: {
      user: "deploy",
      host: ["staging-server.advanciapayledger.com"],
      ref: "origin/staging",
      repo: "git@github.com:advancia-platform/modular-saas-platform.git",
      path: "/var/www/advancia-staging",
      "post-deploy":
        "npm ci && npm run build && pm2 reload ecosystem.config.js --env staging",
      env: {
        NODE_ENV: "staging",
      },
    },
  },
};
