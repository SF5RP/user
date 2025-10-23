const { spawn } = require("child_process");

console.log("🚀 Starting Auth Frontend (PRODUCTION)...\n");

// Build the app
console.log("🔨 Building Next.js application...");
const buildProcess = spawn("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
});

buildProcess.on("close", (code) => {
  if (code !== 0) {
    console.error("❌ Build failed");
    process.exit(1);
  }

  console.log("✅ Build completed successfully\n");

  // Start production server
  console.log(`🌐 Starting Auth Frontend...`);
  const nextApp = spawn("npm", ["run", "start"], {
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: process.env.PORT || 3000,
      HOSTNAME: "0.0.0.0", // Bind to all interfaces
    },
    shell: true,
  });

  nextApp.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[NEXT] ${output}`);
  });

  nextApp.stderr.on("data", (data) => {
    const output = data.toString().trim();
    if (output) console.error(`[NEXT ERROR] ${output}`);
  });

  nextApp.on("close", (code) => {
    console.log(`\n❌ Next.js application exited with code ${code}`);
    process.exit(code);
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Next.js...");
    nextApp.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM. Stopping Next.js...");
    nextApp.kill("SIGTERM");
  });

  console.log("\n✅ Auth Frontend running in production mode!");
  console.log(`🌐 Application: http://0.0.0.0:${process.env.PORT || 3000}`);
  console.log(
    `🔗 External access: http://[server-ip]:${process.env.PORT || 3000}`
  );
  console.log("\n💡 To stop press Ctrl+C\n");
});
