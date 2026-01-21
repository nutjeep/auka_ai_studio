
import { GoogleGenAI } from "@google/genai";
import { Tone } from "../types";

// Note: process.env.API_KEY is pre-configured
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImage = async (base64Image: string, instruction: string): Promise<string> => {
  const ai = getAI();
  const base64Data = base64Image.split(',')[1];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Data,
          },
        },
        {
          text: `Apply this modification precisely: ${instruction}. If the user asks to remove background, make the background solid white or transparent. If they ask to enhance, improve quality, lighting, and sharpness. Return the modified image as the primary part of the response.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from AI");
};

export const generateCaption = async (base64Image: string, tone: Tone, instruction: string): Promise<string> => {
  const ai = getAI();
  const base64Data = base64Image.split(',')[1];

  const tonePrompts: Record<Tone, string> = {
    Professional: "informative, clear, authoritative, and corporate-friendly",
    Persuasive: "engaging, call-to-action oriented, emotional, and convincing",
    Minimalist: "short, punchy, elegant, and using very few words",
    Luxury: "sophisticated, exclusive, high-end, and poetic"
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Data,
          },
        },
        {
          text: `Generate a social media caption for this image based on these instructions: "${instruction || 'Describe the image naturally'}". The tone should be ${tonePrompts[tone]}. Output only the caption text.`,
        },
      ],
    },
  });

  return response.text || "Could not generate caption.";
};
