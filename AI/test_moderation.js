const fetch = require('node-fetch');

async function testModeration() {
  const testCases = [
    { title: "Báo cáo ổ gà", description: "Có ổ gà rất lớn tại đường Nguyễn Huệ, gây nguy hiểm cho người đi đường.", label: "Hợp lệ" },
    { title: "Quảng cáo", description: "Bán hàng online giá rẻ, liên hệ 0123456789 để được tư vấn.", label: "Quảng cáo" },
    { title: "Tiêu cực", description: "Cái bọn quản lý này làm ăn như hạch, đồ ngu ngục.", label: "Tiêu cực" },
    { title: "Spam", description: "asdasdasdasdasdasdasd", label: "Spam" },
  ];

  for (const tc of testCases) {
    console.log(`Testing: [${tc.label}] - ${tc.description}`);
    try {
      const response = await fetch("http://localhost:8000/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tc.title,
          description: tc.description,
          category: "road",
          aiLabel: "Hạ tầng"
        }),
      });
      const result = await response.json();
      console.log(`Result: Flagged=${result.is_flagged}, Reason=${result.reason}`);
      console.log('---');
    } catch (e) {
      console.error(`Failed to test: ${e.message}`);
    }
  }
}

testModeration();
