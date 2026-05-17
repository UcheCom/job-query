import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

app.post("/api/questions", async (req, res) => {
  try {
    const { jobTitle } = req.body;

    // Basic validation
    if (!jobTitle || jobTitle.trim() === "") {
      return res.status(400).json({
        error: "Job title is required.",
      });
    }

    // Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    // Prompt
    const prompt = `
Generate exactly 3 thoughtful interview questions
for the role: "${jobTitle}".

Requirements:
- Questions must be professional
- Questions must be role-specific
- Return only the questions
- Use a numbered list
`;

    // AI request
    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    // Send response to frontend
    res.json({
      questions: text,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    res.status(500).json({
      error: "Failed to generate interview questions.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});