const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.error("Error: GEMINI_API_KEY environment variable not set.");
        process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        console.log("Testing Gemini API...");
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("SUCCESS: API is working.");
    } catch (error) {
        console.error("ERROR: API failed.");
        console.error(error);
    }
}

testGemini();
