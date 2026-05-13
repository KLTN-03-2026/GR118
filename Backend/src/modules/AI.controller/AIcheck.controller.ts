import { NextFunction, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../utils/app-error';

const genAI = new GoogleGenerativeAI(process.env.KEY_AI_Google_API_KEY as string);

export const checkProfanity = async (req: Request, res: Response, next: NextFunction) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return next(new AppError(400, 'BAD_REQUEST', 'Title and description are required.'));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Is the following text profane or offensive? Answer with only "yes" or "no".
    Title: ${title}
    Description: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();

    const isProfane = text.includes('yes');

    res.status(200).json({ success: true, data: { isProfane }, message: 'Profanity check complete.' });
  } catch (error) {
    console.error('Error checking profanity with Google AI:', error);
    next(new Error('Failed to check profanity with AI.'));
  }
};
