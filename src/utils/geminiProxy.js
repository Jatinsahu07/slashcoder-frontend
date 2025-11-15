// src/utils/geminiProxy.js
import { API_BASE } from "../config";

// -----------------------------------------------------
// ✅ Helper: Safe URL Builder
// -----------------------------------------------------
function buildURL(endpoint) {
  if (!API_BASE || API_BASE === "undefined") {
    console.error("❌ API_BASE is undefined — Slash AI cannot connect.");
    return null;
  }
  return `${API_BASE}${endpoint}`;
}

// -----------------------------------------------------
// 🤖 Ask Gemini (Non-Streaming)
// -----------------------------------------------------
export async function askGemini(prompt) {
  const url = buildURL("/ai/tutor");
  if (!url) return "⚠️ Slash AI backend unavailable.";

  try {
    console.log("📤 Sending to Slash AI:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    return data.response || "⚠️ Slash AI returned no response.";
  } catch (err) {
    console.error("Slash AI error:", err);
    return "⚠️ Slash AI is unavailable.";
  }
}

// -----------------------------------------------------
// ⚡ Streaming Gemini (Incremental Tokens)
// -----------------------------------------------------
export async function streamGemini(prompt, onChunk) {
  const url = buildURL("/ai/tutor/stream");
  if (!url) {
    onChunk("⚠️ Slash AI backend unavailable.");
    return;
  }

  try {
    console.log("📤 Streaming from Slash AI:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    // No streaming available
    if (!res.body) {
      onChunk("⚠️ No stream body from server.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const textChunk = decoder.decode(value, { stream: true });

      // Only process if chunk has content
      if (textChunk?.trim()) {
        onChunk(textChunk);
      }
    }
  } catch (err) {
    console.error("Slash AI stream error:", err);
    onChunk("⚠️ Slash AI streaming failed.");
  }
}
