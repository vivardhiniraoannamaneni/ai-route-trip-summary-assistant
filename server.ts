import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in the operations server. Please configure it in your Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for Trip Briefing Generation
app.post("/api/generate-briefing", async (req, res) => {
  try {
    const {
      tripId,
      pickupLocation,
      deliveryLocation,
      vehicleType,
      cargoType,
      cargoWeight,
      departureTime,
      estimatedDistance,
      driverName,
      specialInstructions,
    } = req.body;

    // Validate inputs
    if (!pickupLocation || !deliveryLocation || !vehicleType) {
      return res.status(400).json({ error: "Missing required fields: pickup location, delivery location, and vehicle type are mandatory." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert logistics coordinator and route surveyor specializing in freight dispatch, truck driver briefing, and safety planning.
Analyze the trip details carefully to provide accurate, realistic, and highly actionable briefings.
Use your geographical knowledge and logistics expertise to predict challenges, routes, toll roads, and safety precautions matching the cargo and vehicle weight.

- Map route details realistically if possible or describe typical logistics routes.
- Address the driver by name if provided.
- Assess complexity objectively based on variables: distance, vehicle type, urban vs. rural, mountainous terrains, weight, weather warnings, and cargo sensitivity.
- Keep recommendations action-oriented for the driver.`;

    const promptMessage = `Please analyze the following trip details and generate a professional driver and operations briefing according to the requested JSON structure:

Trip ID: ${tripId || "N/A"}
Driver Name: ${driverName || "N/A"}
Vehicle Type: ${vehicleType}
Cargo Type: ${cargoType || "General Freight"}
Cargo Weight: ${cargoWeight || "N/A"}
Pickup Location: ${pickupLocation}
Delivery Location: ${deliveryLocation}
Departure Date/Time: ${departureTime || "N/A"}
Estimated Distance: ${estimatedDistance || "N/A"}
Special Instructions: ${specialInstructions || "None provided"}

Generate appropriate data for each section:
1. routeOverview: A direct description of the route's start, end, total distance, and key landmarks/states crossed in 2 sentences.
2. routeNotes: Specific details about major highways, interstates, bypasses, or city transit routes they will use.
3. expectedChallenges: A list of 3-5 predicted challenges matching this specific route, departure time (e.g. night driving, rush hour), vehicle, or cargo weight.
4. fuelPlanning: Specific fueling recommendations (e.g., fuel range check, high-grade diesel station info, EV charging plan if electric, etc.).
5. tollNotes: Predict if they will encounter toll roads (such as EZPass, FasTrak, E-470, IPass, Port Authorities etc.) and remind them about payment pre-authorization.
6. deliveryInstructions: Summarize the administrator's special instructions and add priority actions like proof of delivery (POD), seal checks, or receiver contact details.
7. safetyRecommendations: A list of 3-5 highly practical safety recommendations (e.g. shift/sleep schedule, extreme weather handling, grade brakes on mountains, cargo securement checks).
8. tripComplexity: Select one of: "Easy", "Moderate", "High".
9. finalSummary: A warm, concise operations readiness statement and professional conclusion wishing them a safe run.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            routeOverview: {
              type: Type.STRING,
              description: "A summary of the route in simple language mentioning pickup/delivery points and distance.",
            },
            routeNotes: {
              type: Type.STRING,
              description: "Expected route details, highway paths, city streets, bypass roads, or mountain passes.",
            },
            expectedChallenges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Predict possible traffic, construction, narrow roads, remote deliveries, or schedule challenges.",
            },
            fuelPlanning: {
              type: Type.STRING,
              description: "Fuel efficiency suggestions or specific refueling stop requirements.",
            },
            tollNotes: {
              type: Type.STRING,
              description: "Information about expected tolls, express lanes, or toll pass requirements.",
            },
            deliveryInstructions: {
              type: Type.STRING,
              description: "Practical execution guidelines summarizing special instructions and operational handovers.",
            },
            safetyRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Safe practices tailored to the vehicle, cargo weight, and terrain.",
            },
            tripComplexity: {
              type: Type.STRING,
              description: "Easy, Moderate, or High complexity assessment.",
            },
            finalSummary: {
              type: Type.STRING,
              description: "Clear readiness report and positive departure summary.",
            },
          },
          required: [
            "routeOverview",
            "routeNotes",
            "expectedChallenges",
            "fuelPlanning",
            "tollNotes",
            "deliveryInstructions",
            "safetyRecommendations",
            "tripComplexity",
            "finalSummary",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini briefing generation failed:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while generating the trip summary.",
    });
  }
});

// Configure Vite or Static Asset Handling
async function startServer() {
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
    console.log(`Logistics Route Server running on port ${PORT}`);
  });
}

startServer();
