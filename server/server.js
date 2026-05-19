import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json());

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
  const statusText = error?.statusText || "";

  return (
    error?.status === 429 ||
    error?.statusCode === 429 ||
    statusText === "RESOURCE_EXHAUSTED" ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  );
};

const isAuthError = (error) => {
  const message = (error?.message || "").toLowerCase();
  const statusText = (error?.statusText || "").toLowerCase();

  return (
    error?.status === 401 ||
    error?.statusCode === 401 ||
    error?.status === 403 ||
    error?.statusCode === 403 ||
    statusText === "unauthenticated" ||
    statusText === "permission_denied" ||
    message.includes("api key") ||
    message.includes("forbidden") ||
    message.includes("leaked")
  );
};

const buildGeminiApiUrl = () => {
  const modelPath = GEMINI_MODEL.startsWith("models/") ? GEMINI_MODEL : `models/${GEMINI_MODEL}`;
  const apiKey = encodeURIComponent(process.env.GEMINI_API_KEY);

  return `${GEMINI_API_BASE_URL}/${modelPath}:generateContent?key=${apiKey}`;
};

const extractText = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim() || "";

const generateQuestions = async (jobTitle) => {
  const response = await fetch(buildGeminiApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildPrompt(jobTitle),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError = new Error(
      data?.error?.message || `Gemini request failed with status ${response.status}`,
    );
    apiError.status = response.status;
    apiError.statusCode = response.status;
    apiError.statusText = data?.error?.status || response.statusText;
    throw apiError;
  }

  return extractText(data);
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
    const MAX_JOB_TITLE_LENGTH = 120;

    if (!normalizedJobTitle) {
      return res.status(400).json({
        error: "Job title is required.",
      });
    }

    if (normalizedJobTitle.length > MAX_JOB_TITLE_LENGTH) {
      return res.status(400).json({
        error: `Job title must be at most ${MAX_JOB_TITLE_LENGTH} characters or fewer.`,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    const questions = await generateQuestions(normalizedJobTitle);

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
    const status = isAuthError(error) ? 403 : isRateLimitError(error) ? 429 : 500;
    const message =
      status === 403
        ? "Gemini rejected the API key. Create a new Gemini API key, update server/.env, and keep the file out of Git."
        : status === 429
          ? "Gemini quota or rate limit reached. Try again later, or set GEMINI_MODEL to another available free-tier model."
          : "Failed to generate interview questions.";

    console.error("Gemini API Error:", {
      status,
      message: error?.message,
    });

    res.status(status).json({
      error: message,
    });
  }
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} using ${GEMINI_MODEL}`);
  });
}
