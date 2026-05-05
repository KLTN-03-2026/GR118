import nodemailer from "nodemailer";

/**
 * Dịch vụ gửi Email quay lại sử dụng Gmail SMTP theo yêu cầu của người dùng
 */

const GMAIL_USER = process.env.GMAIL_USER || "thaibc14@gmail.com";
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || "lsgf jjoq kgrk jhsi").replace(/\s/g, "");

console.log(`[Email Service] Provider: GMAIL SMTP`);
console.log(`[Email Service] GMAIL_USER: ${GMAIL_USER}`);
console.log(`[Email Service] GMAIL_APP_PASSWORD: ${GMAIL_PASS.length} chars`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
  // Thêm các tùy chọn để tăng khả năng kết nối trên môi trường bị hạn chế
  pool: true,
  maxConnections: 3,
  socketTimeout: 30000,
  connectionTimeout: 30000,
} as any);

export async function sendOtpEmail(toEmail: string, otp: string, type: "register" | "reset" | "login"): Promise<void> {
  console.log(`[Email Service] Starting background dispatch of OTP to ${toEmail}...`);
  const subjects: Record<string, string> = {
    register: "🎉 Xác thực tài khoản BáoCáoVN",
    reset: "🔐 Khôi phục mật khẩu BáoCáoVN",
    login: "🔑 Mã đăng nhập BáoCáoVN",
  };

  const titles: Record<string, string> = {
    register: "Xác thực email đăng ký",
    reset: "Khôi phục mật khẩu",
    login: "Xác nhận đăng nhập",
  };

  const descriptions: Record<string, string> = {
    register: "Bạn đã đăng ký tài khoản tại BáoCáoVN. Vui lòng dùng mã OTP bên dưới để xác thực email của bạn.",
    reset: "Bạn đã yêu cầu khôi phục mật khẩu tại BáoCáoVN. Vui lòng dùng mã OTP bên dưới.",
    login: "Chúng tôi nhận được yêu cầu đăng nhập. Vui lòng dùng mã OTP bên dưới để xác nhận.",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px 24px; }
    .body p { color: #4b5563; font-size: 15px; line-height: 1.6; }
    .otp-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 900; color: #dc2626; letter-spacing: 10px; font-family: monospace; }
    .otp-timer { color: #9ca3af; font-size: 13px; margin-top: 8px; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 20px; }
    .warning p { color: #92400e; font-size: 13px; margin: 0; }
    .footer { background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇻🇳 BáoCáoVN</h1>
      <p>${titles[type]}</p>
    </div>
    <div class="body">
      <p>Xin chào,</p>
      <p>${descriptions[type]}</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-timer">⏱ Mã có hiệu lực trong <strong>10 phút</strong></div>
      </div>
      <div class="warning">
        <p>⚠️ <strong>Không chia sẻ mã này với bất kỳ ai.</strong> Đội ngũ BáoCáoVN sẽ không bao giờ hỏi mã OTP của bạn.</p>
      </div>
      <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
    </div>
    <div class="footer">
      <p>© 2026 BáoCáoVN • Hệ thống báo cáo vấn đề cộng đồng</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Hệ thống BáoCáoVN" <${GMAIL_USER}>`,
      to: toEmail,
      subject: subjects[type],
      html,
    });
    console.log(`[Email Service] ACTUAL SUCCESS: OTP sent to ${toEmail}. MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email Service] Failed to send OTP to ${toEmail} via Gmail SMTP.`);
    console.error(`[Email Service] Error details: ${error.message}`);
    console.log(`\n************************************************\n[BACKUP LOG] OTP Code for ${toEmail}: ${otp} (Type: ${type})\n************************************************\n`);
  }
}

export async function sendAccountCreationEmail(toEmail: string, userName: string, password: string): Promise<void> {
  console.log(`[Email Service] Starting background dispatch of Credentials to ${toEmail}...`);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px 24px; }
    .body p { color: #4b5563; font-size: 15px; line-height: 1.6; }
    .credential-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .credential-item { margin-bottom: 15px; }
    .credential-item:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #1e293b; font-size: 20px; font-weight: 800; font-family: monospace; }
    .warning { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 20px; }
    .warning p { color: #166534; font-size: 13px; margin: 0; }
    .footer { background: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    .cta-button { display: block; background: #4f46e5; color: white !important; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: 700; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇻🇳 BáoCáoVN</h1>
      <p>Tài khoản của bạn đã sẵn sàng</p>
    </div>
    <div class="body">
      <p>Xin chào,</p>
      <p>Hệ thống vừa tạo một tài khoản mới cho bạn. Dưới đây là thông tin đăng nhập cá nhân:</p>
      
      <div class="credential-box">
        <div class="credential-item">
          <div class="label">Tên đăng nhập</div>
          <div class="value">${userName}</div>
        </div>
        <div class="credential-item">
          <div class="label">Mật khẩu tạm thời</div>
          <div class="value">${password}</div>
        </div>
      </div>

      <div class="warning">
        <p>🔐 <strong>Bảo mật:</strong> Bạn sẽ được yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên.</p>
      </div>

      <a href="https://baocaovn.onrender.com" class="cta-button">Đăng nhập vào hệ thống</a>
    </div>
    <div class="footer">
      <p>© 2026 BáoCáoVN • Hệ thống quản lý đô thị thông minh</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Hệ thống BáoCáoVN" <${GMAIL_USER}>`,
      to: toEmail,
      subject: "🚀 Tài khoản BáoCáoVN của bạn đã sẵn sàng",
      html,
    });
    console.log(`[Email Service] ACTUAL SUCCESS: Credentials sent to ${toEmail}. MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email Service] Failed to send credentials to ${toEmail} via Gmail SMTP.`);
    console.error(`[Email Service] Error details: ${error.message}`);
    console.log(`\n************************************************\n[BACKUP LOG] ACCOUNT CREATED\nUser: ${userName}\nPassword: ${password}\nEmail: ${toEmail}\n************************************************\n`);
  }
}
