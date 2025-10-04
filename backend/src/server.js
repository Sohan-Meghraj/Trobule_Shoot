import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Utils
import { buildVocab, preprocessQuery } from "./utils/preprocess.js";
import { createSearchIndex, findBestMatch } from "./utils/search.js";
const PORT = process.env.PORT || 4000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------
   Helper: Match Acceptance
   ------------------------------------------------------------------ */
function shouldAcceptMatch(bestMatch, processedQuery, threshold = 0.55) {
  if (!bestMatch || typeof bestMatch.confidence !== "number") return false;

  if (bestMatch.confidence >= threshold) return true;

  if (
    bestMatch.entry.error &&
    bestMatch.entry.error.toLowerCase() === processedQuery.toLowerCase()
  ) {
    return true;
  }

  return false;
}

/* ------------------------------------------------------------------
   Main Server Class
   ------------------------------------------------------------------ */
class TroubleshootServer {
  constructor() {
    this.app = express();
    this.kb = [];
    this.vocabulary = [];
    this.searchIndex = null;

    this.setupMiddleware();
    this.loadKnowledgeBase();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(
      cors({
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    this.app.use((req, res, next) => {
      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.path}`,
        req.body && Object.keys(req.body).length > 0
          ? `\n   Body: ${JSON.stringify(req.body)}`
          : ""
      );
      next();
    });
  }

  loadKnowledgeBase() {
    try {
      const kbPath = path.join(__dirname, "kb.json");
      console.log(`📖 Loading KB from: ${kbPath}`);

      if (!fs.existsSync(kbPath)) {
        throw new Error(`KB file not found at ${kbPath}`);
      }

      const kbData = fs.readFileSync(kbPath, "utf8");
      this.kb = JSON.parse(kbData);

      this.vocabulary = buildVocab(this.kb);
      this.searchIndex = createSearchIndex(this.kb);

      console.log(`✅ KB loaded: ${this.kb.length} entries`);
      console.log(`📚 Vocabulary size: ${this.vocabulary.length}`);
    } catch (error) {
      console.error("❌ Failed to load KB:", error.message);
      process.exit(1);
    }
  }

  setupRoutes() {
    this.app.get("/api/health", (req, res) => {
      res.json({
        status: "healthy",
        kbEntries: this.kb.length,
        vocabularySize: this.vocabulary.length,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get("/api/kb", (req, res) => {
      res.json({
        entries: this.kb.length,
        categories: [
          ...new Set(this.kb.map((entry) => entry.error.split(" ")[0])),
        ],
        lastUpdated: new Date().toISOString(),
      });
    });

    this.app.post("/api/ask", (req, res) => {
      try {
        if (!req.body || typeof req.body !== "object") {
          return res.status(400).json({
            error: "Invalid JSON in request body",
            found: false,
          });
        }

        const { query } = req.body;
        if (!query || query.trim().length === 0) {
          return res.status(400).json({
            error: "Query is required",
            found: false,
          });
        }

        const originalQuery = query.trim();
        const processedQuery = preprocessQuery(originalQuery, this.vocabulary);

        console.log(`🔍 Query: "${originalQuery}" -> Processed: "${processedQuery}"`);

        const bestMatch = findBestMatch(processedQuery, this.searchIndex, this.kb);

        if (bestMatch && shouldAcceptMatch(bestMatch, processedQuery)) {
          console.log(
            `✅ Match found: "${bestMatch.entry.error}" (confidence: ${bestMatch.confidence.toFixed(
              2
            )})`
          );

          return res.json({
            found: true,
            confidence: Math.round(bestMatch.confidence * 100) / 100,
            error: bestMatch.entry.error,
            solution: bestMatch.entry.solution,
            matchStrategy: bestMatch.strategy,
            processedQuery,
          });
        } else {
          console.log(`❌ No confident match for: "${originalQuery}"`);
          this.logUnknownQuery(originalQuery);

          return res.json({
            found: false,
            confidence: 0,
            error: "Solution Not Available",
            solution: [
              "I don't have a solution for this issue in my knowledge base.",
              "Please contact IT support at support@company.com.",
              "You can also try rephrasing your query or checking for typos.",
            ],
            processedQuery,
          });
        }
      } catch (error) {
        console.error("🚨 Server error in /api/ask:", error);
        res.status(500).json({
          error: "Internal server error: " + error.message,
          found: false,
        });
      }
    });

    this.app.get("/", (req, res) => {
      res.json({
        message: "🚀 Troubleshoot AI Server is running",
        endpoints: {
          health: "GET /api/health",
          kbInfo: "GET /api/kb",
          ask: "POST /api/ask",
        },
        version: "1.0.0",
      });
    });
  }

  logUnknownQuery(query) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        query: query.trim(),
        processed: preprocessQuery(query, this.vocabulary),
      };

      const logPath = path.join(process.cwd(), "unknowns.log");
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n");
    } catch (error) {
      console.error("⚠️ Failed to log unknown query:", error.message);
    }
  }

  start(port = 4000) {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log("📊 Endpoints:");
        console.log("   GET  /api/health");
        console.log("   GET  /api/kb");
        console.log("   POST /api/ask");
        console.log("   GET  /");
        resolve(this.server);
      });

      this.server.on("error", (err) => {
        console.error("❌ Server failed:", err);
        reject(err);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log("🛑 Server stopped");
    }
  }
}

/* ------------------------------------------------------------------
   Bootstrap
   ------------------------------------------------------------------ */
const server = new TroubleshootServer();
server.start(PORT).catch(console.error);

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT - shutting down...");
  server.stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM - shutting down...");
  server.stop();
  process.exit(0);
});

export default TroubleshootServer;
