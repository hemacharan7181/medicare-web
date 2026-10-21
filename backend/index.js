require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemma-4-31b-it";

const systemInstruction = `You are Ask AI, the MediCare hospital appointment assistant.
Reply in 2-3 short plain-text sentences.
Only help with MediCare departments, doctors and booking.
Never diagnose or prescribe.
For emergencies, tell the user to call emergency services.
Never invent availability, time slots, fees, phone numbers or working hours. For timing questions, say "Please click Book Appointment to see the available time slots."
The only doctors are:
- General Physician - Dr. Arjun Mehta (stomach, fever, cold, unclear problems)
- Cardiology - Dr. Priya Sharma (heart, chest, blood pressure)
- Dermatology - Dr. Rahul Patel (skin, hair, rashes)
Never mention other doctors.`;

app.use(cors());
app.use(express.json());

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  const normalized = history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant" || item.role === "model") &&
        typeof item.text === "string"
    )
    .slice(-6)
    .map((item) => ({
      role: item.role === "assistant" ? "model" : item.role,
      parts: [{ text: item.text.slice(0, 1000) }]
    }));

  while (normalized[0]?.role === "model") {
    normalized.shift();
  }

  return normalized;
}

async function generateWithRetry(chat, message) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await chat.sendMessage(message);
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status !== 503 || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim().slice(0, 1000)
    : "";

  if (!message) {
    return res.status(400).json({ error: "A message is required." });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "The AI service is not configured." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction
    });
    const chat = model.startChat({
      history: normalizeHistory(req.body?.history)
    });
    const result = await generateWithRetry(chat, message);
    const text = result.response.text();

    return res.json({ reply: text });
  } catch (error) {
    const status = error?.status || error?.response?.status;
    console.error("Gemini request failed:", error.message);

    if (status === 429) {
      return res.status(429).json({ error: "The AI service quota is temporarily unavailable." });
    }

    if (status === 400) {
      return res.status(400).json({ error: "The AI service could not process that request." });
    }

    return res.status(502).json({ error: "The AI service is temporarily unavailable." });
  }
});

app.listen(port, () => {
  console.log(`MediCare backend listening on port ${port}`);
});
