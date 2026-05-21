const { OpenAI } = require('openai');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { bmvbhash } = require('blockhash-core');
const { decode: decodeJpeg } = require('jpeg-js');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;
const KNOWLEDGE_PATH = path.join(__dirname, 'knowledge.json');
const UPLOADS_PATH = path.join(__dirname, 'uploads');
const DATASET_PATH = path.join(__dirname, 'dataset');

// The 8 Urban Classification Categories
const CATEGORIES = ["trash", "infrastructure", "signs", "trees", "flood", "electric", "construction", "encroachment"];

// Ensure directories exist
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH);
if (!fs.existsSync(DATASET_PATH)) fs.mkdirSync(DATASET_PATH);
CATEGORIES.forEach(cat => {
  const catPath = path.join(DATASET_PATH, cat);
  if (!fs.existsSync(catPath)) fs.mkdirSync(catPath);
});

const localAI = require('./local_ai');

// Start loading local model in background
localAI.loadModel();

// Initialize Knowledge Base (AI Memory)
let knowledge = [];
if (fs.existsSync(KNOWLEDGE_PATH)) {
  try {
    knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
    console.log(`AI Memory loaded: ${knowledge.length} items known.`);
  } catch (e) {
    console.error('Failed to load memory:', e);
    knowledge = [];
  }
}

// Helper: Calculate Hamming Distance between two hex strings
function hammingDistance(h1, h2) {
  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    const v1 = parseInt(h1[i], 16);
    const v2 = parseInt(h2[i], 16);
    let xor = v1 ^ v2;
    while (xor > 0) {
      if (xor & 1) distance++;
      xor >>= 1;
    }
  }
  return distance;
}

// Function to decode image buffer to RGBA data
function decodeImageBuffer(buffer, mimetype) {
  try {
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      return decodeJpeg(buffer, { useTandem: false });
    } else if (mimetype === 'image/png') {
      const png = PNG.sync.read(buffer);
      return {
        data: png.data,
        width: png.width,
        height: png.height
      };
    }
  } catch (e) {
    console.error('Decoding error:', e);
  }
  return null;
}

// Function to save verified image to dataset for training
function saveToDataset(sourcePath, category) {
  try {
    if (!CATEGORIES.includes(category)) return;
    const destDir = path.join(DATASET_PATH, category);
    const fileName = path.basename(sourcePath);
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`[Dataset] Image saved to category: ${category}`);
  } catch (e) {
    console.error('[Dataset Save Error]', e.message);
  }
}

// Function to calculate image fingerprint from decoded data
function calculateImageHashFromData(decoded) {
  try {
    if (!decoded) return null;
    return bmvbhash({
      data: decoded.data,
      width: decoded.width,
      height: decoded.height
    }, 16);
  } catch (e) {
    console.error('Hashing error:', e);
    return null;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Setup Multer for image uploads (Save to Disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  console.log('Gemini API Key loaded (starts with:', apiKey.substring(0, 8) + '...)');
}
const genAI = new GoogleGenerativeAI(apiKey || '');

// Initialize OpenAI (for Content Moderation)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log('Available models for this key:', data.models?.map(m => m.name).join(', ') || 'No models found');
  } catch (e) {
    console.warn('Could not list models (check internet/API key)');
  }
}

listModels();

// Try the most stable model identifier
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// ========== LOCAL PROFANITY FILTER ==========
const PROFANITY_KEYWORDS = [
  // Từ chửi thề thô tục
  'cụ', 'đụ', 'fuck', 'đéo', 'đít', 'dái', 'bu', 'ngu', 'khùng', 'điên', 'chó', 'lợn',
  'thằng', 'thèm', 'cơm', 'vãi', 'vẩy', 'vãy', 'hôi', 'bẩn', 'tục', 'vcl', 'đù',
  'địt', 'địt mẹ', 'chết', 'chết mẹ', 'mẹ kiếp', 'kiếp', 'mô tơ', 'motơ',
  'ngu lơn', 'ngu như', 'chán chết', 'chết tiệt', 'mủa lợn', 'tào lao',
  'x)', 'x(', // Viết tắt/lách luật từ xấu
  'f*ck', 'f**k', 'sh*t', 'sh**t', 'd*ck', 'd**k',
  // Xúc phạm nhân phẩm
  'tệ hại', 'hèn nhát', 'kẻ vô dụng', 'xấu xí',
  // Đe dọa/bạo lực
  'giết', 'tấn công', 'đánh đập', 'làm tổn thương',
  // More severe
  'mẹ kiếp', 'ba kiếp', 'tao', 'mày',
  // Lóng/xúc khích (từ người dùng report)
  'ổ gà', 'dự má', 'má', 'ba ba', 'bố tao', 'mẹ mày', 'cha mẹ',
  'loser', 'thằng ngu', 'thằng chó', 'thằng điên',
  'ăn cơm chưa', 'vã', 'cà', 'lồn', 'sml',
];

function checkProfanityLocal(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase().trim();

  // Check for exact word matches (more lenient to catch variations)
  for (const keyword of PROFANITY_KEYWORDS) {
    // Use simpler regex that doesn't require word boundaries
    // This catches keywords even within phrases
    if (lowerText.includes(keyword)) {
      console.log(`[Profanity Detected] Matched keyword: "${keyword}" in text: "${lowerText}"`);
      return true;
    }
  }
  return false;
}
// ============================================

app.get('/', (req, res) => {
  res.json({ status: 'AI Service is running' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// NEW: Content Moderation & Relevancy Validation Endpoint
app.post('/moderate', async (req, res) => {
  try {
    const { title, description, category, aiLabel } = req.body;

    if (!title || !description) {
      return res.status(400).json({ is_flagged: true, reason: "Tiêu đề và mô tả không được để trống." });
    }

    // LAYER 1: Quick local profanity check (ZERO TOLERANCE)
    if (checkProfanityLocal(title) || checkProfanityLocal(description)) {
      console.log(`[Moderation] Local filter caught profanity in title or description`);
      return res.json({
        is_flagged: true,
        reason: "Phát hiện ngôn từ tiêu cực/tục tĩu. Vui lòng kiểm tra lại nội dung."
      });
    }

    console.log(`[Moderation] Validating: "${title}" for category: ${category}`);

    // LAYER 2: GPT-4o-mini semantic check
    const prompt = `Bạn là một robot kiểm duyệt nội dung NGHIÊM KHẮC (ZERO TOLERANCE) cho ứng dụng Báo cáo vấn đề đô thị Việt Nam.
    
    ⚠️ CÓ BẬT CAM: Nếu có BẤT KỲ dấu hiệu ngôn từ tiêu cực/xúc phạm/thiếu văn hóa, PHẢI flag ngay (kể cả viết tắt/lách luật).
    
    Nhiệm vụ: Chặn lập tức các nội dung vi phạm sau:
    1. NGÔN TỪ TIÊU CỰC VÀ TỤC TĨU: Có bất kỳ từ chửi thề, tiếng lóng thô tục, xúc phạm, đe dọa, hoặc mang tính chất tiêu cực, gây thù ghét, thiếu văn hóa (kể cả viết lách luật hoặc viết tắt).
    2. QUẢNG CÁO VÀ SPAM: Các nội dung mời chào mua bán, quảng cáo dịch vụ (ví dụ: thông tắc bể phốt, gia sư, bán hàng online), lừa đảo, hoặc các đoạn văn lặp đi lặp lại vô nghĩa (bị spam).
    3. KHÔNG LIÊN QUAN: Nội dung không liên quan đến vấn đề đô thị thực tế hoặc hoàn toàn khác biệt với hình ảnh đã phân tích (Nhãn AI: ${aiLabel}, Danh mục: ${category}).

    Dữ liệu kiểm tra:
    Tiêu đề: ${title}
    Mô tả: ${description}

    HƯỚNG DẪN QUYẾT ĐỊNH:
    - Nếu có bất cứ dấu hiệu ngôn từ tiêu cực (dù nhỏ): is_flagged = true, reason = "Phát hiện ngôn từ tiêu cực/tục tĩu"
    - Nếu có quảng cáo/spam: is_flagged = true, reason = "Phát hiện nội dung quảng cáo/spam"
    - Nếu không liên quan: is_flagged = true, reason = "Nội dung không liên quan đến vấn đề đô thị"
    - Nếu OK hết: is_flagged = false, reason = null

    Trả về JSON chính xác:
    {
      "is_flagged": boolean,
      "reason": "string (Giải thích ngắn gọn lý do từ chối bằng tiếng Việt, hoặc null nếu OK)"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là một robot kiểm duyệt nội dung NGHIÊM KHẮC với chính sách ZERO TOLERANCE với ngôn từ tiêu cực." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Very low temp for consistent strict flagging
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log(`[Moderation Result] Flagged: ${result.is_flagged}, Reason: ${result.reason}`);

    res.json(result);

  } catch (error) {
    console.error('[Moderation Error]', error.message);
    // Fallback: If API fails, at least use local profanity check
    console.warn('[Moderation Fallback] API failed, using local profanity check as fallback');
    const hasProfanity = checkProfanityLocal(req.body?.title) || checkProfanityLocal(req.body?.description);
    if (hasProfanity) {
      return res.json({
        is_flagged: true,
        reason: "Phát hiện ngôn từ tiêu cực/tục tĩu (từ local filter do API lỗi)"
      });
    }
    // If local check passes, allow but log
    res.json({ is_flagged: false, reason: null });
  }
});

// Helper to check for valid image headers (JPEG/PNG)
function isValidImage(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const header = buffer.toString('hex', 0, 4).toUpperCase();
  const isJpeg = header.startsWith('FFD8FF');
  const isPng = header.startsWith('89504E47');
  return isJpeg || isPng;
}

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const start_time = Date.now();

    // 0. Initial Buffer Read
    const fileBuffer = fs.readFileSync(req.file.path);
    console.log(`[Step 0] File received: ${req.file.mimetype}, Size: ${req.file.size} bytes`);

    // Check Magic Numbers before any decoding
    if (!isValidImage(fileBuffer)) {
      console.warn('[Warning] Image header is invalid or corrupted. Trying Gemini only...');
    }

    // 1. Calculate Image Hash (Attempt decoding for hash only)
    let decoded = null;
    let currentHash = null;
    try {
      decoded = decodeImageBuffer(fileBuffer, req.file.mimetype);
      if (decoded) {
        currentHash = calculateImageHashFromData(decoded);
      }
    } catch (decodeErr) {
      console.warn(`[Step 1] Local decoding failed: ${decodeErr.message}`);
    }

    // 2. Check Memory
    if (currentHash) {
      console.log('[Step 2] Checking memory...');
      const match = knowledge.find(item => hammingDistance(item.hash, currentHash) < 10);
      if (match) {
        console.log(`[Memory Match] Found cached result in knowledge.json`);
        return res.json({
          ...match.result,
          confidence: match.result.confidence,
          source: 'local_memory',
          processing_time: (Date.now() - start_time) / 1000
        });
      }
    }

    // 3. AIService Call (Prioritize Gemini cloud)
    const canUseGemini = apiKey && apiKey !== '' && apiKey !== 'YOUR_API_KEY_HERE';

    if (canUseGemini) {
      try {
        console.log(`[Step 3] Calling Gemini AI (v1.5 Flash Latest)...`);

        const imagePart = {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: req.file.mimetype
          }
        };

        const prompt = `Bạn là chuyên gia phân tích đô thị tại Việt Nam. 
        Phân tích hình ảnh này và trả về JSON chính xác theo các trường:
        - is_valid: boolean (true nếu là vấn đề dân sinh)
        - label: string (CHỈ ĐỂ TÊN NHÓM TIẾNG VIỆT, ví dụ: "Rác thải", "Ngập lụt", "Hạ tầng hư hỏng", "Lấn chiếm vỉa hè")
        - category: string (CHỈ chọn 1 trong: "trash", "infrastructure", "signs", "trees", "flood", "electric", "construction", "encroachment", "other")
        - confidence: number (0-100)

        Yêu cầu: Phần 'label' không được chứa mô tả chi tiết, chỉ chứa tên của 1 trong 8 nhóm sau: Rác thải, Hạ tầng hư hỏng, Biển báo / Cột / Đèn, Cây cối nguy hiểm, Ngập lụt, Điện / Dây, Công trình, Lấn chiếm vỉa hè.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
        if (!jsonStr) throw new Error('AI returned invalid format');

        const analysis = JSON.parse(jsonStr);

        // Update Memory (ONLY for Gemini high-quality results)
        if (analysis.is_valid && currentHash && analysis.confidence > 80) {
          knowledge.unshift({ hash: currentHash, result: analysis });
          if (knowledge.length > 1000) knowledge.pop();
          fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledge, null, 2));
          console.log(`[Memory Update] Successfully saved result to knowledge.json (Hash: ${currentHash})`);

          // CRITICAL: Save to Dataset for future training
          saveToDataset(req.file.path, analysis.category);
        }

        const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
        logAnalysisResult('GEMINI', analysis, imageUrl);

        return res.json({
          ...analysis,
          image_url: imageUrl,
          source: 'gemini_ai',
          processing_time: (Date.now() - start_time) / 1000
        });

      } catch (geminiError) {
        console.warn(`[Gemini Failed] ${geminiError.message}`);
      }
    }

    // 4. Local AI Fallback (Only if decoding succeeded)
    if (decoded) {
      try {
        console.log('[Step 4] Running Local AI fallback...');
        const localAnalysis = await localAI.predict(decoded.data, decoded.width, decoded.height);

        if (localAnalysis) {
          // Update Memory (Now also for Local AI as requested)
          if (localAnalysis.is_valid && currentHash && localAnalysis.confidence > 20) {
            knowledge.unshift({ hash: currentHash, result: localAnalysis });
            if (knowledge.length > 1000) knowledge.pop();
            fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(knowledge, null, 2));
            console.log(`[Memory Update] Local AI result saved to knowledge.json (Hash: ${currentHash})`);
          }

          const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
          logAnalysisResult('LOCAL AI', localAnalysis, imageUrl);

          return res.json({
            ...localAnalysis,
            image_url: imageUrl,
            source: 'local_ai',
            processing_time: (Date.now() - start_time) / 1000
          });
        }
      } catch (localErr) {
        console.error(`[Local AI Error] ${localErr.message}`);
      }
    }

    // 5. Final Graceful Fallback (If no engine returned a result)
    return res.json({
      is_valid: false,
      label: "Không xác định (Lỗi giải mã/Kết nối)",
      category: "other",
      confidence: 0,
      source: 'error_fallback',
      processing_time: (Date.now() - start_time) / 1000
    });

  } catch (error) {
    const isRateLimit = error.message?.includes('429') || error.status === 429;

    if (isRateLimit) {
      console.warn('[AI Rate Limit] Gemini is busy, requested retry.');
      return res.status(429).json({
        message: 'AI Service is temporarily busy. Please wait a moment.',
        retry_after: 5
      });
    }

    console.error('SERVER ERROR during /analyze:', error);
    res.status(200).json({
      is_valid: false,
      label: "Lỗi hệ thống phân tích",
      category: "other",
      error: error.message,
      source: 'server_error_fallback'
    });
  }
});

// Helper to log results beautifully
function logAnalysisResult(engine, result, imageUrl) {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 [ANALYSIS COMPLETE] - ${engine}`);
  console.log(`📍 Link ảnh: ${imageUrl}`);
  console.log(`📝 Kết quả: ${result.label}`);
  console.log(`📂 Danh mục: ${result.category}`);
  console.log(`🎯 Độ tin cậy: ${result.confidence}%`);
  console.log(`✅ Hợp lệ: ${result.is_valid ? 'CÓ' : 'KHÔNG'}`);
  console.log('='.repeat(50) + '\n');
}

app.listen(port, () => {
  console.log(`AI Service running at http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('\x1b[33m%s\x1b[0m', 'Warning: GEMINI_API_KEY is missing in .env file!');
  }
});
