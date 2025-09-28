import fs from "fs";
import path from "path";
import { Session } from "../models/candidate";

const DB_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: {} }, null, 2), "utf-8");

function loadDb(): { sessions: Record<string, Session> } {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { sessions: {} };
  }
}

function saveDb(db: { sessions: Record<string, Session> }) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export const storage = {
  saveSession(id: string, session: Session) {
    const db = loadDb();
    db.sessions[id] = session;
    saveDb(db);
  },

  getSession(id: string): Session | null {
    const db = loadDb();
    return db.sessions[id] ?? null;
  },

  listSessions(): Session[] {
    const db = loadDb();
    return Object.values(db.sessions);
  },

  deleteSession(id: string) {
    const db = loadDb();
    delete db.sessions[id];
    saveDb(db);
  },
};
