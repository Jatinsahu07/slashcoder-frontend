// src/utils/geminiProxy.js
import { API_BASE } from "../config";

// Ask Gemini (non-stream)
export async function askGemini(prompt) {
  try {
    const res = await fetch(`${API_BASE}/ai/tutor`, {
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

// Streaming Gemini
export async function streamGemini(prompt, onChunk) {
  try {
    const res = await fetch(`${API_BASE}/ai/tutor/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.body) {
      onChunk("⚠️ No stream body from server.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk(fullText);
    }
  } catch (err) {
    console.error("Slash AI stream error:", err);
    onChunk("⚠️ Slash AI streaming failed.");
  }
}
