// ==============================
// Blackbox AI Integration Server
// Ready for Render deployment
// ==============================

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { execSync } from "child_process";
import fs from "fs";

// --- Auto-create package.json if missing ---
if (!fs.existsSync("./package.json")) {
  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      {
        name: "blackbox-ai-server",
        version: "1.0.0",
        main: "server.js",
        type: "module",
        scripts: {
          start: "node server.js"
        },
        dependencies: {
          cors: "^2.8.5",
          express: "^4.19.2",
          "node-fetch": "^3.3.2"
        }
      },
      null,
      2
    )
  );
  console.log("📦 Created package.json automatically!");
}

// --- Ensure dependencies are installed when running locally ---
try {
  execSync("npm install", { stdio: "ignore" });
} catch (e) {
  console.log("⚠️ Skipped npm install (Render will handle it).");
}

// --- App setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Root route ---
app.get("/", (req, res) => {
  res.send(`
    <h1>✅ Blackbox AI API Server</h1>
    <p>Server is running successfully.</p>
    <p>Use POST <code>/chat</code> with JSON: {"prompt": "your message"}</p>
  `);
});

// --- Chat route ---
app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt)
      return res.status(400).json({ error: "Missing prompt in request body." });

    const response = await fetch("https://www.blackbox.ai/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    res.json({
      prompt,
      reply: data.reply || data.message || data,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
