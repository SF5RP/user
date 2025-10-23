module.exports = {
  apps: [
    {
      name: "auth-frontend",
      script: "start-prod.js",
      cwd: process.env.PWD || process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 12413,
        NEXT_PUBLIC_API_URL: "http://localhost:12410",
      },
      error_file: "/home/deploy/user-service/logs/frontend-error.log",
      out_file: "/home/deploy/user-service/logs/frontend-out.log",
      time: true,
    },
  ],
};
