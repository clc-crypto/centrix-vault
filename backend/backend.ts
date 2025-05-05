import express from "express";
import CORS from "cors";
import fs from "fs";
import { SHA256 } from "crypto-js";

const app = express();

app.use(CORS());
app.use(express.json());

const sessions: Record<string, string> = fs.existsSync("./sessions.json") ? JSON.parse(fs.readFileSync("./sessions.json", "utf-8")) : {};

function saveWallet(wallets: any) {
  fs.writeFileSync("./wallets.json", JSON.stringify(wallets, null, 2));
}

function saveSessions() {
  fs.writeFileSync("./sessions.json", JSON.stringify(sessions, null, 2));
}

// @ts-ignore
app.get("/login", (req, res) => {
  try {
    const username = req.query.username as string;
    const password = req.query.password as string;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const wallets = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"));

    for (const usernm in wallets) {
      const user = wallets[usernm];
      if (username === usernm &&SHA256(password).toString() === user.password) {
        for (const sessionId in sessions) {
          if (sessions[sessionId] === usernm) {
            delete sessions[sessionId];
          }
        }
    
        // Create new session
        const sessionId = crypto.randomUUID();
        sessions[sessionId] = username;
        saveSessions();
        
        return res.json({ session: sessionId });
      }
    }
    res.status(401).json({ error: "User or password is invalid." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// @ts-ignore
app.get("/register", (req, res) => {
  try {
    const username = req.query.username as string;
    const password = req.query.password as string;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const wallets = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"));
    if (wallets[username]) return res.json({ error: "This username is alredy taken." });

    wallets[username] = {
      coins: [],
      transactionRecord: [],
      password: SHA256(password).toString()
    };
    saveWallet(wallets);
    res.status(401).json({ message: "success" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// @ts-ignore
app.get("/get-data", (req, res) => {
  const session = req.query.session as string;

  if (!session) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  if (!sessions[session]) {
    return res.status(401).json({ error: "Invalid session." });
  }

  const wallet = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"))[sessions[session]];
  delete wallet.password;
  res.json({ wallet });
});

// @ts-ignore
app.get("/set-data", (req, res) => {
  try {
    const session = req.query.session as string;
  const wallet = req.query.wallet as string;

  if (!session) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  if (!sessions[session]) {
    return res.status(401).json({ error: "Invalid session." });
  }
  const wallets = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"));
  const pass = wallets[sessions[session]].password;
  wallets[sessions[session]] = JSON.parse(wallet);
  wallets[sessions[session]].password = pass;
  saveWallet(wallets);
  res.json({ message: "success" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
