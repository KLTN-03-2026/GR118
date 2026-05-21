import { Request, Response } from "express";
import Issue from "../../models/issue.model";
import Activity from "../../models/activity.model";

const GEMINI_API_KEY = process.env.KEY_AI_Google_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CATEGORY_MAP: Record<string, string> = {
  road: "Đường/Hạ tầng",
  garbage: "Rác thải",
  lighting: "Chiếu sáng",
  flood: "Ngập lụt",
  noise: "Tiếng ồn",
  other: "Khác",
};

const STATUS_MAP: Record<string, string> = {
  pending: "Chờ xử lý",
  received: "Đã tiếp nhận",
  processing: "Đang xử lý",
  need_info: "Cần bổ sung",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
};

async function buildContext(): Promise<string> {
  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  // Query issues from MongoDB
  const issues = await Issue.find({}).select("status category title location district city reportedAt").limit(100).lean();

  const total = issues.length;
  const pending = issues.filter((i) => i.status === "pending").length;
  const received = issues.filter((i) => i.status === "received").length;
  const processing = issues.filter((i) => i.status === "processing").length;
  const resolved = issues.filter((i) => i.status === "resolved").length;

  // Count by category
  const catCount: Record<string, number> = {};
  issues.forEach((i) => {
    if (i.category) catCount[i.category] = (catCount[i.category] || 0) + 1;
  });
  const topCats = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count]) => `  • ${CATEGORY_MAP[cat] || cat}: ${count} báo cáo`)
    .join("\n");

  // Recent active issues (pending/processing)
  const activeIssues = issues
    .filter((i) => ["pending", "received", "processing"].includes(i.status))
    .slice(0, 5)
    .map((i) => `  • [${STATUS_MAP[i.status]}] "${i.title}" tại ${i.district || i.location}, ${i.city}`)
    .join("\n");

  // Query activities from MongoDB
  const activities = await Activity.find({ status: { $ne: "cancelled" } })
    .select("title location startDate endDate status participants description")
    .limit(8)
    .lean();

  const activitiesText =
    activities.length > 0
      ? activities
          .map((a: any) => {
            const start = a.startDate ? new Date(a.startDate).toLocaleDateString("vi-VN") : "Chưa rõ";
            const end = a.endDate ? new Date(a.endDate).toLocaleDateString("vi-VN") : "Chưa rõ";
            const participants = Array.isArray(a.participants) ? a.participants.length : 0;
            return `  • [${a.status || "active"}] "${a.title}" tại ${a.location} (${start} → ${end}, ${participants} người tham gia)`;
          })
          .join("\n")
      : "  • Hiện chưa có hoạt động cộng đồng nào được lên lịch.";

  return `Bạn là trợ lý AI thông minh của hệ thống Báo cáo Vấn đề Đô thị Việt Nam.
Nhiệm vụ: Hỗ trợ người dùng về tình trạng báo cáo đô thị và các hoạt động cộng đồng.

📊 DỮ LIỆU THỰC TẾ (cập nhật lúc ${now}):

Tổng quan báo cáo vấn đề đô thị:
  • Tổng số: ${total} báo cáo
  • Chờ xử lý: ${pending}
  • Đã tiếp nhận: ${received}
  • Đang xử lý: ${processing}
  • Đã giải quyết: ${resolved}

Top danh mục báo cáo:
${topCats || "  • Chưa có dữ liệu"}

Báo cáo đang diễn ra (mới nhất):
${activeIssues || "  • Không có báo cáo đang diễn ra"}

Hoạt động cộng đồng / Tình nguyện:
${activitiesText}

HƯỚNG DẪN SỬ DỤNG:
  • Gửi báo cáo: Đăng nhập → "Báo cáo" → upload ảnh → AI phân loại → điền form → gửi
  • Theo dõi báo cáo: Trang cá nhân → "Báo cáo của tôi"
  • Đăng ký tình nguyện: Trang "Hoạt động" → chọn sự kiện → đăng ký
  • Liên hệ: Hotline 1900-xxxx | Email: hotro@baocao.vn (8:00–22:00)

QUY TẮC:
  1. Trả lời tiếng Việt, ngắn gọn, thân thiện, dùng emoji hợp lý
  2. Dùng dữ liệu thực tế ở trên để trả lời câu hỏi về số liệu/hoạt động
  3. Không bịa đặt thông tin
  4. Giữ câu trả lời dưới 200 từ`;
}

export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: "Gemini API key not configured" });
      return;
    }

    // Build context from DB
    const systemPrompt = await buildContext();

    // Build Gemini request body with conversation history
    const historyContents = (history as { role: string; content: string }[])
      .slice(-8)
      .map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        ...historyContents,
        { role: "user", parts: [{ text: message }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topK: 40,
        topP: 0.95,
      },
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[Chat] Gemini error:", errText);
      res.status(500).json({
        error: "Gemini API error",
        reply: "Xin lỗi, trợ lý AI đang gặp sự cố. Vui lòng thử lại sau! 🙏",
      });
      return;
    }

    const geminiData = await geminiRes.json() as any;
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!reply) {
      res.status(500).json({
        error: "Empty response from Gemini",
        reply: "Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại! 🙏",
      });
      return;
    }

    console.log(`[Chat] OK — "${reply.substring(0, 80)}..."`);
    res.json({ reply: reply.trim() });
  } catch (error: any) {
    console.error("[Chat Error]", error.message);
    res.status(500).json({
      error: error.message,
      reply: "Xin lỗi, trợ lý AI đang gặp sự cố. Vui lòng thử lại sau hoặc gọi hotline 1900-xxxx! 🙏",
    });
  }
};
