import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment secrets.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const SYSTEM_INSTRUCTION = `You are Hayat AI, an intelligent, reliable, and thoughtful assistant designed to help users learn, create, solve problems, and achieve their goals.

Your mission is to provide accurate, practical, and easy-to-understand assistance while encouraging curiosity, growth, and independent thinking.

Core Personality:
* Intelligent and knowledgeable.
* Calm, confident, and respectful.
* Friendly without being overly casual.
* Honest when uncertain.
* Focused on helping users succeed.

Behavior Rules:
* Give direct answers first, then provide details if needed.
* Break down complex topics into simple steps.
* Encourage learning rather than doing all the thinking for the user.
* Ask clarifying questions when important information is missing.
* Provide structured responses using headings, bullet points, and examples when helpful.
* Never invent facts or pretend to know something when uncertain.
* Prioritize accuracy over sounding confident.

Special Capabilities:
* Study assistance and tutoring.
* Science and medical education.
* Coding and technology help.
* Writing and communication support.
* Business and entrepreneurship guidance.
* Productivity and goal planning.
* Creative brainstorming and idea generation.

Response Style:
* Clear and concise.
* Professional but approachable.
* Motivating and future-focused.
* Adapt explanations to the user's level of knowledge.

When helping users:
1. Understand their goal.
2. Explain the solution clearly.
3. Give actionable next steps.
4. Suggest improvements or alternatives when useful.`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentWithRetry(
  ai: any,
  contents: any,
  model: string,
  systemInstruction: string,
  retriesLeft = 1,
  delayMs = 500
): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
    return response;
  } catch (error: any) {
    const errorMessage = error.message || "";
    console.warn(`Error generating content with model ${model} (retries left: ${retriesLeft}):`, errorMessage);
    
    const status = error.status || error.code || error.error?.code || error.error?.status;
    const isTransientError = 
      status === 503 || 
      status === 429 || 
      errorMessage.includes("503") || 
      errorMessage.includes("429") || 
      errorMessage.includes("UNAVAILABLE") || 
      errorMessage.includes("high demand") || 
      errorMessage.includes("ResourceExhausted") ||
      errorMessage.includes("temporary");

    if (isTransientError && retriesLeft > 0) {
      console.log(`Retrying in ${delayMs}ms due to transient error...`);
      await delay(delayMs);
      return generateContentWithRetry(ai, contents, model, systemInstruction, retriesLeft - 1, delayMs * 2);
    }
    throw error;
  }
}

// API routes first
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format. Must be an array." });
    }

    const ai = getGeminiClient();

    // Map conversation history to Gemini content structure
    // Role must be 'user' or 'model'
    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const MODELS_TO_TRY = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash"
    ];

    let response;
    let usedModel = "";
    let lastError: any = null;

    for (const model of MODELS_TO_TRY) {
      try {
        console.log(`Attempting to generate content with ${model}...`);
        // We use 1 retry for each model to keep response times snappy while still catching momentary blips
        response = await generateContentWithRetry(ai, formattedContents, model, SYSTEM_INSTRUCTION, 1, 500);
        usedModel = model;
        break; // Success, break out of loop!
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed: ${err.message || err}. Trying next in sequence...`);
      }
    }

    if (!response) {
      console.error("All Gemini models failed. Last error:", lastError);
      throw new Error(
        "All available Gemini models are currently experiencing high demand. Please try again in a few seconds."
      );
    }

    const text = response.text || "I am sorry, but I couldn't generate a response.";
    return res.json({ text, model: usedModel });
  } catch (error: any) {
    console.error("Gemini API Error in route:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while contacting the AI service.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
