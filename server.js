// ======================================================
// 🔒 Blackbox AI Private Server (For Personal Use Only)
// Ready for Render deployment
// ======================================================

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import { execSync } from "child_process";

// --- Auto-create package.json if missing (for Render) ---
if (!fs.existsSync("./package.json")) {
  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      {
        name: "blackbox-ai-private",
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
  console.log("📦 Auto-generated package.json");
}

// --- Local npm install (Render will skip this) ---
try {
  execSync("npm install", { stdio: "ignore" });
} catch {
  console.log("⚙️ Skipped npm install (handled by Render).");
}

// --- Express app setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Simple private access control ---
const ACCESS_KEY = process.env.ACCESS_KEY || "my_private_key"; // set your secret in Render

app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/favicon.ico") return next();
  const key = req.headers["x-access-key"];
  if (key !== ACCESS_KEY) {
    return res.status(403).json({ error: "Access denied. Invalid key." });
  }
  next();
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send(`
    <h2>✅ Blackbox AI Private Server</h2>
    <p>Only authorized users can access the API.</p>
    <p>Use POST <code>/chat</code> with header <b>x-access-key: ${ACCESS_KEY}</b> and JSON: {"prompt": "your text"}</p>
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
app.listen(PORT, () => console.log(`🚀 Private AI Server running on port ${PORT}`));
