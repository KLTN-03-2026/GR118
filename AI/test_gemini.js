const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API Key found');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = [
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    'gemini-1.5-pro',
    'models/gemini-1.5-pro',
    'gemini-2.0-flash',
    'models/gemini-2.0-flash',
    'gemini-pro'
  ];

  for (const modelName of candidateModels) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      // Minor test with a simple text prompt
      const result = await model.generateContent("Hello");
      const response = await result.response;
      console.log(`✅ Success with ${modelName}: ${response.text().substring(0, 20)}...`);
      break; // Found one!
    } catch (e) {
      console.log(`❌ Failed with ${modelName}:`, e);
    }
  }
}

testModels();
