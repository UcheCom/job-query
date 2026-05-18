import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json());

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const buildPrompt = (jobTitle) => `
Generate exactly 3 thoughtful interview questions for the role: "${jobTitle}".

Requirements:
- Questions must be professional.
- Questions must be role-specific.
- Return only the questions.
- Use a numbered list.
`;

const isRateLimitError = (error) => {
  const message = error?.message || "";

  return (
    error?.status === 429 ||
    error?.statusCode === 429 ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  );
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    model: GEMINI_MODEL,
  });
});

app.post("/api/questions", async (req, res) => {
  try {
    const { jobTitle } = req.body || {};
    const normalizedJobTitle = typeof jobTitle === "string" ? jobTitle.trim() : "";

    if (!normalizedJobTitle) {
      return res.status(400).json({
        error: "Job title is required.",
      });
    }

    if (!genAI) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const result = await model.generateContent(buildPrompt(normalizedJobTitle));
    const { response } = result;
    const questions = response.text().trim();

    if (!questions) {
      return res.status(502).json({
        error: "Gemini returned an empty response.",
      });
    }

    res.json({
      questions,
      model: GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    const status = isRateLimitError(error) ? 429 : 500;
    const message =
      status === 429
        ? "Gemini quota or rate limit reached. Try again later, or set GEMINI_MODEL to another available free-tier model."
        : "Failed to generate interview questions.";

    res.status(status).json({
      error: message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} using ${GEMINI_MODEL}`);
});
