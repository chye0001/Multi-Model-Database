import Anthropic from "@anthropic-ai/sdk";
import type { Review } from "../dtos/reviews/Review.dto.ts";

const API_KEY = process.env.ANTHROPIC_API_KEY!;

export class AiService {
  constructor() { }
  
  private client = new Anthropic({ apiKey: API_KEY });

  async generateSummary(reviews: Review[]): Promise<string> {
    const averageScore = reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length || 0;
    const prompt = `Outfit Reviews: ${reviews.map(review => review.text).join(", ")}\nAverage Review Score: ${averageScore.toFixed(1)}/5\n\nPlease provide a concise summary of this outfit, highlighting its key features and overall appeal.`;
    
    try {
      const message = await this.client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Summarize these outfit reviews in 1-2 sentences. Include the average score.\n\n${prompt}`
          },
        ],
      });
  
      const summary = message.content[0]?.type === "text" ? message.content[0].text : "No summary available";
      console.log(`Generated AI summary: ${summary}`);
      return summary;
    } catch (error) {
      console.error("Error generating AI summary:", error);
      throw new Error("Failed to generate AI summary");
    }
  }
}
