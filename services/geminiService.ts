import { GoogleGenAI, Content, Part, GenerateContentStreamResult } from "@google/genai";
import { Message, Attachment } from "../types";

const SYSTEM_INSTRUCTION = `You are Jiksar, a highly capable and helpful AI assistant. 
You are knowledgeable, precise, and friendly. 
When answering code questions, provide clear explanations. 
You can analyze images and text.
Always format your responses nicely using Markdown.`;

class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    // Ensure API Key is available
    this.apiKey = process.env.API_KEY || '';
    if (!this.apiKey) {
      console.error("API_KEY is missing from environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Prepares the history in the format expected by the API.
   */
  private formatHistory(messages: Message[]): Content[] {
    return messages.map((msg) => {
      const parts: Part[] = [];
      
      // Add text part
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Add image parts
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        });
      }

      return {
        role: msg.role,
        parts: parts,
      };
    });
  }

  /**
   * Streams a response from the model.
   */
  async *streamChatResponse(
    history: Message[],
    prompt: string,
    attachments: Attachment[],
    useSearch: boolean
  ): AsyncGenerator<{ text: string; groundingMetadata?: any }, void, unknown> {
    if (!this.apiKey) {
      yield { text: "Error: API Key is missing. Please check your configuration." };
      return;
    }

    const modelName = useSearch ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

    try {
      // Construct the current user message content
      const currentParts: Part[] = [{ text: prompt }];
      attachments.forEach((att) => {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });

      // Combine previous history with the new message
      // Note: We use generateContentStream with the full history as 'contents' 
      // to have stateless control over the context, which is easier for complex multi-turn + image logic.
      const formattedHistory = this.formatHistory(history);
      
      const contents: Content[] = [
        ...formattedHistory,
        { role: 'user', parts: currentParts }
      ];

      const config: any = {
        systemInstruction: SYSTEM_INSTRUCTION,
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const result: GenerateContentStreamResult = await this.ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: config,
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        yield { text, groundingMetadata };
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      yield { text: `Error: ${error.message || "Something went wrong."}` };
    }
  }
}

export const geminiService = new GeminiService();
