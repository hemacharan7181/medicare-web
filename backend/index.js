require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;
// Keep this configurable because Gemini model availability can vary by project.
// The previous default (gemma-4-31b-it) is not a Gemini API model, which caused
// every chat request to fail before a response could be generated.
const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";

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

function getInstantReply(message) {
  const text = message.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(text)) {
    return "Hello! I can help you choose a MediCare doctor or book a demo appointment. What would you like help with?";
  }

  if (/emergency|ambulance|cant breathe|cannot breathe|severe bleeding|unconscious/.test(text)) {
    return "This may be an emergency. Please call your local emergency services now or go to the nearest emergency department.";
  }

  if (/constipat|stomach|abdominal|fever|cold|cough|flu|headache|general physician/.test(text)) {
    return "Dr. Arjun Mehta, our General Physician, is the best match for this concern. Please click Book Appointment to see the available demo time slots.";
  }

  if (/chest|heart|cardio|blood pressure|bp\b|palpitation/.test(text)) {
    return "Dr. Priya Sharma in Cardiology is the best match for heart or blood-pressure concerns. Please click Book Appointment to see the available demo time slots.";
  }

  if (/skin|rash|acne|hair|dermat|itch/.test(text)) {
    return "Dr. Rahul Patel in Dermatology is the best match for skin, hair, or rash concerns. Please click Book Appointment to see the available demo time slots.";
  }

  if (/book|appointment|slot|time|available|doctor|specialt|help|what can you/.test(text)) {
    return "You can book a demo appointment with Dr. Arjun Mehta, Dr. Priya Sharma, or Dr. Rahul Patel. Click Book Appointment to choose a doctor, date, and available time slot.";
  }

  return null;
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("AI request timed out")), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function generateWithRetry(chat, message) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await withTimeout(chat.sendMessage(message), 8000);
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status !== 503 || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(apiKey), model: modelName });
});

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim().slice(0, 1000)
    : "";

  if (!message) {
    return res.status(400).json({ error: "A message is required." });
  }

  // Keep the hospital assistant responsive for the questions it is designed to
  // answer. These common requests do not need a slow external model request.
  const instantReply = getInstantReply(message);
  if (instantReply) {
    return res.json({ reply: instantReply, source: "instant" });
  }

  if (!apiKey) {
    return res.json({
      reply: "I can help with MediCare doctors and demo appointment booking. Please click Book Appointment to choose a doctor and time slot.",
      source: "fallback"
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.2
      }
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

    return res.json({
      reply: "I can help with MediCare doctors and demo appointment booking. Please click Book Appointment to choose a doctor and time slot.",
      source: "fallback"
    });
  }
});

app.listen(port, () => {
  console.log(`MediCare backend listening on port ${port}`);
});
