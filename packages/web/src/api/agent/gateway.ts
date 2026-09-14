import { createGateway } from "ai";

export const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Keep the production default stable, but allow cheaper/faster model routing per environment.
export const MODEL = process.env.REPURPOSE_MODEL?.trim() || "anthropic/claude-sonnet-4.6";
