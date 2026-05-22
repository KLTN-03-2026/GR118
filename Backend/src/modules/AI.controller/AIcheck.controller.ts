import { NextFunction, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../../utils/app-error';

const genAI = new GoogleGenerativeAI(process.env.KEY_AI_Google_API_KEY as string);

// Danh sách model theo thứ tự ưu tiên
const AI_MODELS = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];

// ========== LOCAL PROFANITY FILTER (Layer 1 - Zero Tolerance) ==========
const VIETNAMESE_PROFANITIES: string[] = [
  // Từ chửi thề nặng
  'đụ', 'đéo', 'địt', 'lồn', 'cặc', 'buồi', 'dái',
  'đụ má', 'đụ mẹ', 'đụ mịe', 'đụ mị', 'dụ má', 'dự má', 'đủ má',
  'địt mẹ', 'địt má', 'đjt', 'djt',
  'vãi lồn', 'vãi cả lồn', 'hãm lồn', 'ngu lồn',
  'đầu buồi', 'đầu cặc', 'óc chó', 'ăn cứt', 'cứt',
  'chó đẻ', 'chó má', 'con đĩ', 'đĩ', 'điếm',
  // Viết tắt / lách luật
  'vcl', 'vkl', 'vl', 'đm', 'đcm', 'dcm', 'clm', 'cc',
  'đ.m', 'đ-m', 'd.m', 'v.l', 'sml',
  // Từ thô tục khác
  'mẹ kiếp', 'khốn nạn', 'chết tiệt',
  'nứng', 'phịch', 'chịch', 'xoạc',
  // Tiếng Anh phổ biến
  'fuck', 'f*ck', 'f**k', 'shit', 'sh*t', 'bitch', 'dick', 'asshole',
];

/**
 * Kiểm tra nội dung có chứa từ tục tĩu cục bộ hay không.
 * Sử dụng phương pháp includes() đơn giản để bắt cả các biến thể viết liền.
 */
function checkProfanityLocal(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase().trim();

  for (const keyword of VIETNAMESE_PROFANITIES) {
    if (lowerText.includes(keyword)) {
      console.log(`[Profanity Local] Matched keyword: "${keyword}" in text: "${lowerText.substring(0, 80)}..."`);
      return true;
    }
  }
  return false;
}
// ======================================================================

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

  // ===== LAYER 1: Bộ lọc cục bộ - Phản hồi tức thì =====
  if (checkProfanityLocal(title) || checkProfanityLocal(description)) {
    console.log(`[Profanity] Local filter caught profanity — blocking immediately.`);
    return res.status(200).json({
      success: true,
      data: { isProfane: true },
      message: 'Phát hiện từ ngữ không phù hợp (bộ lọc cục bộ).'
    });
  }

  // ===== LAYER 2: Gemini AI - Kiểm tra ngữ nghĩa sâu =====
  try {
    const prompt = `Is the following text profane or offensive? Answer with only "yes" or "no".
    Title: ${title}
    Description: ${description}`;

    const text = await tryGenerateContent(prompt);
    const isProfane = text.includes('yes');

    res.status(200).json({ success: true, data: { isProfane }, message: 'Profanity check complete.' });
  } catch (error: any) {
    console.error('Error checking profanity with Google AI:', error.message || error);

    // Nếu tất cả model đều hết quota → cho phép request đi qua (đã qua local filter rồi)
    if (error.status === 429) {
      console.warn('[AI Check] All models rate limited - allowing request through (passed local filter)');
      return res.status(200).json({ success: true, data: { isProfane: false }, message: 'Profanity check skipped (all models rate limited, passed local filter).' });
    }

    // Lỗi khác (API key sai, lỗi mạng...) → KHÔNG ném 500, cho qua vì đã pass local filter
    console.warn('[AI Check] Gemini API failed - allowing request through (passed local filter). Please check KEY_AI_Google_API_KEY on Render.');
    return res.status(200).json({
      success: true,
      data: { isProfane: false },
      message: 'Profanity check skipped (AI unavailable, passed local filter).'
    });
  }
};
