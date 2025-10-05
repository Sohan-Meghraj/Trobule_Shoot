// src/services/api.js
const DEFAULT_API_BASE = "http://localhost:4000";

/**
 * Utility: timeout a promise
 */
function withTimeout(promise, ms = 10000) {
  let timeout;
  const timer = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("TIMEOUT_ERROR")), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}

/**
 * Utility: retry logic with exponential backoff
 */
async function fetchWithRetry(url, options, retries = 2, backoff = 500) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      console.warn(`⚠️ Fetch failed, retrying in ${backoff}ms... (${retries} left)`);
      await new Promise((res) => setTimeout(res, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

class TroubleshootAPI {
  constructor(baseURL) {
    // Use Vite env var first, fallback to provided or default
    // IMPORTANT: Vite exposes env variables via import.meta.env.VITE_*
    this.baseURL = import.meta.env.VITE_API_BASE || baseURL || DEFAULT_API_BASE;
  }

  /**
   * Send troubleshooting query
   */
  async askQuestion(query) {
    console.log("🚀 Sending query:", query);

    if (!query || query.trim().length === 0) {
      return {
        found: false,
        error: "Invalid Query",
        solution: ["Please enter a valid issue description."],
      };
    }

    try {
      const response = await withTimeout(
        fetchWithRetry(`${this.baseURL}/api/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        }),
        10000 // 10s timeout
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("❌ Server error response:", text || response.status);

        return {
          found: false,
          error: `Server Error ${response.status}`,
          solution: [
            "The troubleshooting service encountered an issue.",
            "Please try again later or contact IT support.",
          ],
        };
      }

      const data = await response.json();
      console.log("✅ API Response received:", data);

      // Normalize response to always have same shape
      return {
        found: Boolean(data.found),
        error: data.error || (data.found ? "Solution" : "No answer"),
        solution: Array.isArray(data.solution) ? data.solution : (typeof data.solution === "string" ? [data.solution] : ["No solution provided."]),
        confidence: Number.isFinite(data.confidence) ? data.confidence : null,
        matchStrategy: data.matchStrategy ?? null,
        processedQuery: data.processedQuery ?? query.trim(),
      };
    } catch (error) {
      console.error("💥 API Call failed:", error);

      if (error.message === "TIMEOUT_ERROR") {
        return {
          found: false,
          error: "Timeout",
          solution: [
            "The request took too long to respond.",
            "Please check your connection or try again later.",
          ],
        };
      }

      if (error.message.includes("Failed to fetch") || error.message.includes("Network")) {
        return {
          found: false,
          error: "Network Error",
          solution: [
            "Unable to reach the troubleshooting server.",
            "Please verify your internet connection.",
          ],
        };
      }

      return {
        found: false,
        error: "Unexpected Error",
        solution: ["An unknown error occurred. Please try again later."],
      };
    }
  }

  async getHealth() {
    try {
      const response = await withTimeout(fetch(`${this.baseURL}/api/health`), 5000);
      if (!response.ok) return { status: "unhealthy", error: `Server responded ${response.status}` };
      return await response.json();
    } catch (error) {
      console.error("💔 Health check failed:", error.message);
      return { status: "unhealthy", error: error.message };
    }
  }
}

export const api = new TroubleshootAPI();
