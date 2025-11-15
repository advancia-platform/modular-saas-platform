module.exports = {
  apps: [
    {
      name: "advvancia-backend",
      script: "src/index.js",
      instances: 1, // or "max" for clustering
      exec_mode: "fork", // "cluster" if you want multi-core scaling
      watch: false, // disable in production for stability (override in env_development)
      max_memory_restart: "500M", // auto-restart if memory exceeds limit
      restart_delay: 5000, // wait 5s before restarting after crash
      autorestart: true,
      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
        watch: true, // enable watch in dev mode
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
        watch: false, // disable watch in production
      },
      error_file: "./logs/err.log", // error logs
      out_file: "./logs/out.log", // standard output logs
      log_file: "./logs/combined.log", // unified log file
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // PM2 Health Check Module
      // Requires: npm install pm2-health OR pm2 install pm2-health
      // This will ping your /api/health endpoint and restart if unhealthy
      health_check: {
        url: "http://localhost:4000/api/health",
        interval: 30000, // 30 seconds between checks
        timeout: 5000, // 5 seconds before considering it failed
        max_retries: 3, // restart after 3 consecutive failures
        restart_on_unhealthy: true,
      },
    },
  ],
};
