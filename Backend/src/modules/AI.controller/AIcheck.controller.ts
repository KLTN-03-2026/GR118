import { NextFunction, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../utils/app-error';

const genAI = new GoogleGenerativeAI(process.env.KEY_AI_Google_API_KEY as string);

// Danh sách model theo thứ tự ưu tiên
const AI_MODELS = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];

async function tryGenerateContent(prompt: string): Promise<string> {
  let lastError: any;

  for (const modelName of AI_MODELS) {
    try {
      console.log(`[AI Check] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`[AI Check] Success with model: ${modelName}`);
      return response.text().trim().toLowerCase();
    } catch (error: any) {
      lastError = error;
      if (error.status === 429) {
        console.warn(`[AI Check] ${modelName} rate limited (429). Falling back to next model...`);
        continue;
      }
      // Lỗi khác (không phải rate limit) → dừng ngay
      throw error;
    }
  }

  // Tất cả model đều bị rate limit
  throw lastError;
}

export const checkProfanity = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return next(new AppError(400, 'BAD_REQUEST', 'Title and description are required.'));
  }

  try {
    const prompt = `Is the following text profane or offensive? Answer with only "yes" or "no".
    Title: ${title}
    Description: ${description}`;

    const text = await tryGenerateContent(prompt);
    const isProfane = text.includes('yes');

    res.status(200).json({ success: true, data: { isProfane }, message: 'Profanity check complete.' });
  } catch (error: any) {
    console.error('Error checking profanity with Google AI:', error.message || error);

    // Nếu tất cả model đều hết quota → cho phép request đi qua
    if (error.status === 429) {
      console.warn('[AI Check] All models rate limited - allowing request through');
      return res.status(200).json({ success: true, data: { isProfane: false }, message: 'Profanity check skipped (all models rate limited).' });
    }

    next(new Error('Failed to check profanity with AI.'));
  }
};
